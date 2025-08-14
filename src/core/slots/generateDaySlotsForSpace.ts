
import { DateTime } from "luxon";
import type { Espacio, Reserva, Slot } from "@/domain/types";
import { asDayBounds, partitionWindow, weekdayInTZ } from "@/utils/time/tz";

export function generateDaySlotsForSpace(
  espacio: Espacio,
  dateISO: string,
  slotMinutes: 15 | 30 | 60,
  reservas: Reserva[],
  nowISO?: string
): Slot[] {
  const tz = espacio.tz;
  const { start: dayStart } = asDayBounds(dateISO, tz);
  const weekday = weekdayInTZ(dateISO, tz);
  const dayWindows = espacio.horarios.find((h) => h.weekday === weekday)?.ventanas ?? [];

  const raw = dayWindows.flatMap((w) => partitionWindow(dateISO, tz, w, slotMinutes));

  let slots: Slot[] = raw.map(({ start, end }) => ({
    start: start.toISO()!,
    end: end.toISO()!,
    espacioId: espacio.id,
    state: "available",
  }));

  const blackoutDates = new Set(
    (espacio.blackouts || [])
      .map((b) => DateTime.fromISO(b, { zone: tz }).toISODate())
      .filter(Boolean)
  );
  const dayISO = dayStart.toISODate();
  if (blackoutDates.has(dayISO)) {
    slots = slots.map((s) => ({ ...s, state: "blackout", reason: "Día no operativo" }));
  }

  const reservasDelDia = reservas.filter((r) => {
    const rs = DateTime.fromISO(r.start, { zone: tz });
    return rs.hasSame(dayStart, "day") && r.espacioId === espacio.id && r.estado !== "cancelada";
  });

  if (reservasDelDia.length) {
    slots = slots.map((slot) => {
      const slotStart = DateTime.fromISO(slot.start, { zone: tz });
      const slotEnd = DateTime.fromISO(slot.end, { zone: tz });
      const overlaps = reservasDelDia.some((r) => {
        const rs = DateTime.fromISO(r.start, { zone: tz });
        const re = DateTime.fromISO(r.end, { zone: tz });
        return rs < slotEnd && re > slotStart;
      });
      return overlaps ? { ...slot, state: "busy" as const } : slot;
    });
  }

  const now = nowISO ? DateTime.fromISO(nowISO, { zone: tz }) : DateTime.now().setZone(tz);
  slots = slots.map((slot) => {
    const slotStart = DateTime.fromISO(slot.start, { zone: tz });
    if (slotStart <= now) return { ...slot, state: slot.state === "available" ? "past" : slot.state };
    return slot;
  });

  return slots;
}

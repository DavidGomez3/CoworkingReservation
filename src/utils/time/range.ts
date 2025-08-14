
import { DateTime } from "luxon";
import type { Espacio } from "@/domain/types";
import { asDayBounds, weekdayInTZ } from "./tz";

export function getGlobalRangeForDay(espacios: Espacio[], dateISO: string) {
  const tz = espacios[0]?.tz ?? "America/Panama";
  const { start: dayStart } = asDayBounds(dateISO, tz);

  let minStart: DateTime | null = null;
  let maxEnd: DateTime | null = null;

  for (const e of espacios) {
    const weekday = weekdayInTZ(dateISO, e.tz);
    const windows = e.horarios.find(h => h.weekday === weekday)?.ventanas ?? [];
    for (const w of windows) {
      const [sh, sm] = w.start.split(":").map(Number);
      const [eh, em] = w.end.split(":").map(Number);
      const s = DateTime.fromISO(dateISO, { zone: e.tz }).startOf("day").set({ hour: sh, minute: sm });
      const eTime = DateTime.fromISO(dateISO, { zone: e.tz }).startOf("day").set({ hour: eh, minute: em });
      minStart = !minStart || s.toMillis() < minStart.toMillis() ? s : minStart;
      maxEnd = !maxEnd || eTime.toMillis() > maxEnd.toMillis() ? eTime : maxEnd;
    }
  }

  if (!minStart || !maxEnd) {
    minStart = dayStart.set({ hour: 8, minute: 0 });
    maxEnd = dayStart.set({ hour: 19, minute: 0 });
  }

  return { tz, minStart, maxEnd } as const;
}

export function buildTicks(dateISO: string, espacios: Espacio[], slotMinutes: number) {
  const { tz, minStart, maxEnd } = getGlobalRangeForDay(espacios, dateISO);
  const ticks: DateTime[] = [];
  let cur = minStart;
  while (cur <= maxEnd) {
    ticks.push(cur);
    cur = cur.plus({ minutes: slotMinutes });
  }
  return { tz, ticks } as const;
}

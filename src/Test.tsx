import React, { useMemo, useState } from "react";
import { DateTime, Settings } from "luxon";
import { Circle, Clock, Info, MapPin, Timer } from "lucide-react";

// ======================================
// AgendaDayView – Grid por columnas (MVP)
// ======================================
// - Columna de HORAS fija a la izquierda (catálogo dinámico por slotMinutes)
// - Cada COLUMNA es un ESPACIO (sala), cada FILA una franja
// - Cada celda es un botón con estados: available | busy | blackout | disabledByRule | past | selected
// - Cálculo de slots por espacio en su TZ (Luxon)
// - RRULE se integrará luego; ahora reservas fake

// ===============================
// Tipos de dominio (resumen)
// ===============================
export type Horario = { weekday: number; ventanas: { start: string; end: string }[] }; // HH:mm
export type Espacio = {
  id: string;
  nombre: string;
  tz: string; // IANA
  capacidad: number;
  metadata?: Record<string, unknown>;
  horarios: Horario[];
  blackouts?: string[]; // ISO date o date-time
};

export type Reserva = {
  id: string;
  espacioId: string;
  start: string; // ISO en TZ del espacio
  end: string;   // ISO en TZ del espacio
  rrule?: string;
  exdates?: string[];
  estado: "confirmada" | "pendiente" | "cancelada";
  capacidadUsada?: number;
};

export type SlotState =
  | "available"
  | "busy"
  | "blackout"
  | "disabledByRule"
  | "past"
  | "selected";

export type Slot = {
  start: string; // ISO en TZ del espacio
  end: string;   // ISO en TZ del espacio
  espacioId: string;
  state: SlotState;
  reason?: string;
  capacityInfo?: { used: number; total: number };
};

// ===============================
// Datos fake (para validar layout)
// ===============================
const FAKE_ESPACIOS: Espacio[] = [
  {
    id: "sala-a",
    nombre: "Sala A (Reuniones)",
    tz: "America/Panama",
    capacidad: 8,
    metadata: { piso: 2, proyector: true },
    horarios: [
      { weekday: 1, ventanas: [{ start: "09:00", end: "12:00" }, { start: "13:00", end: "18:00" }] },
      { weekday: 2, ventanas: [{ start: "09:00", end: "12:00" }, { start: "13:00", end: "18:00" }] },
      { weekday: 3, ventanas: [{ start: "09:00", end: "12:00" }, { start: "13:00", end: "18:00" }] },
      { weekday: 4, ventanas: [{ start: "09:00", end: "12:00" }, { start: "13:00", end: "18:00" }] },
      { weekday: 5, ventanas: [{ start: "09:00", end: "12:00" }, { start: "13:00", end: "17:00" }] },
    ],
  },
  {
    id: "open-space",
    nombre: "Open Space",
    tz: "America/Panama",
    capacidad: 20,
    metadata: { piso: 1 },
    horarios: [
      { weekday: 1, ventanas: [{ start: "08:00", end: "17:00" }] },
      { weekday: 2, ventanas: [{ start: "08:00", end: "17:00" }] },
      { weekday: 3, ventanas: [{ start: "08:00", end: "17:00" }] },
      { weekday: 4, ventanas: [{ start: "08:00", end: "17:00" }] },
      { weekday: 5, ventanas: [{ start: "08:00", end: "16:00" }] },
    ],
  },
];

// Reservas fake (sin RRULE por ahora)
const FAKE_RESERVAS: Reserva[] = [];

// ===============================
// Utilidades de tiempo (TZ)
// ===============================
function asDayBounds(dateISO: string, tz: string) {
  const start = DateTime.fromISO(dateISO, { zone: tz }).startOf("day");
  const end = start.endOf("day");
  return { start, end };
}

function weekdayInTZ(dateISO: string, tz: string) {
  return DateTime.fromISO(dateISO, { zone: tz }).weekday; // 1 = Monday ... 7 = Sunday
}

// Particiona una ventana [HH:mm-HH:mm] en slots de N minutos
function partitionWindow(
  dateISO: string,
  tz: string,
  window: { start: string; end: string },
  slotMinutes: number
): { start: DateTime; end: DateTime }[] {
  const day = DateTime.fromISO(dateISO, { zone: tz }).startOf("day");
  const [sh, sm] = window.start.split(":").map(Number);
  const [eh, em] = window.end.split(":").map(Number);
  let cursor = day.set({ hour: sh, minute: sm, second: 0, millisecond: 0 });
  const limit = day.set({ hour: eh, minute: em, second: 0, millisecond: 0 });
  const slots: { start: DateTime; end: DateTime }[] = [];
  while (cursor < limit) {
    const next = cursor.plus({ minutes: slotMinutes });
    if (next > limit) break;
    slots.push({ start: cursor, end: next });
    cursor = next;
  }
  return slots;
}

// ===============================
// Rango global y catálogo de horas dinámico (depende de slotMinutes)
// ===============================
function getGlobalRangeForDay(espacios: Espacio[], dateISO: string) {
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
      minStart = !minStart || s < minStart ? s : minStart;
      maxEnd = !maxEnd || eTime > maxEnd ? eTime : maxEnd;
    }
  }

  // Fallback si no hay ventanas
  if (!minStart || !maxEnd) {
    minStart = dayStart.set({ hour: 8, minute: 0 });
    maxEnd = dayStart.set({ hour: 19, minute: 0 });
  }

  return { tz, minStart, maxEnd } as const;
}

function buildTicks(dateISO: string, espacios: Espacio[], slotMinutes: number) {
  const { tz, minStart, maxEnd } = getGlobalRangeForDay(espacios, dateISO);
  const ticks: DateTime[] = [];
  let cur = minStart;
  while (cur <= maxEnd) {
    ticks.push(cur);
    cur = cur.plus({ minutes: slotMinutes });
  }
  return { tz, ticks } as const;
}

// ===============================
// Headless: generación de slots por espacio
// ===============================
function generateDaySlotsForSpace(
  espacio: Espacio,
  dateISO: string,
  slotMinutes: 15 | 30 | 60,
  reservas: Reserva[],
  nowISO?: string
): Slot[] {
  const tz = espacio.tz;
  const { start: dayStart } = asDayBounds(dateISO, tz);
  const weekday = weekdayInTZ(dateISO, tz); // 1..7
  const dayWindows = espacio.horarios.find((h) => h.weekday === weekday)?.ventanas ?? [];

  const raw = dayWindows.flatMap((w) => partitionWindow(dateISO, tz, w, slotMinutes));

  let slots: Slot[] = raw.map(({ start, end }) => ({
    start: start.toISO()!,
    end: end.toISO()!,
    espacioId: espacio.id,
    state: "available",
  }));

  // Blackouts por fecha (día completo)
  const blackoutDates = new Set(
    (espacio.blackouts || [])
      .map((b) => DateTime.fromISO(b, { zone: tz }).toISODate())
      .filter(Boolean)
  );
  const dayISO = dayStart.toISODate();
  if (blackoutDates.has(dayISO)) {
    slots = slots.map((s) => ({ ...s, state: "blackout", reason: "Día no operativo" }));
  }

  // Ocupar slots por reservas existentes (sin RRULE aún, demo)
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
        return rs < slotEnd && re > slotStart; // solape
      });
      return overlaps ? { ...slot, state: "busy" as const } : slot;
    });
  }

  // Past (respecto a ahora en TZ del espacio)
  const now = nowISO ? DateTime.fromISO(nowISO, { zone: tz }) : DateTime.now().setZone(tz);
  slots = slots.map((slot) => {
    const slotStart = DateTime.fromISO(slot.start, { zone: tz });
    if (slotStart <= now) return { ...slot, state: slot.state === "available" ? "past" : slot.state };
    return slot;
  });

  return slots;
}

// ===============================
// UI Helpers (tokens visuales tailwind)
// ===============================
const stateStyles: Record<SlotState, string> = {
  available: "bg-transparent border border-zinc-300 hover:border-zinc-900 hover:bg-zinc-50",
  busy: "bg-zinc-200 text-zinc-500 border border-zinc-200 cursor-not-allowed",
  blackout: "bg-amber-50 text-amber-700 border border-amber-200 cursor-not-allowed",
  disabledByRule: "bg-zinc-100 text-zinc-400 border border-dashed border-zinc-200 cursor-not-allowed",
  past: "opacity-60 bg-transparent border border-zinc-200 cursor-not-allowed",
  selected: "ring-2 ring-zinc-900 bg-zinc-900 text-white border border-zinc-900",
};

// ===============================
// Componente principal de demo - GRID por columnas (espacios)
// ===============================
export default function AgendaDayViewDemo() {
  Settings.defaultLocale = "es-PA";

  const [dateISO, setDateISO] = useState<string>(DateTime.now().setZone("America/Panama").toISODate()!);
  const [slotMinutes, setSlotMinutes] = useState<15 | 30 | 60>(30);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  // Para MVP: mostramos SIEMPRE todos los espacios en columnas
  const espacios = FAKE_ESPACIOS;

  // Construimos un mapa espacioId -> slots
  const slotsBySpace = useMemo(() => {
    const map: Record<string, Slot[]> = {};
    for (const e of espacios) {
      map[e.id] = generateDaySlotsForSpace(e, dateISO, slotMinutes, FAKE_RESERVAS);
    }
    return map;
  }, [espacios, dateISO, slotMinutes]);

  // Catálogo de horas dinámico según `slotMinutes` y ventanas de todos los espacios
  const { tz, ticks } = useMemo(
    () => buildTicks(dateISO, espacios, slotMinutes),
    [dateISO, espacios, slotMinutes]
  );

  const legend = [
    { key: "available", label: "Disponible" },
    { key: "busy", label: "Ocupado" },
    { key: "blackout", label: "No operativo" },
    { key: "disabledByRule", label: "Regla" },
    { key: "past", label: "Pasado" },
    { key: "selected", label: "Seleccionado" },
  ] as const;

  return (
    <div className="min-h-dvh w-full bg-white text-zinc-900">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b bg-white/80 backdrop-blur px-4 md:px-6 py-3 flex items-center gap-3">
        <Clock className="size-5" />
        <h1 className="text-lg font-semibold">Agenda · Seleccionar horario</h1>
        <div className="ml-auto flex items-center gap-2 text-xs text-zinc-600">
          <Timer className="size-4" />
          <span>Slots de {slotMinutes} min</span>
          <span className="mx-2">·</span>
          <MapPin className="size-4" />
          <span className="rounded-full border px-2 py-0.5">TZ {tz}</span>
        </div>
      </header>

      {/* Controls Bar */}
      <section className="px-4 md:px-6 py-4 border-b bg-zinc-50/50">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Date picker nativo para la demo */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-zinc-700">Fecha</label>
            <input
              type="date"
              className="h-9 rounded-md border px-2 text-sm"
              value={dateISO}
              onChange={(e) => {
                setSelectedSlot(null);
                setDateISO(e.target.value);
              }}
            />
          </div>

          {/* Tamaño de slot */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-zinc-700">Tamaño de franja</label>
            <select
              className="h-9 rounded-md border px-2 text-sm"
              value={slotMinutes}
              onChange={(e) => {
                setSelectedSlot(null);
                setSlotMinutes(Number(e.target.value) as 15 | 30 | 60);
              }}
            >
              <option value={15}>15 minutos</option>
              <option value={30}>30 minutos</option>
              <option value={60}>60 minutos</option>
            </select>
          </div>
        </div>
      </section>

      {/* Encabezado de columnas: "Hora" + columnas por espacio */}
      <div className="px-4 md:px-6 mt-4 overflow-x-auto">
        <div className="min-w-[720px]">
          <div className="grid" style={{ gridTemplateColumns: `140px repeat(${espacios.length}, minmax(160px, 1fr))` }}>
            {/* Cabecera fija */}
            <div className="sticky top-[112px] z-10 bg-white border-b h-10 flex items-center px-2 text-xs text-zinc-500">Hora</div>
            {espacios.map((e) => (
              <div key={e.id} className="sticky top-[112px] z-10 bg-white border-b h-10 flex items-center px-3 text-sm font-medium">
                {e.nombre}
              </div>
            ))}
          </div>

          {/* Cuerpo: filas por tick, celdas por espacio */}
          <div className="grid" style={{ gridTemplateColumns: `140px repeat(${espacios.length}, minmax(160px, 1fr))` }}>
            {ticks.map((tick) => (
              <React.Fragment key={tick.toMillis()}>
                {/* Columna de horas (sticky a la izquierda) */}
                <div className="sticky left-0 z-10 bg-white/95 backdrop-blur border-b h-10 flex items-center px-2 text-xs text-zinc-600">
                  {tick.toFormat("HH:mm")}
                </div>

                {/* Celdas por espacio */}
                {espacios.map((e) => {
                  const slot = (slotsBySpace[e.id] || []).find(
                    (s) => DateTime.fromISO(s.start, { zone: e.tz }).toMillis() === tick.setZone(e.tz).toMillis()
                  );

                  // Si no hay slot exacto (fuera de ventanas), celda vacía
                  if (!slot) {
                    return (
                      <div key={e.id + "-" + tick.toMillis()} className="border-b h-10 bg-zinc-50/30" />
                    );
                  }

                  const isSelected = selectedSlot && selectedSlot.espacioId === e.id && selectedSlot.start === slot.start && selectedSlot.end === slot.end;
                  const visualState: SlotState = isSelected ? "selected" : slot.state;
                  const disabled = ["busy", "blackout", "disabledByRule", "past"].includes(slot.state);

                  return (
                    <button
                      key={e.id + "-" + slot.start}
                      type="button"
                      role="button"
                      aria-pressed={isSelected}
                      aria-disabled={disabled}
                      onClick={() => {
                        if (disabled) return;
                        setSelectedSlot(isSelected ? null : slot);
                      }}
                      className={`border-b h-10 m-1 rounded-md px-2 text-xs text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 ${stateStyles[visualState]}`}
                      title={slot.reason || undefined}
                    >
                      <div className="flex items-center gap-1">
                        <Circle className="size-3" />
                        <span className="font-medium">{DateTime.fromISO(slot.start, { zone: e.tz }).toFormat("HH:mm")}</span>
                      </div>
                    </button>
                  );
                })}
              </React.Fragment>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-zinc-600">
            {legend.map((l) => (
              <div key={l.key} className="flex items-center gap-2">
                <span className={`inline-block h-2.5 w-2.5 rounded ${l.key === "available" ? "border border-zinc-400" :
                  l.key === "busy" ? "bg-zinc-300" :
                    l.key === "blackout" ? "bg-amber-200" :
                      l.key === "disabledByRule" ? "bg-zinc-200" :
                        l.key === "past" ? "bg-zinc-100" :
                          "bg-zinc-900"
                  }`} />
                <span>{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Panel lateral de detalles (simple para la demo) */}
      <div className="px-4 md:px-6 py-6 max-w-2xl">
        <div className="border rounded-xl p-4 bg-zinc-50/50">
          <h2 className="text-sm font-semibold mb-3">Detalles</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between"><span className="text-zinc-600">Fecha</span><span className="font-medium">{DateTime.fromISO(dateISO, { zone: tz }).toFormat("cccc d LLL yyyy")}</span></div>
            <div className="flex items-center justify-between"><span className="text-zinc-600">Hora</span><span className="font-medium">{selectedSlot ? `${DateTime.fromISO(selectedSlot.start).setZone(tz).toFormat("HH:mm")} – ${DateTime.fromISO(selectedSlot.end).setZone(tz).toFormat("HH:mm")}` : "—"}</span></div>
            <div className="flex items-center justify-between"><span className="text-zinc-600">Espacio</span><span className="font-medium">{selectedSlot ? espacios.find(x => x.id === selectedSlot.espacioId)?.nombre : "—"}</span></div>
          </div>
          <button
            type="button"
            className="mt-4 w-full h-10 rounded-md bg-zinc-900 text-white text-sm disabled:opacity-50"
            disabled={!selectedSlot}
            onClick={() => {
              alert("Continuar con la reserva: " + (selectedSlot?.start ?? ""));
            }}
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
}

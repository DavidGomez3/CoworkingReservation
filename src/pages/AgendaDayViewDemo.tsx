import React, { useMemo, useState } from "react";
import { DateTime, Settings } from "luxon";
import { Circle, Clock, MapPin, Timer } from "lucide-react";
import { SpaceCardHeader } from "@/components/space/SpaceCardHeader";

import type { Slot, SlotState } from "@/domain/types";
import { buildTicks } from "@/utils/time/range";
import { generateDaySlotsForSpace } from "@/core/slots/generateDaySlotsForSpace";
import { slotClasses } from "@/ui/tokens/stateStyles";
import { isReservaMine } from "@/lib/agenda/isMine";

import { useEspacios, useReservasPage } from "@/lib/query/hooks";
import type { Reserva } from "@/lib/api/types";
import ReservaPopover from "@/components/reservas/ReservaPopover";

export default function AgendaDayViewDemo() {
  Settings.defaultLocale = "es-PA";

  const currentUserId = "usuario-123";
  const [dateISO, setDateISO] = useState<string>("2025-08-14");
  const [slotMinutes, setSlotMinutes] = useState<15 | 30 | 60>(30);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  const [formOpen, setFormOpen] = React.useState(false);
  const [formSlot, setFormSlot] = React.useState<{
    espacioId: string; inicioISO: string; finISO: string;
  } | null>(null);
  const { data: espacios = [], isLoading: loadingEspacios } = useEspacios();

  const pageSize = 100;
  const { data: reservasPag, isLoading: loadingReservas } = useReservasPage(1, pageSize);
  const reservas: Reserva[] = reservasPag?.items ?? [];

  const slotsBySpace = useMemo(() => {
    const map: Record<string, Slot[]> = {};

    for (const e of espacios) {
      const startTZ = DateTime.fromISO(dateISO, { zone: e.tz }).startOf("day");
      const endTZ = startTZ.endOf("day");

      const reservasE = reservas.filter((r) => {
        if (r.espacioId !== e.id) return false;
        const ini = DateTime.fromISO(r.inicioISO);
        const fin = DateTime.fromISO(r.finISO);
        return fin > startTZ && ini < endTZ;
      });

      const adaptadas = reservasE.map((r) => ({
        id: r.id,
        espacioId: r.espacioId,
        start: r.inicioISO,
        end: r.finISO,
        title: r.titulo,
      }));

      map[e.id] = generateDaySlotsForSpace(
        e,
        dateISO,
        slotMinutes,
        adaptadas as any
      );
    }

    return map;
  }, [espacios, reservas, dateISO, slotMinutes]);

  const { tz, ticks } = useMemo(
    () => buildTicks(dateISO, espacios, slotMinutes),
    [dateISO, espacios, slotMinutes]
  );

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

      <section className="px-4 md:px-6 py-4 border-b bg-zinc-50/50">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
      <div className="px-4 md:px-6 overflow-x-auto">
        <div className="min-w-[720px]">
          <div
            className="grid"
            style={{ gridTemplateColumns: `140px repeat(${espacios.length}, minmax(160px, 1fr))` }}
          >
            {/* Cabecera fija */}
            <div className="left-0 border-r sticky h-full z-10 bg-white border-b h-10 flex items-center px-2 text-xs text-zinc-500">
              Hora
            </div>
            {loadingEspacios ? (
              <div className="col-span-full h-10 flex items-center px-3 text-sm text-zinc-500">
                Cargando espacios…
              </div>
            ) : (
              espacios.map((e) => (
                <div className="p-1 border-b" key={e.id}>
                  <SpaceCardHeader espacio={e} />
                </div>

              ))
            )}
          </div>

          {/* Cuerpo: filas por tick, celdas por espacio */}
          <div
            className="grid items-center"
            style={{ gridTemplateColumns: `140px repeat(${espacios.length}, minmax(160px, 1fr))` }}
          >
            {ticks.map((tick) => (
              <React.Fragment key={tick.toMillis()}>
                {/* Columna de horas (sticky a la izquierda) */}
                <div className="sticky border-r left-0 z-10 bg-white/95 backdrop-blur border-b h-15 flex items-center px-2 text-xs text-zinc-600">
                  {tick.toFormat("HH:mm")}
                </div>

                {/* Celdas por espacio */}
                {espacios.map((e) => {
                  if (loadingReservas) {
                    return (
                      <div key={e.id + "-skeleton-" + tick.toMillis()} className="border-b h-15 bg-zinc-50/30" />
                    );
                  }

                  const slot = (slotsBySpace[e.id] || []).find(
                    (s) =>
                      DateTime.fromISO(s.start, { zone: e.tz }).toMillis() ===
                      tick.setZone(e.tz).toMillis()
                  );

                  if (!slot) {
                    return (
                      <div key={e.id + "-" + tick.toMillis()} className="border-b h-15 bg-zinc-50/30" />
                    );
                  }

                  const isSelected =
                    !!selectedSlot &&
                    selectedSlot.espacioId === e.id &&
                    selectedSlot.start === slot.start &&
                    selectedSlot.end === slot.end;
                  const visualState: SlotState = isSelected ? "selected" : slot.state;
                  const disabled = ["busy", "blackout", "disabledByRule", "past"].includes(slot.state);

                  let isMineBusy = false;
                  if (visualState === "busy") {
                    const sStart = DateTime.fromISO(slot.start, { zone: e.tz });
                    const sEnd = DateTime.fromISO(slot.end, { zone: e.tz });

                    isMineBusy = reservas.some((r) => {
                      if (r.espacioId !== e.id) return false;
                      const rStart = DateTime.fromISO(r.inicioISO, { zone: e.tz });
                      const rEnd = DateTime.fromISO(r.finISO, { zone: e.tz });
                      const solapa = +rStart < +sEnd && +rEnd > +sStart;
                      if (!solapa) return false;

                      // usa el set local (optimista) o, si existe, el owner devuelto por el backend
                      const mineBySet = isReservaMine(r.id);
                      const mineByOwner = (r as any).creadoPor === currentUserId;
                      return mineBySet || mineByOwner;
                    });
                  }

                  const finalClass = slotClasses(visualState, isMineBusy);

                  return (
                    <div key={e.id + "-" + slot.start} className="w-full h-15 border-b flex items-center">
                      <button
                        type="button"
                        role="button"
                        aria-pressed={isSelected}
                        aria-disabled={disabled}
                        onClick={() => {
                          if (disabled) return;
                          setSelectedSlot(isSelected ? null : slot);
                          setFormSlot({ espacioId: e.id, inicioISO: slot.start, finISO: slot.end });
                          setFormOpen(true);
                        }}
                        className={`w-full border-b h-10  m-1 rounded-md px-2 text-xs text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 ${finalClass}`}
                        title={slot.reason || undefined}
                      >
                        <div className="flex items-center gap-1">
                          <Circle className="size-3" />
                          <span className="font-medium">
                            {DateTime.fromISO(slot.start, { zone: e.tz }).toFormat("HH:mm")}
                          </span>
                        </div>
                      </button>
                    </div>
                  );
                })}

              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 md:px-6 py-6 max-w-2xl">
        <div className="border rounded-xl p-4 bg-zinc-50/50">
          <h2 className="text-sm font-semibold mb-3">Detalles</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-zinc-600">Fecha</span>
              <span className="font-medium">
                {DateTime.fromISO(dateISO, { zone: tz }).toFormat("cccc d LLL yyyy")}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-600">Hora</span>
              <span className="font-medium">
                {selectedSlot
                  ? `${DateTime.fromISO(selectedSlot.start).setZone(tz).toFormat("HH:mm")} – ${DateTime.fromISO(selectedSlot.end)
                    .setZone(tz)
                    .toFormat("HH:mm")}`
                  : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-600">Espacio</span>
              <span className="font-medium">
                {selectedSlot ? espacios.find((x) => x.id === selectedSlot.espacioId)?.nombre : "—"}
              </span>
            </div>
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
      <ReservaPopover
        espacios={espacios}
        page={1}
        pageSize={pageSize}
        defaultSlot={formSlot ?? undefined}
        open={formOpen}
        onOpenChange={setFormOpen}
      />
    </div >
  );
}

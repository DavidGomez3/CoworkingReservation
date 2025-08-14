// src/components/reservas/ReservaPopover.tsx
import * as React from "react";
import { DateTime } from "luxon";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import type { Espacio } from "@/domain/types";
import { useCreateReserva } from "@/lib/query/hooks";

function useCurrentUser() {
  return { id: "usuario-123", nombre: "Carlos" };
}

export function ReservaPopover({
  espacios,
  page = 1,
  pageSize = 10,
  defaultSlot,
  open,
  onOpenChange,
}: {
  espacios: Espacio[];
  page?: number;
  pageSize?: number;
  defaultSlot?: { espacioId: string; inicioISO: string; finISO: string };
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const user = useCurrentUser();

  const isControlled = typeof open === "boolean";
  const [internalOpen, setInternalOpen] = React.useState(false);
  const openState = isControlled ? (open as boolean) : internalOpen;
  const setOpenState = isControlled ? (onOpenChange as (o: boolean) => void) : setInternalOpen;

  const [espacioId, setEspacioId] = React.useState(defaultSlot?.espacioId ?? espacios[0]?.id ?? "");
  const [titulo, setTitulo] = React.useState("Reserva");
  const [fecha, setFecha] = React.useState<Date>(defaultSlot ? new Date(defaultSlot.inicioISO) : new Date());
  const [hora, setHora] = React.useState(defaultSlot ? DateTime.fromISO(defaultSlot.inicioISO).toFormat("HH:mm") : "09:00");
  const [duracionMin, setDuracionMin] = React.useState(
    defaultSlot ? DateTime.fromISO(defaultSlot.finISO).diff(DateTime.fromISO(defaultSlot.inicioISO), "minutes").minutes : 60
  );

  React.useEffect(() => {
    if (!defaultSlot) return;
    setEspacioId(defaultSlot.espacioId);
    setFecha(new Date(defaultSlot.inicioISO));
    setHora(DateTime.fromISO(defaultSlot.inicioISO).toFormat("HH:mm"));
    setDuracionMin(
      Math.max(
        15,
        Math.round(
          DateTime.fromISO(defaultSlot.finISO).diff(DateTime.fromISO(defaultSlot.inicioISO), "minutes").minutes || 60
        )
      )
    );
  }, [defaultSlot]);

  const crearReserva = useCreateReserva(page, pageSize);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const esp = espacios.find((x) => x.id === espacioId);
    if (!esp) return;

    const [h, m] = hora.split(":").map(Number);
    const start = DateTime.fromJSDate(fecha, { zone: esp.tz }).set({ hour: h, minute: m, second: 0, millisecond: 0 });
    const end = start.plus({ minutes: Number.isFinite(duracionMin) ? duracionMin : 60 });

    crearReserva.mutate({
      espacioId,
      titulo,
      inicioISO: start.toISO()!,
      finISO: end.toISO()!,
      creadoPor: user.id,
    } as any);

    setOpenState(false);
  };

  return (
    <Dialog open={openState} onOpenChange={setOpenState}>
      {/* Trigger oculto para permitir control externo */}
      <DialogTrigger asChild>
        <button type="button" className="hidden" aria-hidden />
      </DialogTrigger>

      <DialogContent className="sm:max-w-[480px] w-[92vw] max-w-[560px] p-6">
        <DialogTitle > Realice su reserva </DialogTitle>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2 w-full">
            <Label>Espacio</Label>
            <Select value={espacioId} onValueChange={setEspacioId} disabled={true}>
              <SelectTrigger><SelectValue placeholder="Selecciona un espacio" /></SelectTrigger>
              <SelectContent>
                {espacios.map((e) => (
                  <SelectItem key={e.id} value={e.id}>{e.nombre} · {e.tz}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Título</Label>
            <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Hora (HH:mm)</Label>
              <Input
                value={hora}
                disabled={true}
                onChange={(e) => setHora(e.target.value)}
                pattern="^([01]\\d|2[0-3]):([0-5]\\d)$"
              />
            </div>
            <div className="space-y-2">
              <Label>Duración (min)</Label>
              <Input
                disabled={true}
                type="number"
                min={15}
                step={15}
                value={duracionMin}
                onChange={(e) => setDuracionMin(parseInt(e.target.value || "60", 10))}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpenState(false)}>Cancelar</Button>
            <Button type="submit" disabled={crearReserva.isPending}>
              {crearReserva.isPending ? "Guardando…" : "Crear reserva"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default ReservaPopover;

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { listEspacios, listReservas, createReserva, getEspacio, deleteReserva } from "../api/services";
import { CreateReservaInput, Paginated, Reserva } from "../api/types";
import { qk } from "./keys";
import { MisReservas } from "@/lib/state/misReservas";

export function useEspacios() {
  return useQuery({
    queryKey: qk.espacios(),
    queryFn: listEspacios,
    staleTime: 60_000,
  });
}

export function useEspacio(id: string) {
  return useQuery({
    queryKey: qk.espacio(id),
    queryFn: () => getEspacio(id),
    enabled: !!id,
    staleTime: 60_000,
  });
}

export function useReservasPage(page: number, pageSize: number) {
  return useQuery({
    queryKey: qk.reservasPage(page, pageSize),
    queryFn: () => listReservas(page, pageSize),
  });
}

// Optimistic create: inserta en la página actual si corresponde
export function useCreateReserva(page: number, pageSize: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateReservaInput) => createReserva(input),
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: qk.reservasPage(page, pageSize) });
      const key = qk.reservasPage(page, pageSize);
      const previous = qc.getQueryData<Paginated<Reserva>>(key);

      let optimisticId = `optimistic-${crypto.randomUUID()}`;

      if (previous) {
        const optimistic: Paginated<Reserva> = {
          ...previous,
          items: [
            {
              id: optimisticId,
              espacioId: input.espacioId,
              titulo: (input as any).titulo ?? "Reserva",
              inicioISO: (input as any).inicioISO,
              finISO: (input as any).finISO,
              creadoPor: (input as any).creadoPor,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            } as unknown as Reserva,
            ...previous.items,
          ].slice(0, previous.pageSize),
          total: previous.total + 1,
          totalPages: Math.max(1, Math.ceil((previous.total + 1) / previous.pageSize)),
        };
        qc.setQueryData(key, optimistic);
      }

      MisReservas.add(optimisticId);

      return { previous, optimisticId };
    },
    onError: (_err, _input, ctx) => {
      if (ctx?.previous) qc.setQueryData(qk.reservasPage(page, pageSize), ctx.previous);
      if (ctx?.optimisticId) MisReservas.remove(ctx.optimisticId);
    },
    onSuccess: (data, _input, ctx) => {
      // Cuando llega el ID real, sustituimos el optimista en el store
      if (ctx?.optimisticId && data?.id) {
        MisReservas.replaceTemp(ctx.optimisticId, data.id);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: qk.reservasPage(page, pageSize) });
    },
  });
}

export function useDeleteReserva(page: number, pageSize: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteReserva(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: qk.reservasPage(page, pageSize) });
      const key = qk.reservasPage(page, pageSize);
      const previous = qc.getQueryData<Paginated<Reserva>>(key);
      if (previous) {
        const optimistic: Paginated<Reserva> = {
          ...previous,
          items: previous.items.filter((r) => r.id !== id),
          total: Math.max(0, previous.total - 1),
          totalPages: Math.max(1, Math.ceil(Math.max(0, previous.total - 1) / previous.pageSize)),
        };
        qc.setQueryData(key, optimistic);
      }
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) qc.setQueryData(qk.reservasPage(page, pageSize), ctx.previous);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: qk.reservasPage(page, pageSize) });
    },
  });
}

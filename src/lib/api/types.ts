import { z } from "zod";

export const HorarioSchema = z.object({
  weekday: z.number().int().min(0).max(6),
  ventanas: z.array(z.object({ start: z.string(), end: z.string() })).min(1),
});
export type Horario = z.infer<typeof HorarioSchema>;

export const EspacioSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  descripcion: z.string().optional(),
  capacidad: z.number().int().positive(),
  tz: z.string().default("UTC"),
  horarios: z.array(HorarioSchema).min(1),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Espacio = z.infer<typeof EspacioSchema>;

export const ReservaSchema = z.object({
  id: z.string(),
  espacioId: z.string(),
  titulo: z.string(),
  inicioISO: z.string(),
  finISO: z.string(),
  creadoPor: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Reserva = z.infer<typeof ReservaSchema>;

export type Paginated<T> = {
  items: T[];
  page: number; // 1-based
  pageSize: number;
  total: number;
  totalPages: number;
};

export const CreateReservaInputSchema = z.object({
  espacioId: z.string().min(1),
  titulo: z.string().min(1),
  inicioISO: z.string(),
  finISO: z.string(),
  creadoPor: z.string().min(1),
});
export type CreateReservaInput = z.infer<typeof CreateReservaInputSchema>;

export class ApiError extends Error {
  status: number;
  data?: unknown;
  constructor(message: string, status = 500, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

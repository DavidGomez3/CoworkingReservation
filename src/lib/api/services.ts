import { env, http } from "./client";
import {
  Espacio,
  Reserva,
  Paginated,
  CreateReservaInput,
  CreateReservaInputSchema,
} from "./types";
import {
  fakeListEspacios,
  fakeListReservas,
  fakeCreateReserva,
  fakeGetEspacio,
  fakeDeleteReserva,
} from "./fakeDb";

export async function listEspacios(): Promise<Espacio[]> {
  if (env.USE_FAKE) return fakeListEspacios();
  return http<Espacio[]>("/espacios");
}

export async function getEspacio(id: string): Promise<Espacio> {
  if (env.USE_FAKE) return fakeGetEspacio(id);
  return http<Espacio>(`/espacios/${id}`);
}

export async function listReservas(page = 1, pageSize = 10): Promise<Paginated<Reserva>> {
  if (env.USE_FAKE) return fakeListReservas(page, pageSize);
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  return http<Paginated<Reserva>>(`/reservas?${params.toString()}`);
}

export async function createReserva(input: CreateReservaInput): Promise<Reserva> {
  // valida antes de enviar
  CreateReservaInputSchema.parse(input);
  if (env.USE_FAKE) return fakeCreateReserva(input);
  return http<Reserva>(`/reservas`, { method: "POST", body: JSON.stringify(input) });
}

export async function deleteReserva(id: string): Promise<{ id: string }> {
  if (env.USE_FAKE) return fakeDeleteReserva(id);
  await http<void>(`/reservas/${id}`, { method: "DELETE" });
  return { id };
}

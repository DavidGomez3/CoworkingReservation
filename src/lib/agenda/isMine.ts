import { MisReservas } from "@/lib/state/misReservas";
/**
 * Devuelve true si la reserva pertenece al usuario actual.
 * (IDs optimistas y luego reales mediante replaceTemp).
 */
export function isReservaMine(reservaId?: string) {
  if (!reservaId) return false;
  return MisReservas.has(reservaId);
}

export type Horario = {
  weekday: number;
  ventanas: { start: string; end: string }[]; // HH:mm
};

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

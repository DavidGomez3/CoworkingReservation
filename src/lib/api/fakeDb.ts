// Fuente de datos en memoria + utilidades de paginación (SEED ampliado)
import { Espacio, Reserva, Paginated, CreateReservaInput } from "./types";

const nowISO = () => new Date().toISOString();
const makeId = () => crypto.randomUUID();

// Helper para construir ISO "del día" a una hora HH:MM local
const isoAt = (dateISO: string, hhmm: string) => new Date(`${dateISO}T${hhmm}:00`).toISOString();

// Fecha base para seed masivo (hoy por defecto)
const todayISO = new Date().toISOString().slice(0, 10);

// Datos iniciales de espacios (puedes añadir más sin romper nada)
let ESPACIOS: Espacio[] = [
  {
    id: "sala-1",
    nombre: "Sala A",
    descripcion: "Sala de reuniones grande",
    capacidad: 10,
    tz: "America/Panama",
    horarios: [1, 2, 3, 4, 5].map(weekday => ({
      weekday,
      ventanas: [{ start: "08:00", end: "18:00" }],
    })),
    createdAt: nowISO(),
    updatedAt: nowISO(),
  },
  {
    id: "sala-2",
    nombre: "Sala B",
    descripcion: "Huddle room",
    capacidad: 4,
    tz: "America/Panama",
    horarios: [1, 2, 3, 4, 5].map(weekday => ({
      weekday,
      ventanas: [{ start: "09:00", end: "17:00" }],
    })),
    createdAt: nowISO(),
    updatedAt: nowISO(),
  },
  {
    id: "area-1",
    nombre: "Área abierta 1",
    descripcion: "Espacio compartido",
    capacidad: 16,
    tz: "America/Panama",
    horarios: [1, 2, 3, 4, 5, 6].map(weekday => ({
      weekday,
      ventanas: [{ start: "07:00", end: "19:00" }],
    })),
    createdAt: nowISO(),
    updatedAt: nowISO(),
  },
];

// ────────────────────────────────────────────────────────────────────────────
// SEED de reservas: variedad de duraciones, huecos, solapes y días distintos
// Tipos visuales:
//  - busy → reservas reales (estas)
//  - past → lo calcula la UI por tiempo
//  - blackout / fuera de ventana → celdas sin slot (ya lo maneja el generador)
//  - disabledByRule → lo añadiremos cuando metas reglas; por ahora no aplica
// ────────────────────────────────────────────────────────────────────────────

let RESERVAS: Reserva[] = [];

function seedDay(dateISO: string) {
  const base: Reserva[] = [
    // SALA 1 — bloque largo + bloques cortos y solapes
    {
      id: makeId(),
      espacioId: "sala-1",
      titulo: "Workshop UX",
      inicioISO: isoAt(dateISO, "09:00"),
      finISO: isoAt(dateISO, "11:00"),
      creadoPor: "ana",
      createdAt: nowISO(),
      updatedAt: nowISO(),
    },
    {
      id: makeId(),
      espacioId: "sala-1",
      titulo: "Retro Sprint",
      inicioISO: isoAt(dateISO, "11:30"),
      finISO: isoAt(dateISO, "12:00"),
      creadoPor: "carlos",
      createdAt: nowISO(),
      updatedAt: nowISO(),
    },
    // Solape parcial con el largo anterior (visual de conflicto)
    {
      id: makeId(),
      espacioId: "sala-1",
      titulo: "Stakeholders sync",
      inicioISO: isoAt(dateISO, "10:30"),
      finISO: isoAt(dateISO, "11:30"),
      creadoPor: "marcos",
      createdAt: nowISO(),
      updatedAt: nowISO(),
    },

    // SALA 2 — ráfagas de 30 min durante la tarde
    {
      id: makeId(),
      espacioId: "sala-2",
      titulo: "1:1 Diseño",
      inicioISO: isoAt(dateISO, "14:00"),
      finISO: isoAt(dateISO, "14:30"),
      creadoPor: "ana",
      createdAt: nowISO(),
      updatedAt: nowISO(),
    },
    {
      id: makeId(),
      espacioId: "sala-2",
      titulo: "1:1 Backend",
      inicioISO: isoAt(dateISO, "14:30"),
      finISO: isoAt(dateISO, "15:00"),
      creadoPor: "david",
      createdAt: nowISO(),
      updatedAt: nowISO(),
    },
    {
      id: makeId(),
      espacioId: "sala-2",
      titulo: "Soporte cliente",
      inicioISO: isoAt(dateISO, "16:00"),
      finISO: isoAt(dateISO, "17:00"),
      creadoPor: "lina",
      createdAt: nowISO(),
      updatedAt: nowISO(),
    },

    // ÁREA 1 — bloques variados, incluyendo uno muy corto (15m)
    {
      id: makeId(),
      espacioId: "area-1",
      titulo: "Cowork: equipo producto",
      inicioISO: isoAt(dateISO, "10:00"),
      finISO: isoAt(dateISO, "12:30"),
      creadoPor: "equipo",
      createdAt: nowISO(),
      updatedAt: nowISO(),
    },
    {
      id: makeId(),
      espacioId: "area-1",
      titulo: "Standup express",
      inicioISO: isoAt(dateISO, "12:45"),
      finISO: isoAt(dateISO, "13:00"),
      creadoPor: "equipo",
      createdAt: nowISO(),
      updatedAt: nowISO(),
    },
    {
      id: makeId(),
      espacioId: "area-1",
      titulo: "Onboarding",
      inicioISO: isoAt(dateISO, "15:30"),
      finISO: isoAt(dateISO, "16:30"),
      creadoPor: "rh",
      createdAt: nowISO(),
      updatedAt: nowISO(),
    },
  ];
  RESERVAS.push(...base);
}

// Seed para hoy, ayer y mañana para probar filtros y estados "past"
seedDay(todayISO);
seedDay(new Date(Date.now() - 24 * 3600 * 1000).toISOString().slice(0, 10)); // ayer
seedDay(new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 10)); // mañana

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function fakeListEspacios(): Promise<Espacio[]> {
  await delay(250);
  return [...ESPACIOS];
}

export async function fakeGetEspacio(id: string): Promise<Espacio> {
  await delay(200);
  const e = ESPACIOS.find((x) => x.id === id);
  if (!e) throw new Error("Espacio no encontrado");
  return e;
}

export async function fakeListReservas(page = 1, pageSize = 10): Promise<Paginated<Reserva>> {
  await delay(300);
  const start = (page - 1) * pageSize;
  const items = RESERVAS.slice(start, start + pageSize);
  const total = RESERVAS.length;
  return {
    items: [...items],
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function fakeCreateReserva(input: CreateReservaInput): Promise<Reserva> {
  await delay(300);
  const existsEspacio = ESPACIOS.some((e) => e.id === input.espacioId);
  if (!existsEspacio) throw new Error("Espacio no existe");

  const nueva: Reserva = {
    id: makeId(),
    ...input,
    createdAt: nowISO(),
    updatedAt: nowISO(),
  };
  // Insertar primero para que aparezca arriba
  RESERVAS = [nueva, ...RESERVAS];
  return nueva;
}

export async function fakeDeleteReserva(id: string): Promise<{ id: string }> {
  await delay(250);
  const before = RESERVAS.length;
  RESERVAS = RESERVAS.filter((r) => r.id !== id);
  if (RESERVAS.length === before) throw new Error("Reserva no encontrada");
  return { id };
}

// Utilidades para pruebas manuales (opcional)
export function __resetFakeDb(data?: { espacios?: Espacio[]; reservas?: Reserva[] }) {
  if (data?.espacios) ESPACIOS = data.espacios;
  if (data?.reservas) RESERVAS = data.reservas;
}

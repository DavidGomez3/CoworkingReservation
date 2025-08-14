import { DateTime } from "luxon";
import { Espacio, Reserva, Paginated, CreateReservaInput } from "./types";

const nowISO = () => new Date().toISOString();
const makeId = () => crypto.randomUUID();
const isoAt = (dateISO: string, hhmm: string, tz = "America/Panama") => {
  const [h, m] = hhmm.split(":").map(Number);
  return DateTime.fromISO(dateISO, { zone: tz })
    .set({ hour: h, minute: m, second: 0, millisecond: 0 })
    .toISO();
};

let ESPACIOS: Espacio[] = [
  {
    id: "sala-1",
    nombre: "Sala A",
    descripcion: "Sala de reuniones grande",
    capacidad: 10,
    tz: "America/Panama",
    horarios: [1, 2, 3, 4, 5].map((weekday) => ({
      weekday,
      ventanas: [{ start: "08:00", end: "18:00" }],
    })),
    imageUrl: "/assets/espacios/sala-a.jpg",
    createdAt: nowISO(),
    updatedAt: nowISO(),
  },
  {
    id: "sala-2",
    nombre: "Sala B",
    descripcion: "Huddle room",
    capacidad: 4,
    tz: "America/Panama",
    horarios: [1, 2, 3, 4, 5].map((weekday) => ({
      weekday,
      ventanas: [{ start: "09:00", end: "17:00" }],
    })),
    imageUrl: "/assets/espacios/sala-b.jpg",
    createdAt: nowISO(),
    updatedAt: nowISO(),
  },
  {
    id: "area-1",
    nombre: "Área abierta 1",
    descripcion: "Espacio compartido",
    capacidad: 16,
    tz: "America/Panama",
    horarios: [1, 2, 3, 4, 5, 6].map((weekday) => ({
      weekday,
      ventanas: [{ start: "07:00", end: "19:00" }],
    })),
    imageUrl: "/assets/espacios/area-1.jpg",
    createdAt: nowISO(),
    updatedAt: nowISO(),
  },
];

const SEED_DATE_ISO = "2025-08-14";

let RESERVAS: Reserva[] = [];

function seedDayMorningAug14() {
  RESERVAS.push(
    // SALA 1 — 9:00–10:00, 10:30–11:00, 11:30–12:00
    {
      id: makeId(),
      espacioId: "sala-1",
      titulo: "Workshop UX",
      inicioISO: isoAt(SEED_DATE_ISO, "09:00"),
      finISO: isoAt(SEED_DATE_ISO, "10:00"),
      creadoPor: "ana",
      createdAt: nowISO(),
      updatedAt: nowISO(),
    },
    {
      id: makeId(),
      espacioId: "sala-1",
      titulo: "Stakeholders sync",
      inicioISO: isoAt(SEED_DATE_ISO, "10:30"),
      finISO: isoAt(SEED_DATE_ISO, "11:00"),
      creadoPor: "marcos",
      createdAt: nowISO(),
      updatedAt: nowISO(),
    },
    {
      id: makeId(),
      espacioId: "sala-1",
      titulo: "Retro Sprint",
      inicioISO: isoAt(SEED_DATE_ISO, "11:30"),
      finISO: isoAt(SEED_DATE_ISO, "12:00"),
      creadoPor: "carlos",
      createdAt: nowISO(),
      updatedAt: nowISO(),
    },

    // SALA 2 — 9:30–10:00, 10:00–10:30, 11:00–11:30
    {
      id: makeId(),
      espacioId: "sala-2",
      titulo: "1:1 Diseño",
      inicioISO: isoAt(SEED_DATE_ISO, "09:30"),
      finISO: isoAt(SEED_DATE_ISO, "10:00"),
      creadoPor: "ana",
      createdAt: nowISO(),
      updatedAt: nowISO(),
    },
    {
      id: makeId(),
      espacioId: "sala-2",
      titulo: "1:1 Backend",
      inicioISO: isoAt(SEED_DATE_ISO, "10:00"),
      finISO: isoAt(SEED_DATE_ISO, "10:30"),
      creadoPor: "david",
      createdAt: nowISO(),
      updatedAt: nowISO(),
    },
    {
      id: makeId(),
      espacioId: "sala-2",
      titulo: "Soporte cliente",
      inicioISO: isoAt(SEED_DATE_ISO, "11:00"),
      finISO: isoAt(SEED_DATE_ISO, "11:30"),
      creadoPor: "lina",
      createdAt: nowISO(),
      updatedAt: nowISO(),
    },

    // ÁREA 1 — 8:30–10:00, 10:30–11:00, 11:30–12:00
    {
      id: makeId(),
      espacioId: "area-1",
      titulo: "Cowork: equipo producto",
      inicioISO: isoAt(SEED_DATE_ISO, "08:30"),
      finISO: isoAt(SEED_DATE_ISO, "10:00"),
      creadoPor: "equipo",
      createdAt: nowISO(),
      updatedAt: nowISO(),
    },
    {
      id: makeId(),
      espacioId: "area-1",
      titulo: "Standup express",
      inicioISO: isoAt(SEED_DATE_ISO, "10:30"),
      finISO: isoAt(SEED_DATE_ISO, "11:00"),
      creadoPor: "equipo",
      createdAt: nowISO(),
      updatedAt: nowISO(),
    },
    {
      id: makeId(),
      espacioId: "area-1",
      titulo: "Onboarding",
      inicioISO: isoAt(SEED_DATE_ISO, "11:30"),
      finISO: isoAt(SEED_DATE_ISO, "12:00"),
      creadoPor: "rh",
      createdAt: nowISO(),
      updatedAt: nowISO(),
    }
  );
}

seedDayMorningAug14();

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

export async function fakeListReservas(
  page = 1,
  pageSize = 10
): Promise<Paginated<Reserva>> {
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

export async function fakeCreateReserva(
  input: CreateReservaInput
): Promise<Reserva> {
  await delay(300);
  const nueva: Reserva = {
    id: makeId(),
    ...input,
    createdAt: nowISO(),
    updatedAt: nowISO(),
  };
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

export function __resetFakeDb(data?: {
  espacios?: Espacio[];
  reservas?: Reserva[];
}) {
  if (data?.espacios) ESPACIOS = data.espacios;
  if (data?.reservas) RESERVAS = data.reservas;
}

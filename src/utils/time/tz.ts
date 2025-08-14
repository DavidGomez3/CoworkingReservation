import { DateTime } from "luxon";

export function asDayBounds(dateISO: string, tz: string) {
  const start = DateTime.fromISO(dateISO, { zone: tz }).startOf("day");
  const end = start.endOf("day");
  return { start, end };
}

export function weekdayInTZ(dateISO: string, tz: string) {
  return DateTime.fromISO(dateISO, { zone: tz }).weekday; // 1 = Monday ... 7 = Sunday
}

export function partitionWindow(
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

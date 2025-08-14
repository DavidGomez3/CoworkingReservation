// src/lib/state/misReservas.ts
const mine = new Set<string>();

export const MisReservas = {
  add(id: string) {
    mine.add(id);
  },
  replaceTemp(oldId: string, newId: string) {
    if (mine.delete(oldId)) mine.add(newId);
  },
  remove(id: string) {
    mine.delete(id);
  },
  has(id: string) {
    return mine.has(id);
  },
  clear() {
    mine.clear();
  },
};

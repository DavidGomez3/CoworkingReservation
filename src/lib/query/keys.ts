export const qk = {
  espacios: () => ["espacios"] as const,
  espacio: (id: string) => ["espacio", id] as const,
  reservasPage: (page: number, pageSize: number) => ["reservas", { page, pageSize }] as const,
};

import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { Espacio } from "@/lib/api/types";

export function SpaceCardHeader({
  espacio,
  onPick,
}: {
  espacio: Espacio;
  onPick?: () => void;
}) {
  return (
    <Card className="shadow-none bg-white m-0 py-1 border-none">
      <CardHeader className="py-1 px-1">
        <div className="items-center">
          <img
            src={espacio.imageUrl}
            alt={espacio.nombre}
            className="h-30 mb-2 rounded-md object-cover bg-zinc-100 w-full"
          />
          <div className="min-w-0">
            <CardTitle className="text-sm leading-tight truncate">{espacio.nombre}</CardTitle>
            <CardDescription className="text-[11px] leading-tight text-zinc-500">
              Capacidad {espacio.capacidad} · TZ {espacio.tz}
            </CardDescription>
          </div>
          {onPick && (
            <button
              className="ml-auto text-[11px] rounded-md border px-2 py-1 hover:bg-zinc-50"
              onClick={onPick}
            >
              Elegir
            </button>
          )}
        </div>
      </CardHeader>
    </Card>
  );
}

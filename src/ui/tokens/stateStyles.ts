import type { SlotState } from "@/domain/types";

export const stateStyles: Record<SlotState, string> = {
  available: "bg-transparent border border-zinc-300 hover:border-zinc-900 hover:bg-zinc-50",
  busy: "bg-zinc-200 text-zinc-500 border border-zinc-200 cursor-not-allowed",
  blackout: "bg-amber-50 text-amber-700 border border-amber-200 cursor-not-allowed",
  disabledByRule: "bg-zinc-100 text-zinc-400 border border-dashed border-zinc-200 cursor-not-allowed",
  past: "opacity-60 bg-transparent border border-zinc-200 cursor-not-allowed",
  selected: "ring-2 ring-zinc-900 bg-zinc-900 text-white border border-zinc-900",
}

export const mineOverlay =
  "ring-2 ring-emerald-400 bg-emerald-50 !text-emerald-900 !border-emerald-300";

export function slotClasses(state: SlotState, isMine = false) {
  if (isMine && state === "busy") {
    return `${stateStyles.busy} ${mineOverlay}`;
  }
  return stateStyles[state];
};

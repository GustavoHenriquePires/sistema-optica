"use client";

import { Database, LoaderCircle, RotateCcw } from "lucide-react";

export function DemoBanner({
  description,
  onReset,
  resetting,
}: {
  description: string;
  onReset: () => void;
  resetting: boolean;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5 text-sm text-amber-950 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <Database className="mt-0.5 size-5 shrink-0 text-amber-700" aria-hidden="true" />
        <p className="leading-5"><strong>Modo demonstração:</strong> {description}</p>
      </div>
      <button
        type="button"
        onClick={onReset}
        disabled={resetting}
        className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-amber-300 bg-white px-4 font-semibold text-amber-800 hover:bg-amber-100 disabled:cursor-wait disabled:opacity-60"
      >
        {resetting ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <RotateCcw className="size-4" aria-hidden="true" />}
        Restaurar dados
      </button>
    </section>
  );
}

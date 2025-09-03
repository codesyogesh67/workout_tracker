"use client";
import React from "react";
import { EngineState } from "./types";
import { prettyDur } from "./useIntervalTimer";

export default function FullscreenOverlay({
  open,
  state,
  onPauseToggle,
  onReset,
  onClose,
}: {
  open: boolean;
  state: EngineState;
  onPauseToggle: () => void;
  onReset: () => void;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 p-6 text-white">
      {Number.isFinite(state.plannedSeconds) && (
        <div className="absolute left-0 top-0 h-1 w-full bg-white/20">
          <div
            className="h-1 bg-white"
            style={{
              width: `${state.progressPct}%`,
              transition: "width 0.2s linear",
            }}
          />
        </div>
      )}

      <div className="mb-8 text-center">
        <div className="mb-3 text-sm uppercase tracking-widest text-white/60">
          Current
        </div>
        <div className="mx-auto max-w-[90vw] truncate text-4xl font-semibold sm:text-5xl">
          {state.contextualCurrentLabel}
        </div>
      </div>

      <div className="mb-10 text-[16vw] font-bold leading-none tabular-nums sm:text-[12rem]">
        {prettyDur(state.timeLeft)}
      </div>

      <div className="mb-10 text-center text-white/70">
        Next:{" "}
        <span className="font-medium text-white">{state.nextLabel || "—"}</span>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={onPauseToggle}
          className="rounded-2xl border border-white/30 px-6 py-3 hover:bg-white/10"
        >
          Pause/Resume
        </button>
        <button
          onClick={onReset}
          className="rounded-2xl border border-white/30 px-6 py-3 hover:bg-white/10"
        >
          Reset
        </button>
        <button
          onClick={onClose}
          className="rounded-2xl border border-white/30 px-6 py-3 hover:bg-white/10"
        >
          Exit Full Screen
        </button>
      </div>

      <div className="pointer-events-none absolute bottom-4 left-0 right-0 mx-auto flex max-w-xl items-center justify-between px-4 text-xs text-white/50">
        <span>Elapsed {prettyDur(state.totalElapsed)}</span>
        {Number.isFinite(state.plannedSeconds) && (
          <span>Cap {prettyDur(state.plannedSeconds)}</span>
        )}
      </div>
    </div>
  );
}

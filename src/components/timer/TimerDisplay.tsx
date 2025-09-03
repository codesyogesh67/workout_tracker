"use client";
import React from "react";
import { EngineState } from "./types";
import { prettyDur } from "./useIntervalTimer";

export default function TimerDisplay({ state }: { state: EngineState }) {
  const capHuman = Number.isFinite(state.plannedSeconds)
    ? prettyDur(state.plannedSeconds)
    : "∞";
  return (
    <section className="rounded-2xl border p-5">
      {Number.isFinite(state.plannedSeconds) && (
        <div className="mb-5 h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-2 bg-black"
            style={{
              width: `${state.progressPct}%`,
              transition: "width 0.2s linear",
            }}
          />
        </div>
      )}
      <div className="mb-3 text-sm text-gray-600">
        Elapsed:{" "}
        <span className="font-semibold text-gray-800">
          {prettyDur(state.totalElapsed)}
        </span>
        {Number.isFinite(state.plannedSeconds) && (
          <>
            {" "}
            • Cap:{" "}
            <span className="font-semibold text-gray-800">{capHuman}</span>
          </>
        )}
      </div>

      <div className="mb-4 flex items-end justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-gray-500">
            Current
          </div>
          <div className="text-3xl font-semibold">
            {state.contextualCurrentLabel}
          </div>
        </div>
        <div className="text-5xl font-bold tabular-nums">
          {prettyDur(state.timeLeft)}
        </div>
      </div>

      <div className="text-sm text-gray-600">
        Next:{" "}
        <span className="font-medium text-gray-800">
          {state.nextLabel || "—"}
        </span>
      </div>
    </section>
  );
}

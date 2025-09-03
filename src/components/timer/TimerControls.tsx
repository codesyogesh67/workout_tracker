"use client";
import React from "react";

export default function TimerControls({
  running,
  onStart,
  onPause,
  onReset,
  onFullscreen,
}: {
  running: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onFullscreen: () => void;
}) {
  return (
    <div className="mt-4 flex flex-wrap gap-3">
      {!running ? (
        <button
          onClick={onStart}
          className="rounded-xl bg-black px-4 py-2 text-white hover:opacity-90"
        >
          Start
        </button>
      ) : (
        <button
          onClick={onPause}
          className="rounded-xl border px-4 py-2 hover:bg-gray-50"
        >
          Pause
        </button>
      )}
      <button
        onClick={onReset}
        className="rounded-xl border px-4 py-2 hover:bg-gray-50"
      >
        Reset
      </button>
      <button
        onClick={onFullscreen}
        className="rounded-xl border px-4 py-2 hover:bg-gray-50"
      >
        Full Screen
      </button>
    </div>
  );
}

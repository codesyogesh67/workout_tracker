"use client";
import React, { useMemo, useState } from "react";
import StructureBuilder from "@/components/timer/StructureBuilder";
import ExerciseNames from "@/components/timer/ExerciseNames";
import TimerDisplay from "@/components/timer/TimerDisplay";
import TimerControls from "@/components/timer/TimerControls";
import FullscreenOverlay from "@/components/timer/FullscreenOverlay";
import { useIntervalTimer } from "@/components/timer/useIntervalTimer";
import { StructureInput } from "@/components/timer/types";

export default function TimerPage() {
  const [names, setNames] = useState<string[]>([
    "Exercise 1",
    "Exercise 2",
    "Exercise 3",
    "Exercise 4",
    "Exercise 5",
  ]);

  const [structure, setStructure] = useState<StructureInput>({
    numExercises: 5,
    setsPerExercise: 3,
    setWorkSec: 45,
    restBetweenSetsSec: 60,
    restBetweenExercisesSec: 60,
    totalMinutesCap: 30,
    repeatIndefinitely: false,
    exerciseNames: names,
  });

  // keep names length in sync
  React.useEffect(() => {
    setNames((prev) => {
      const copy = [...prev];
      if (structure.numExercises > copy.length) {
        while (copy.length < structure.numExercises)
          copy.push(`Exercise ${copy.length + 1}`);
      } else {
        copy.length = structure.numExercises;
      }
      return copy;
    });
  }, [structure.numExercises]);

  // push names into structure only when changed
  React.useEffect(() => {
    setStructure((s) => ({ ...s, exerciseNames: names }));
  }, [names]);

  const { state, start, pause, reset, setRunning } = useIntervalTimer(
    structure
  );
  const [openFS, setOpenFS] = useState(false);

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6 lg:p-10">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Workout Interval Timer</h1>
        <button
          onClick={() => setOpenFS(true)}
          className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
        >
          Go Full Screen
        </button>
      </header>

      <StructureBuilder
        value={structure}
        onChange={(patch) => setStructure((s) => ({ ...s, ...patch }))}
      />

      <ExerciseNames
        names={names}
        onChange={(idx, value) => {
          setNames((prev) => {
            const copy = [...prev];
            copy[idx] = value;
            return copy;
          });
        }}
      />

      <TimerDisplay state={state} />
      <TimerControls
        running={state.running}
        onStart={() => {
          start();
          setOpenFS(true);
        }}
        onPause={pause}
        onReset={reset}
        onFullscreen={() => setOpenFS(true)}
      />

      <FullscreenOverlay
        open={openFS}
        state={state}
        onPauseToggle={() => setRunning(!state.running)}
        onReset={reset}
        onClose={() => setOpenFS(false)}
      />
    </div>
  );
}

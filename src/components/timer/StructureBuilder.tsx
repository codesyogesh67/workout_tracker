"use client";
import React from "react";
import { StructureInput } from "./types";

type Props = {
  value: StructureInput;
  onChange: (v: Partial<StructureInput>) => void; // partial makes properties optional
};

export default function StructureBuilder({ value, onChange }: Props) {
  const update = (k: keyof StructureInput, v: any) => onChange({ [k]: v });

  return (
    <section className="mb-6 rounded-2xl border p-4">
      <h2 className="mb-3 text-lg font-medium">Structure Builder</h2>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <NumberField
          label="# of exercises"
          val={value.numExercises}
          min={1}
          on={(n) => update("numExercises", n)}
        />
        <NumberField
          label="Sets per exercise"
          val={value.setsPerExercise}
          min={1}
          on={(n) => update("setsPerExercise", n)}
        />
        <NumberField
          label="Work per set (sec)"
          val={value.setWorkSec}
          min={1}
          on={(n) => update("setWorkSec", n)}
        />
        <NumberField
          label="Rest between sets (sec)"
          val={value.restBetweenSetsSec}
          min={0}
          on={(n) => update("restBetweenSetsSec", n)}
        />
        <NumberField
          label="Rest between exercises (sec)"
          val={value.restBetweenExercisesSec}
          min={0}
          on={(n) => update("restBetweenExercisesSec", n)}
        />
        <div className="flex items-center gap-2 sm:col-span-2">
          <span className="w-48 text-sm text-gray-600">
            Total time cap (min)
          </span>
          <input
            type="number"
            min={1}
            className="w-28 rounded-lg border px-3 py-2"
            value={value.totalMinutesCap}
            onChange={(e) =>
              update(
                "totalMinutesCap",
                Math.max(1, Number(e.target.value || 1))
              )
            }
            disabled={value.repeatIndefinitely}
          />
          <label className="ml-4 inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={value.repeatIndefinitely}
              onChange={(e) => update("repeatIndefinitely", e.target.checked)}
            />
            Repeat indefinitely (ignore cap)
          </label>
        </div>
      </div>
    </section>
  );
}

function NumberField({
  label,
  val,
  min,
  on,
}: {
  label: string;
  val: number;
  min: number;
  on: (n: number) => void;
}) {
  return (
    <label className="flex items-center gap-2">
      <span className="w-48 text-sm text-gray-600">{label}</span>
      <input
        type="number"
        min={min}
        className="w-28 rounded-lg border px-3 py-2"
        value={val}
        onChange={(e) => on(Math.max(min, Number(e.target.value || min)))}
      />
    </label>
  );
}

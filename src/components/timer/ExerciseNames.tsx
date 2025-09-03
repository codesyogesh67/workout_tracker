"use client";
import React from "react";

export default function ExerciseNames({
  names,
  onChange,
}: {
  names: string[];
  onChange: (idx: number, value: string) => void;
}) {
  return (
    <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 mb-6">
      {names.map((name, i) => (
        <input
          key={i}
          className="rounded-lg border px-3 py-2"
          value={name}
          onChange={(e) => onChange(i, e.target.value)}
          placeholder={`Exercise ${i + 1} name`}
        />
      ))}
    </div>
  );
}

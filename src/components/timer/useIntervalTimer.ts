"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { EngineState, IntervalItem, StructureInput } from "./types";

const uid = () => Math.random().toString(36).slice(2, 9);

export function buildIntervalsFromStructure(
  s: StructureInput
): {
  intervals: IntervalItem[]; // per-exercise block
  blockRepeats: number; // number of exercises
  betweenBlockRestSec: number; // rest between exercises
} {
  const intervals: IntervalItem[] = [];
  for (let set = 1; set <= s.setsPerExercise; set++) {
    intervals.push({
      id: uid(),
      label: `Set ${set} – Work`,
      seconds: Math.max(1, s.setWorkSec),
    });
    if (set < s.setsPerExercise && s.restBetweenSetsSec > 0) {
      intervals.push({
        id: uid(),
        label: "Rest between sets",
        seconds: Math.max(0, s.restBetweenSetsSec),
      });
    }
  }
  return {
    intervals,
    blockRepeats: Math.max(1, s.numExercises),
    betweenBlockRestSec: Math.max(0, s.restBetweenExercisesSec),
  };
}

// small audio util kept local to hook to avoid prop-drilling
function useBeeper() {
  const ctxRef = useRef<AudioContext | null>(null);
  const beep = (type: "tick" | "transition" = "transition") => {
    try {
      if (!ctxRef.current)
        ctxRef.current = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
      const ctx = ctxRef.current!;
      const master = ctx.createGain();
      master.connect(ctx.destination);
      const now = ctx.currentTime;
      const duration = type === "tick" ? 0.08 : 0.16;
      const peak = type === "tick" ? 0.12 : 0.28;
      master.gain.setValueAtTime(0, now);
      master.gain.linearRampToValueAtTime(peak, now + 0.01);
      master.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      const o1 = ctx.createOscillator();
      o1.type = "square";
      o1.frequency.value = 1320;
      o1.connect(master);
      const o2 = ctx.createOscillator();
      o2.type = "sine";
      o2.frequency.value = 880;
      o2.connect(master);
      o1.start(now);
      o2.start(now);
      o1.stop(now + duration);
      o2.stop(now + duration);
    } catch {}
  };
  return beep;
}

export function useIntervalTimer(structure: StructureInput) {
  const [intervals, setIntervals] = useState<IntervalItem[]>([]);
  const [blockRepeats, setBlockRepeats] = useState(1);
  const [betweenBlockRestSec, setBetweenBlockRestSec] = useState(0);

  // runtime state
  const [running, setRunning] = useState(false);
  const [currentLabel, setCurrentLabel] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalElapsed, setTotalElapsed] = useState(0);
  const [blockIndex, setBlockIndex] = useState(0);
  const [repeatIndex, setRepeatIndex] = useState(0);
  const [isBetweenBlockRest, setIsBetweenBlockRest] = useState(false);

  const beep = useBeeper();

  // (re)build when structure changes
  useEffect(() => {
    const built = buildIntervalsFromStructure(structure);
    setIntervals(built.intervals);
    setBlockRepeats(built.blockRepeats);
    setBetweenBlockRestSec(built.betweenBlockRestSec);
    // reset position
    setRunning(false);
    setTotalElapsed(0);
    setBlockIndex(0);
    setRepeatIndex(0);
    setIsBetweenBlockRest(false);
    setCurrentLabel(built.intervals[0]?.label ?? "");
    setTimeLeft(built.intervals[0]?.seconds ?? 0);
  }, [
    structure.numExercises,
    structure.setsPerExercise,
    structure.setWorkSec,
    structure.restBetweenSetsSec,
    structure.restBetweenExercisesSec,
  ]);

  const plannedSeconds = useMemo(() => {
    if (structure.repeatIndefinitely) return Infinity;
    return Math.max(1, Math.round(structure.totalMinutesCap * 60));
  }, [structure.repeatIndefinitely, structure.totalMinutesCap]);

  // ticker
  useEffect(() => {
    if (!running || !intervals.length) return;
    const id = setInterval(() => {
      setTimeLeft((t) => {
        const next = t - 1;
        if (next >= 0) {
          if (next <= 3) beep("tick");
          return next;
        }
        return 0;
      });
      setTotalElapsed((t) => t + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [running, intervals.length]);

  // transitions
  useEffect(() => {
    if (!running || !intervals.length) return;
    if (Number.isFinite(plannedSeconds) && totalElapsed >= plannedSeconds) {
      setRunning(false);
      return;
    }
    if (timeLeft > 0) return;
    advance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, running]);

  const advance = () => {
    beep("transition");
    // still in the exercise block
    if (!isBetweenBlockRest && blockIndex < intervals.length - 1) {
      const idx = blockIndex + 1;
      setBlockIndex(idx);
      setCurrentLabel(intervals[idx].label);
      setTimeLeft(intervals[idx].seconds);
      return;
    }
    // finished last interval of this exercise
    if (!isBetweenBlockRest) {
      if (repeatIndex < blockRepeats - 1) {
        if (betweenBlockRestSec > 0) {
          setIsBetweenBlockRest(true);
          setCurrentLabel("Between Exercises Rest");
          setTimeLeft(betweenBlockRestSec);
          return;
        }
        startNextExercise();
        return;
      } else {
        // completed all exercises → loop if allowed (total cap guards stopping)
        resetCycle();
        return;
      }
    }
    // we were in between-exercise rest → start next exercise
    setIsBetweenBlockRest(false);
    startNextExercise();
  };

  const startNextExercise = () => {
    setRepeatIndex((r) => r + 1);
    setBlockIndex(0);
    setCurrentLabel(intervals[0].label);
    setTimeLeft(intervals[0].seconds);
  };

  const resetCycle = () => {
    setRepeatIndex(0);
    setBlockIndex(0);
    setIsBetweenBlockRest(false);
    setCurrentLabel(intervals[0].label);
    setTimeLeft(intervals[0].seconds);
  };

  // derived labels (DRY)
  const contextualCurrentLabel = useMemo(() => {
    const totalEx = Math.max(1, blockRepeats);
    const exName =
      structure.exerciseNames[repeatIndex] ?? `Exercise ${repeatIndex + 1}`;
    const isRest =
      isBetweenBlockRest ||
      (intervals[blockIndex]?.label || "").toLowerCase().includes("rest");
    const setNum = isBetweenBlockRest
      ? structure.setsPerExercise
      : Math.floor(blockIndex / 2) + 1;
    const setPart = isRest
      ? ""
      : ` — Set ${setNum}/${structure.setsPerExercise}`;
    return `${currentLabel} • ${exName} (${
      repeatIndex + 1
    }/${totalEx})${setPart}`;
  }, [
    currentLabel,
    repeatIndex,
    blockRepeats,
    blockIndex,
    intervals,
    isBetweenBlockRest,
    structure.exerciseNames,
    structure.setsPerExercise,
  ]);

  const nextLabel = useMemo(() => {
    if (!intervals.length) return "";
    if (isBetweenBlockRest) {
      const nextEx =
        structure.exerciseNames[repeatIndex + 1] ??
        `Exercise ${repeatIndex + 2}`;
      return `Next exercise: ${nextEx}`;
    }
    if (blockIndex < intervals.length - 1)
      return intervals[blockIndex + 1].label;
    if (repeatIndex < blockRepeats - 1) {
      const nextEx =
        structure.exerciseNames[repeatIndex + 1] ??
        `Exercise ${repeatIndex + 2}`;
      return betweenBlockRestSec > 0
        ? `Between Exercises Rest → ${nextEx}`
        : `${intervals[0].label} — ${nextEx}`;
    }
    const cycleEx = structure.exerciseNames[0] ?? "Exercise 1";
    return `${intervals[0].label} — ${cycleEx} (cycle)`;
  }, [
    isBetweenBlockRest,
    blockIndex,
    repeatIndex,
    intervals,
    blockRepeats,
    betweenBlockRestSec,
    structure.exerciseNames,
  ]);

  const progressPct = useMemo(() => {
    if (!Number.isFinite(plannedSeconds)) return 0;
    return Math.min(
      100,
      Math.round((totalElapsed / (plannedSeconds || 1)) * 100)
    );
  }, [totalElapsed, plannedSeconds]);

  // public API
  const start = () => {
    if (!intervals.length) return;
    if (totalElapsed === 0) {
      setCurrentLabel(intervals[0].label);
      setTimeLeft(intervals[0].seconds);
    }
    setRunning(true);
  };
  const pause = () => setRunning(false);
  const reset = () => {
    setRunning(false);
    setTotalElapsed(0);
    setBlockIndex(0);
    setRepeatIndex(0);
    setIsBetweenBlockRest(false);
    setCurrentLabel(intervals[0]?.label ?? "");
    setTimeLeft(intervals[0]?.seconds ?? 0);
  };

  const state: EngineState = {
    running,
    currentLabel,
    contextualCurrentLabel,
    nextLabel,
    timeLeft,
    totalElapsed,
    blockIndex,
    repeatIndex,
    isBetweenBlockRest,
    progressPct,
    plannedSeconds,
  };

  return {
    state,
    // controls
    start,
    pause,
    reset,
    // expose pieces if some components need them
    setRunning,
  };
}

// utils
export const prettyDur = (totalSec: number) => {
  const s = Math.max(0, Math.floor(totalSec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const mm = m % 60;
    return `${h}:${String(mm).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
  }
  return `${m}:${String(r).padStart(2, "0")}`;
};

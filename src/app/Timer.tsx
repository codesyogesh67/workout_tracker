"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type IntervalItem = { id: string; label: string; seconds: number };
const uid = () => Math.random().toString(36).slice(2, 9);

export default function TimerPage() {
  // -------- Structure Builder (numbers) --------
  const [numExercises, setNumExercises] = useState<number>(5);
  const [setsPerExercise, setSetsPerExercise] = useState<number>(3);
  const [setWorkSec, setSetWorkSec] = useState<number>(45); // your active time per set
  const [restBetweenSetsSec, setRestBetweenSetsSec] = useState<number>(60);
  const [restBetweenExercisesSec, setRestBetweenExercisesSec] = useState<number>(60);

  // -------- Interval Engine (generated or manual) --------
  const [intervals, setIntervals] = useState<IntervalItem[]>([
    { id: uid(), label: "Set 1 – Work", seconds: 45 },
    { id: uid(), label: "Rest between sets", seconds: 60 },
    { id: uid(), label: "Set 2 – Work", seconds: 45 },
    { id: uid(), label: "Rest between sets", seconds: 60 },
    { id: uid(), label: "Set 3 – Work", seconds: 45 },
  ]);

  // block = one exercise; blockRepeats = number of exercises
  const [blockRepeats, setBlockRepeats] = useState<number>(5);
  const [betweenBlockRestSec, setBetweenBlockRestSec] = useState<number>(60);
  const [totalMinutesCap, setTotalMinutesCap] = useState<number>(30);
  const [repeatIndefinitely, setRepeatIndefinitely] = useState<boolean>(false);

  // -------- Timer State --------
  const [running, setRunning] = useState(false);
  const [currentLabel, setCurrentLabel] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [totalElapsed, setTotalElapsed] = useState<number>(0);
  const [blockIndex, setBlockIndex] = useState<number>(0); // index within current exercise
  const [repeatIndex, setRepeatIndex] = useState<number>(0); // exercise number (0-based)
  const [isBetweenBlockRest, setIsBetweenBlockRest] = useState<boolean>(false);

  // Fullscreen overlay
  const [showFullscreen, setShowFullscreen] = useState<boolean>(false);

  // -------- Louder Beep --------
  const audioCtxRef = useRef<AudioContext | null>(null);
  const beep = (type: "tick" | "transition" = "transition") => {
    try {
      if (!audioCtxRef.current)
        audioCtxRef.current = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
      const ctx = audioCtxRef.current!;
      const master = ctx.createGain();
      master.connect(ctx.destination);

      const now = ctx.currentTime;
      const duration = type === "tick" ? 0.08 : 0.16;
      const peak = type === "tick" ? 0.12 : 0.28;
      master.gain.setValueAtTime(0, now);
      master.gain.linearRampToValueAtTime(peak, now + 0.01);
      master.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      const o1 = ctx.createOscillator();
      const o2 = ctx.createOscillator();
      o1.type = "square";
      o2.type = "sine";
      o1.frequency.value = 1320;
      o2.frequency.value = 880;

      o1.connect(master);
      o2.connect(master);
      o1.start(now);
      o2.start(now);
      o1.stop(now + duration);
      o2.stop(now + duration);
    } catch {}
  };

  // -------- Planning / Cap --------
  const plannedSeconds = useMemo(() => {
    if (repeatIndefinitely) return Infinity;
    return Math.max(1, Math.round((totalMinutesCap || 0) * 60));
  }, [totalMinutesCap, repeatIndefinitely]);

  // Derived label with exercise/step context
  const contextualCurrentLabel = useMemo(() => {
    const ex = repeatIndex + 1;
    const totalEx = Math.max(1, blockRepeats);
    // infer set number from blockIndex (works because we build [Work, Rest, Work, Rest, ...])
    const isRest = isBetweenBlockRest || intervals[blockIndex]?.label.toLowerCase().includes("rest");
    let setNum = Math.floor(blockIndex / 2) + 1;
    if (isBetweenBlockRest) setNum = setsPerExercise; // we just finished that exercise
    const setSuffix = isRest ? "" : ` — Exercise ${ex}/${totalEx}, Set ${setNum}/${setsPerExercise}`;
    return (currentLabel || "—") + setSuffix;
  }, [
    currentLabel,
    repeatIndex,
    blockRepeats,
    blockIndex,
    intervals,
    isBetweenBlockRest,
    setsPerExercise,
  ]);

  const totalElapsedPretty = prettyDur(totalElapsed);
  const timeLeftPretty = prettyDur(timeLeft);

  // Init
  useEffect(() => {
    if (!running && totalElapsed === 0 && intervals.length > 0) {
      setCurrentLabel(intervals[0].label);
      setTimeLeft(intervals[0].seconds);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tick
  useEffect(() => {
    if (!running || !intervals.length) return;
    const id = setInterval(() => {
      setTimeLeft((t) => {
        const next = t - 1;
        if (next >= 0) {
          if (next <= 3 && next >= 0) beep("tick");
          return next;
        }
        return 0;
      });
      setTotalElapsed((t) => t + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [running, intervals.length]);

  // Transitions
  useEffect(() => {
    if (!running || !intervals.length) return;
    if (Number.isFinite(plannedSeconds) && totalElapsed >= plannedSeconds) {
      setRunning(false);
      return;
    }
    if (timeLeft > 0) return;
    transitionToNext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, running]);

  const transitionToNext = () => {
    beep("transition");

    // inside an exercise (block) and not at the end
    if (!isBetweenBlockRest && blockIndex < intervals.length - 1) {
      const nextIndex = blockIndex + 1;
      setBlockIndex(nextIndex);
      setCurrentLabel(intervals[nextIndex].label);
      setTimeLeft(intervals[nextIndex].seconds);
      return;
    }

    // end of exercise block
    if (!isBetweenBlockRest) {
      if (repeatIndex < blockRepeats - 1) {
        if (betweenBlockRestSec > 0) {
          setIsBetweenBlockRest(true);
          setCurrentLabel("Between Exercises Rest");
          setTimeLeft(betweenBlockRestSec);
          return;
        } else {
          startNextExercise();
          return;
        }
      } else {
        // finished all exercises in this cycle; loop if needed
        if (repeatIndefinitely || Number.isFinite(plannedSeconds)) {
          resetCycleButContinue();
          return;
        }
      }
    } else {
      // coming out of between-exercise rest
      setIsBetweenBlockRest(false);
      startNextExercise();
      return;
    }

    // fallback
    resetCycleButContinue();
  };

  const startNextExercise = () => {
    setRepeatIndex((r) => r + 1);
    setBlockIndex(0);
    setCurrentLabel(intervals[0].label);
    setTimeLeft(intervals[0].seconds);
  };

  const resetCycleButContinue = () => {
    setRepeatIndex(0);
    setBlockIndex(0);
    setIsBetweenBlockRest(false);
    setCurrentLabel(intervals[0].label);
    setTimeLeft(intervals[0].seconds);
  };

  // Controls
  const onStart = () => {
    if (totalElapsed === 0 && intervals.length > 0) {
      setCurrentLabel(intervals[0].label);
      setTimeLeft(intervals[0].seconds);
    }
    setRunning(true);
    setShowFullscreen(true);
  };
  const onPause = () => setRunning(false);
  const onReset = () => {
    setRunning(false);
    setTotalElapsed(0);
    setBlockIndex(0);
    setRepeatIndex(0);
    setIsBetweenBlockRest(false);
    if (intervals.length > 0) {
      setCurrentLabel(intervals[0].label);
      setTimeLeft(intervals[0].seconds);
    } else {
      setCurrentLabel("");
      setTimeLeft(0);
    }
  };

  // Build intervals from numbers -> one exercise (block)
  const buildFromNumbers = () => {
    const newIntervals: IntervalItem[] = [];
    for (let s = 1; s <= Math.max(1, setsPerExercise); s++) {
      newIntervals.push({ id: uid(), label: `Set ${s} – Work`, seconds: Math.max(1, setWorkSec) });
      if (s < setsPerExercise && restBetweenSetsSec > 0) {
        newIntervals.push({
          id: uid(),
          label: "Rest between sets",
          seconds: Math.max(0, restBetweenSetsSec),
        });
      }
    }
    setIntervals(newIntervals);
    setBlockRepeats(Math.max(1, numExercises));
    setBetweenBlockRestSec(Math.max(0, restBetweenExercisesSec));
    // keep cap & repeatIndefinitely as chosen
    onReset();
  };

  // Manual edit helpers (still available if needed)
  const addInterval = () =>
    setIntervals((arr) => [...arr, { id: uid(), label: "New", seconds: 30 }]);
  const removeInterval = (id: string) =>
    setIntervals((arr) => arr.filter((x) => x.id !== id));
  const updateInterval = (id: string, patch: Partial<IntervalItem>) =>
    setIntervals((arr) => (arr.map((x) => (x.id === id ? { ...x, ...patch } : x))));

  const nextLabel = useMemo(() => {
    if (!intervals.length) return "";
    if (isBetweenBlockRest) return intervals[0].label + " (next exercise)";
    if (blockIndex < intervals.length - 1) return intervals[blockIndex + 1].label;
    if (repeatIndex < blockRepeats - 1) {
      return betweenBlockRestSec > 0 ? "Between Exercises Rest" : intervals[0].label + " (next exercise)";
    }
    return intervals[0].label + " (cycle)";
  }, [isBetweenBlockRest, blockIndex, repeatIndex, intervals, blockRepeats, betweenBlockRestSec]);

  const progressPct = useMemo(() => {
    if (!Number.isFinite(plannedSeconds)) return 0;
    return Math.min(100, Math.round((totalElapsed / (plannedSeconds || 1)) * 100));
  }, [totalElapsed, plannedSeconds]);

  const requestBrowserFullscreen = async () => {
    try {
      const el = document.documentElement as any;
      if (el.requestFullscreen) await el.requestFullscreen();
      else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
    } catch {}
  };

  const totalPlannedHuman = Number.isFinite(plannedSeconds) ? prettyDur(plannedSeconds) : "∞";

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6 lg:p-10">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Workout Interval Timer</h1>
        <button
          onClick={() => setShowFullscreen(true)}
          className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
        >
          Go Full Screen
        </button>
      </header>

      {/* STRUCTURE BUILDER */}
      <section className="mb-6 rounded-2xl border p-4">
        <h2 className="mb-3 text-lg font-medium">Structure Builder (No Manual Adding)</h2>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-2">
            <span className="w-48 text-sm text-gray-600"># of exercises</span>
            <input
              type="number"
              min={1}
              className="w-28 rounded-lg border px-3 py-2"
              value={numExercises}
              onChange={(e) => setNumExercises(Math.max(1, Number(e.target.value || 1)))}
            />
          </label>

          <label className="flex items-center gap-2">
            <span className="w-48 text-sm text-gray-600">Sets per exercise</span>
            <input
              type="number"
              min={1}
              className="w-28 rounded-lg border px-3 py-2"
              value={setsPerExercise}
              onChange={(e) => setSetsPerExercise(Math.max(1, Number(e.target.value || 1)))}
            />
          </label>

          <label className="flex items-center gap-2">
            <span className="w-48 text-sm text-gray-600">Work per set (sec)</span>
            <input
              type="number"
              min={1}
              className="w-28 rounded-lg border px-3 py-2"
              value={setWorkSec}
              onChange={(e) => setSetWorkSec(Math.max(1, Number(e.target.value || 1)))}
            />
          </label>

          <label className="flex items-center gap-2">
            <span className="w-48 text-sm text-gray-600">Rest between sets (sec)</span>
            <input
              type="number"
              min={0}
              className="w-28 rounded-lg border px-3 py-2"
              value={restBetweenSetsSec}
              onChange={(e) => setRestBetweenSetsSec(Math.max(0, Number(e.target.value || 0)))}
            />
          </label>

          <label className="flex items-center gap-2">
            <span className="w-48 text-sm text-gray-600">Rest between exercises (sec)</span>
            <input
              type="number"
              min={0}
              className="w-28 rounded-lg border px-3 py-2"
              value={restBetweenExercisesSec}
              onChange={(e) => setRestBetweenExercisesSec(Math.max(0, Number(e.target.value || 0)))}
            />
          </label>

          <label className="flex items-center gap-2 sm:col-span-2">
            <span className="w-48 text-sm text-gray-600">Total time cap (min)</span>
            <input
              type="number"
              min={1}
              className="w-28 rounded-lg border px-3 py-2"
              value={totalMinutesCap}
              onChange={(e) => setTotalMinutesCap(Math.max(1, Number(e.target.value || 1)))}
              disabled={repeatIndefinitely}
            />
            <label className="ml-4 inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={repeatIndefinitely}
                onChange={(e) => setRepeatIndefinitely(e.target.checked)}
              />
              Repeat indefinitely (ignore cap)
            </label>
          </label>
        </div>

        <div className="mt-3 flex flex-wrap gap-3">
          <button
            onClick={buildFromNumbers}
            className="rounded-xl bg-black px-4 py-2 text-white hover:opacity-90"
          >
            Build from numbers
          </button>
          <span className="text-sm text-gray-500">
            Builds 1 exercise block = {setsPerExercise} sets (work + optional rest), repeats for{" "}
            {numExercises} exercises with {restBetweenExercisesSec}s between exercises.
          </span>
        </div>
      </section>

      {/* (Optional) Manual tweak card */}
      <section className="mb-6 rounded-2xl border p-4">
        <h3 className="mb-3 text-base font-medium">Generated Intervals (per exercise)</h3>
        <div className="mb-2 grid grid-cols-1 gap-2">
          {intervals.map((it, idx) => (
            <div
              key={it.id}
              className="grid grid-cols-[1fr,120px,38px] items-center gap-2 rounded-xl border p-2"
            >
              <input
                className="rounded-lg border px-3 py-2"
                value={it.label}
                onChange={(e) => updateInterval(it.id, { label: e.target.value })}
              />
              <input
                type="number"
                min={1}
                className="w-full rounded-lg border px-3 py-2"
                value={it.seconds}
                onChange={(e) =>
                  updateInterval(it.id, { seconds: Math.max(1, Number(e.target.value || 0)) })
                }
              />
              <button
                onClick={() => removeInterval(it.id)}
                className="rounded-lg border px-2 py-2 text-xs hover:bg-gray-50"
                title="Remove"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={addInterval} className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50">
            + Add interval
          </button>
          <div className="text-sm text-gray-600">
            Exercises (blocks): <strong>{blockRepeats}</strong> • Rest between exercises:{" "}
            <strong>{betweenBlockRestSec}s</strong>
          </div>
        </div>
      </section>

      {/* Timer */}
      <section className="rounded-2xl border p-5">
        {Number.isFinite(plannedSeconds) && (
          <div className="mb-5 h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-2 bg-black"
              style={{ width: `${progressPct}%`, transition: "width 0.2s linear" }}
            />
          </div>
        )}

        <div className="mb-3 text-sm text-gray-600">
          Elapsed: <span className="font-semibold text-gray-800">{totalElapsedPretty}</span>
          {Number.isFinite(plannedSeconds) && (
            <>
              {" "}
              • Cap: <span className="font-semibold text-gray-800">{totalPlannedHuman}</span>
            </>
          )}
        </div>

        <div className="mb-4 flex items-end justify-between">
          <div>
            <div className="text-xs uppercase tracking-wide text-gray-500">Current</div>
            <div className="text-3xl font-semibold">{contextualCurrentLabel}</div>
          </div>
          <div className="text-5xl font-bold tabular-nums">{timeLeftPretty}</div>
        </div>

        <div className="mb-6 text-sm text-gray-600">
          Next: <span className="font-medium text-gray-800">{nextLabel || "—"}</span>
          <span className="ml-3 text-gray-400">
            (Exercise {repeatIndex + 1}/{Math.max(1, blockRepeats)}, Step {blockIndex + 1}/
            {Math.max(1, intervals.length)}
            {isBetweenBlockRest ? ", rest" : ""})
          </span>
        </div>

        <div className="flex flex-wrap gap-3">
          {!running ? (
            <button onClick={onStart} className="rounded-xl bg-black px-4 py-2 text-white hover:opacity-90">
              Start
            </button>
          ) : (
            <button onClick={onPause} className="rounded-xl border px-4 py-2 hover:bg-gray-50">
              Pause
            </button>
          )}
          <button onClick={onReset} className="rounded-xl border px-4 py-2 hover:bg-gray-50">
            Reset
          </button>
          <button onClick={() => setShowFullscreen(true)} className="rounded-xl border px-4 py-2 hover:bg-gray-50">
            Show Full Screen
          </button>
        </div>
      </section>

      {/* FULLSCREEN OVERLAY */}
      {showFullscreen && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 p-6 text-white">
          <div className="absolute left-0 top-0 w-full">
            {Number.isFinite(plannedSeconds) && (
              <div className="h-1 w-full bg-white/20">
                <div
                  className="h-1 bg-white"
                  style={{ width: `${progressPct}%`, transition: "width 0.2s linear" }}
                />
              </div>
            )}
          </div>

          <div className="mb-8 text-center">
            <div className="mb-3 text-sm uppercase tracking-widest text-white/60">Current</div>
            <div className="mx-auto max-w-[90vw] truncate text-4xl font-semibold sm:text-5xl">
              {contextualCurrentLabel}
            </div>
          </div>

          <div className="mb-10 text-[16vw] font-bold leading-none tabular-nums sm:text-[12rem]">
            {timeLeftPretty}
          </div>

          <div className="mb-10 text-center text-white/70">
            Next: <span className="font-medium text-white">{nextLabel || "—"}</span>
            <span className="ml-3">
              (Exercise {repeatIndex + 1}/{Math.max(1, blockRepeats)}, Step {blockIndex + 1}/
              {Math.max(1, intervals.length)}
              {isBetweenBlockRest ? ", rest" : ""})
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {!running ? (
              <button onClick={() => setRunning(true)} className="rounded-2xl bg-white px-6 py-3 text-black hover:opacity-90">
                Resume
              </button>
            ) : (
              <button onClick={() => setRunning(false)} className="rounded-2xl border border-white/30 px-6 py-3 hover:bg-white/10">
                Pause
              </button>
            )}
            <button onClick={onReset} className="rounded-2xl border border-white/30 px-6 py-3 hover:bg-white/10">
              Reset
            </button>
            <button onClick={() => setShowFullscreen(false)} className="rounded-2xl border border-white/30 px-6 py-3 hover:bg-white/10">
              Exit Full Screen
            </button>
          </div>

          <div className="pointer-events-none absolute bottom-4 left-0 right-0 mx-auto flex max-w-xl items-center justify-between px-4 text-xs text-white/50">
            <span>Elapsed {totalElapsedPretty}</span>
            {Number.isFinite(plannedSeconds) && <span>Cap {totalPlannedHuman}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

function prettyDur(totalSec: number) {
  const s = Math.max(0, Math.floor(totalSec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const mm = m % 60;
    return `${h}:${String(mm).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
  }
  return `${m}:${String(r).padStart(2, "0")}`;
}

export type IntervalItem = { id: string; label: string; seconds: number };

export type StructureInput = {
  numExercises: number;
  setsPerExercise: number;
  setWorkSec: number;
  restBetweenSetsSec: number;
  restBetweenExercisesSec: number;
  totalMinutesCap: number;
  repeatIndefinitely: boolean;
  exerciseNames: string[];
};

export type EngineState = {
  running: boolean;
  currentLabel: string;
  contextualCurrentLabel: string;
  nextLabel: string;
  timeLeft: number;
  totalElapsed: number;
  blockIndex: number; // index within current exercise's interval list
  repeatIndex: number; // exercise number (0-based)
  isBetweenBlockRest: boolean;
  progressPct: number;
  plannedSeconds: number; // Infinity if repeatIndefinitely
};

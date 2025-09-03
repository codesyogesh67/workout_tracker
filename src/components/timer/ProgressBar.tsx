"use client";
export default function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
      <div
        className="h-2 bg-black"
        style={{ width: `${pct}%`, transition: "width 0.2s linear" }}
      />
    </div>
  );
}

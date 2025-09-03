🏋️ Workout Interval Timer

A professional Next.js + React + TypeScript app that works as a customizable workout tracker and interval timer.
It’s designed to feel like a real workout companion — clean UI, flexible structure, and distraction-free big screen mode.

✨ Features

Structure Builder – choose exercises, sets per exercise, work duration, rest between sets, and rest between exercises.

Exercise Naming – label each exercise (e.g., Biceps Curl, Hammer Curl).

Auto-Generated Intervals – no need to add each interval manually.

Full-Screen Mode – big, clear timer with current and next step.

Progress Tracking – elapsed time, next interval, and workout cap.

Smart Validation – inputs fallback to safe defaults (min values enforced).

Audio Beeps – tick + transition sounds for hands-free workouts.

🛠️ Tech Stack

Next.js 14
 (App Router)

React + TypeScript

Tailwind CSS

📂 Code Structure
app/timer/page.tsx          # Main page, composes components
components/timer/
  ├─ useIntervalTimer.ts    # Core timer logic (custom hook)
  ├─ StructureBuilder.tsx   # Input form for workout structure
  ├─ ExerciseNames.tsx      # Editable exercise labels
  ├─ TimerDisplay.tsx       # Shows current/next interval
  ├─ TimerControls.tsx      # Start/Pause/Reset/Fullscreen
  └─ FullscreenOverlay.tsx  # Big-screen workout mode

🚀 Getting Started

Clone the repo and run locally:

git clone https://github.com/your-username/workout-timer.git
cd workout-timer
npm install
npm run dev


Visit: http://localhost:3000/timer

🔮 Roadmap

Save/load workout templates

Weekly & monthly reports

Mobile PWA (offline support)

Advanced sound + vibration alerts

⚡ Simple, customizable, and ready to guide your workouts.

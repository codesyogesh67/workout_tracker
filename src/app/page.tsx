import Image from "next/image";
import Timer from "./Timer";

export default function Home() {
  return (
    <>
      <h1 className="text-red-500 font-bold text-xl">Workout Plans</h1>
      <Timer />
    </>
  );
}

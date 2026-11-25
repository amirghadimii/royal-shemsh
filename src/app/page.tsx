import { Suspense } from "react";
import { Screen1Board } from "@/components/Screen1Board";

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <Screen1Board />
    </Suspense>
  );
}

import { Suspense } from "react";
import { Screen12Commission } from "@/components/Screen12Commission";

export default function CommissionPage() {
  return (
    <Suspense fallback={null}>
      <Screen12Commission />
    </Suspense>
  );
}

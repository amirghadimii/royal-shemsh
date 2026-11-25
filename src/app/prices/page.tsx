import { Suspense } from "react";
import { Screen6Prices } from "@/components/Screen6Prices";

export default function PricesPage() {
  return (
    <Suspense fallback={null}>
      <Screen6Prices />
    </Suspense>
  );
}

"use client";

import { Suspense } from "react";
import { MarketingHome } from "@/components/marketing/home-page";

export default function HomePage() {
  return (
    <Suspense>
      <MarketingHome />
    </Suspense>
  );
}

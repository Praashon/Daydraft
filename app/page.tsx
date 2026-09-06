"use client";

import { LandingPage } from "@/components/landing-page";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/components/app-provider";

export default function Home() {
  const router = useRouter();
  const { setTasks, setFocusTask, setDailyPlan, setInsight } = useAppContext();

  return (
    <LandingPage
      onLaunchApp={() => {
        router.push("/dashboard");
      }}
      onRunDemoOrganize={(text) => {
        router.push("/dashboard");
      }}
    />
  );
}

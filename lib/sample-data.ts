import { Task, FocusTask, DailyPlanItem, UserProfile } from "@/types";

export const DEFAULT_USER: UserProfile = {
  name: "",
  role: "",
  username: "",
  assignmentName: "",
  assignmentRole: "",
  avatarUrl: "",
  sidebarOption: "hover",
};

export const INITIAL_BRAIN_DUMP = "";

export const INITIAL_TASKS: Task[] = [];

export const INITIAL_FOCUS_TASK: FocusTask = {
  title: "",
  reason: "",
};

export const INITIAL_DAILY_PLAN: DailyPlanItem[] = [];

export const INITIAL_INSIGHT = "";

export const PRESET_BRAIN_DUMPS: { label: string; text: string }[] = [
  {
    label: "Busy Monday",
    text: "Review client pitch deck by 10am, finish React component library bug fixes before 3pm, email design review feedback to Alex, prepare dinner reservations for 7pm, gym workout tonight at 8pm.",
  },
  {
    label: "Product Launch",
    text: "Launch product landing page at noon, send announcement newsletter to subscribers, monitor server metrics on Datadog, respond to customer onboarding questions, celebrate with the team.",
  },
  {
    label: "Student Schedule",
    text: "Submit AI ethics assignment by 11:59pm, read Chapter 4 of distributed systems textbook, group meeting at library 2pm, buy groceries and oat milk, prep presentation slides for Tuesday.",
  },
];

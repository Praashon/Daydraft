export type Priority = 'high' | 'medium' | 'low';

export interface Task {
  id: string;
  title: string;
  priority: Priority;
  deadline?: string;
  category?: string;
  completed: boolean;
  createdAt?: string;
}

export interface FocusTask {
  title: string;
  reason: string;
  taskId?: string;
}

export interface DailyPlanItem {
  id?: string;
  date?: string;
  time: string;
  task: string;
  description?: string;
  completed?: boolean;
  taskId?: string;
}

export type TrashItemType = 'task' | 'planItem' | 'both' | 'note';

export interface TrashItem {
  id: string;
  type: TrashItemType;
  task?: Task;
  planItem?: DailyPlanItem;
  note?: Note;
  deletedAt: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  dismissedFromDashboard?: boolean;
}

export interface AIOrganizeResponse {
  tasks: Task[];
  focusTask: FocusTask;
  dailyPlan: DailyPlanItem[];
  insight: string;
  notes?: Note[];
}

export interface Stats {
  total: number;
  completed: number;
  remaining: number;
}

export type ActiveView = 'dashboard' | 'tasks' | 'calendar' | 'landing' | 'notes' | 'trash' | 'profile';

export type AIProvider = 'openrouter' | 'gemini';

export interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  context_length?: number;
  isFree: boolean;
  provider?: string;
}

export type TrashExpiration = '1 week' | '30 days' | '6 months' | '1 year' | 'No expiration';

export type SidebarOption = 'show' | 'collapse' | 'hover';

export interface SavedTheme {
  id: string;
  name: string;
  css: string;
  createdAt: string;
}

export interface UserProfile {
  name: string;
  role: string;
  username?: string;
  assignmentName?: string;
  assignmentRole?: string;
  avatarUrl?: string;
  aiProvider?: AIProvider;
  selectedModel?: string;
  trashExpiration?: TrashExpiration;
  activeTheme?: string;
  customCss?: string;
  sidebarOption?: SidebarOption;
  savedThemes?: SavedTheme[];
  hasCompletedOnboarding?: boolean;
}

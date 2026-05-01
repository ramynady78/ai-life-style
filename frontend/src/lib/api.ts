const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000").replace(
  /\/$/,
  "",
);
const TOKEN_KEY = "auth_token";

export type User = {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  created_at?: string;
};

export type Profile = {
  user_id: string;
  age: number | null;
  gender: string | null;
  height_cm: number | null;
  initial_weight_kg: number | null;
  goal_type: string | null;
  experience_level: string | null;
  gym_days_per_week: number | null;
  session_minutes: number | null;
  injuries: string[] | null;
  chronic_flags: string[] | null;
  updated_at: string;
};

export type RecommendationPlan = {
  workout_plan: string;
  training_days?: TrainingDay[];
  daily_routine: string;
  calorie_target: number;
  macro_targets?: {
    protein: number;
    carbs: number;
    fat: number;
  };
  hydration_goal_liters?: number;
  meals?: NutritionMeal[];
  insights?: string[];
  progress_summary?: string;
  adjustment_summary?: string;
  adherence_level?: "low" | "medium" | "high";
  personalization_factors?: string[];
  next_week_focus?: string;
  recommendation_cards?: RecommendationCard[];
  safety_notes?: string[];
};

export type TrainingDayExercise = {
  name: string;
  sets: number;
  reps: string;
  rest_seconds: number;
  notes: string;
};

export type TrainingDay = {
  day: number;
  focus: string;
  duration_minutes: number;
  exercises: TrainingDayExercise[];
};

export type RecommendationCard = {
  id: string;
  category: "Nutrition" | "Workout" | "Recovery" | "Lifestyle";
  priority: "High" | "Medium" | "Low";
  title: string;
  description: string;
  action: string;
  icon: string;
};

export type ActiveRecommendation = {
  id: string;
  user_id: string;
  version: number;
  status: "active";
  content: RecommendationPlan;
  generated_by: string;
  created_at: string;
};

export type Measurement = {
  id: string;
  user_id: string;
  measured_at: string;
  weight_kg: number | null;
  waist_cm: number | null;
  sleep_hours_avg: number | null;
  steps_avg: number | null;
  heart_rate: number | null;
  created_at: string;
};

export type AdherenceLog = {
  id: string;
  user_id: string;
  log_date: string;
  workout_done: boolean;
  completion_pct: number | null;
  comment: string | null;
  created_at: string;
};

export type NutritionMeal = {
  id: string;
  name: string;
  type: "Breakfast" | "Lunch" | "Dinner" | "Snack";
  time: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  tags: string[];
};

export type NutritionToday = {
  date: string;
  calorie_target: number;
  consumed_calories: number;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
  };
  hydration: {
    goal_liters: number;
    current_liters: number;
  };
  meals: NutritionMeal[];
  insights: string[];
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

type RequestOptions = RequestInit & {
  skipAuth?: boolean;
};

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function isAuthenticated() {
  return Boolean(getToken());
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const token = getToken();

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  if (!options.skipAuth && token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get("content-type") ?? "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message = data?.message ?? data?.error ?? `Request failed with status ${response.status}`;

    if (response.status === 401 && !options.skipAuth) {
      clearToken();
      window.dispatchEvent(new Event("auth:logout"));
    }

    throw new ApiError(response.status, message, data);
  }

  return data as T;
}

export const api = {
  register(payload: {
    first_name: string;
    last_name: string;
    username: string;
    email: string;
    password: string;
  }) {
    return request<{ message: string; token: string }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
      skipAuth: true,
    });
  },
  login(payload: { email: string; password: string }) {
    return request<{ token: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
      skipAuth: true,
    });
  },
  logout() {
    return request<{ message: string }>("/api/auth/logout", {
      method: "POST",
    });
  },
  getCurrentUser() {
    return request<User>("/api/auth/me");
  },
  updateCurrentUser(payload: {
    first_name?: string;
    last_name?: string;
    username?: string;
    email?: string;
  }) {
    return request<{ message: string; user: User }>("/api/auth/me", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
  changePassword(payload: { currentPassword: string; newPassword: string }) {
    return request<{ message: string }>("/api/auth/change-password", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  deleteCurrentUser() {
    return request<{ message: string }>("/api/auth/me", {
      method: "DELETE",
    });
  },
  getProfile() {
    return request<{ profile: Profile }>("/api/profile/me");
  },
  createProfile(payload: Record<string, any>) {
    return request<{ message: string; profile: Profile }>("/api/profile/create", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  updateProfile(payload: Record<string, any>) {
    return request<{ message: string; profile: Profile }>("/api/profile/update", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
  getActiveRecommendation() {
    return request<ActiveRecommendation>("/api/recommendation/active");
  },
  generateRecommendationPlan() {
    return request<{ plan: RecommendationPlan; version: number }>(
      "/api/recommendation/generate-plan",
      { method: "POST" },
    );
  },
  listMeasurements() {
    return request<Measurement[]>("/api/tracking/measurements");
  },
  createMeasurement(payload: {
    measuredAt: string;
    weightKg?: number | null;
    waistCm?: number | null;
    sleepHoursAvg?: number | null;
    stepsAvg?: number | null;
    heartRate?: number | null;
  }) {
    return request<{
      measurement: Measurement;
      adjustment: { action: string; reason: string };
    }>("/api/tracking/measurements", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  createAdherenceLog(payload: {
    logDate: string;
    workoutDone: boolean;
    completionPct: number;
    comment?: string | null;
  }) {
    return request<AdherenceLog>("/api/tracking/adherence", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  listAdherenceLogs() {
    return request<AdherenceLog[]>("/api/tracking/adherence");
  },
  getNutritionToday() {
    return request<NutritionToday>("/api/nutrition/today");
  },
  getChatMessages() {
    return request<ChatMessage[]>("/api/chat/messages");
  },
  sendChatMessage(payload: { content: string }) {
    return request<{
      userMessage: ChatMessage;
      assistantMessage: ChatMessage;
      messages: ChatMessage[];
    }>("/api/chat/messages", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  clearChatMessages() {
    return request<{ message: string; messages: ChatMessage[] }>("/api/chat/messages", {
      method: "DELETE",
    });
  },
};

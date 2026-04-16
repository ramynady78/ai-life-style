const API_BASE_URL = "http://localhost:5000";
const TOKEN_KEY = "auth_token";

export type User = {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  created_at: string;
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
  daily_routine: string;
  calorie_target: number;
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
  created_at: string;
};

export type AdherenceLog = {
  id: string;
  user_id: string;
  log_date: string;
  workout_done: boolean;
  completion_pct: number | null;
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
    const message =
      data?.message ?? data?.error ?? `Request failed with status ${response.status}`;

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
  getCurrentUser() {
    return request<User>("/api/auth/me");
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
};

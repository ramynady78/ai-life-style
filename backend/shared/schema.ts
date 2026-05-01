export type GoalType = "lose_weight" | "maintain" | "gain_muscle";
export type ExperienceLevel = "beginner" | "intermediate" | "advanced";
export type RecommendationStatus = "active" | "archived";
export type GeneratedBy = "rule_based" | "ai";

export type User = {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  created_at: string;
};

export type UserProfile = {
  user_id: string;
  age: number | null;
  gender: "male" | "female" | null;
  height_cm: number | null;
  initial_weight_kg: number | null;
  goal_type: GoalType | null;
  experience_level: ExperienceLevel | null;
  gym_days_per_week: number | null;
  session_minutes: number | null;
  injuries: string[] | null;
  chronic_flags: string[] | null;
  updated_at: string;
};

export type RecommendationContent = {
  workout_plan: string;
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
  recommendation_cards?: RecommendationCard[];
  safety_notes?: string[];
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

export type Recommendation = {
  id: string;
  user_id: string;
  version: number;
  status: RecommendationStatus;
  content: RecommendationContent;
  generated_by: GeneratedBy;
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

export type AdjustmentDecision =
  | { action: "increase_intensity"; reason: string }
  | { action: "reduce_difficulty"; reason: string }
  | { action: "no_change"; reason: string };

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
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

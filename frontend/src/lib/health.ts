import type { Measurement, RecommendationPlan } from "@/lib/api";

export function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function formatWeekday(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
  }).format(new Date(value));
}

export function calculateBmi(weightKg?: number | null, heightCm?: number | null) {
  if (!weightKg || !heightCm) {
    return null;
  }

  const heightMeters = heightCm / 100;
  return Number((weightKg / (heightMeters * heightMeters)).toFixed(1));
}

export function getBmiCategory(bmi?: number | null) {
  if (!bmi) return "Unknown";
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Overweight";
  return "Obese";
}

export function goalLabel(goalType?: string | null) {
  switch (goalType) {
    case "lose_weight":
      return "Fat Loss";
    case "gain_muscle":
      return "Muscle Gain";
    case "maintain":
      return "Fitness";
    default:
      return goalType ? goalType.replace(/_/g, " ") : "Not set";
  }
}

export function normalizeGoalType(value: string) {
  switch (value) {
    case "Fat Loss":
      return "lose_weight";
    case "Muscle Gain":
      return "gain_muscle";
    default:
      return "maintain";
  }
}

export function normalizeExperienceLevel(value: string) {
  const lowered = value.toLowerCase();
  if (lowered.includes("advanced")) return "advanced";
  if (lowered.includes("intermediate")) return "intermediate";
  return "beginner";
}

export function experienceLabel(value?: string | null) {
  switch (value) {
    case "beginner":
      return "Beginner";
    case "intermediate":
      return "Intermediate";
    case "advanced":
      return "Advanced";
    default:
      return value ? value[0].toUpperCase() + value.slice(1) : "Not set";
  }
}

export function splitPlanLines(value?: string) {
  return (value ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function parseWorkoutPlan(plan?: RecommendationPlan["workout_plan"]) {
  const lines = splitPlanLines(plan);
  const summary = lines.filter((line) => !/^Day|^Optional Day/i.test(line));
  const days: Array<{ title: string; details: string[] }> = [];

  for (const line of lines) {
    if (/^Day|^Optional Day/i.test(line)) {
      const [title, ...rest] = line.split(":");
      days.push({
        title: title.trim(),
        details: rest.join(":").split(",").map((item) => item.trim()).filter(Boolean),
      });
    }
  }

  return { summary, days };
}

export function parseRoutine(plan?: RecommendationPlan["daily_routine"]) {
  return splitPlanLines(plan).map((line) => {
    const [label, ...rest] = line.split(":");
    return {
      label: label.trim(),
      value: rest.join(":").trim(),
    };
  });
}

export function measurementChartPoints(measurements: Measurement[], heightCm?: number | null) {
  return measurements.map((measurement) => ({
    ...measurement,
    dateLabel: formatShortDate(measurement.measured_at),
    bmi: calculateBmi(measurement.weight_kg, heightCm),
  }));
}

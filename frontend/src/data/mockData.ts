export const dashboardChartData = {
  weightTrend: [
    { name: "W1", value: 75.2 },
    { name: "W2", value: 74.5 },
    { name: "W3", value: 73.8 },
    { name: "W4", value: 73.0 },
    { name: "W5", value: 72.1 },
    { name: "W6", value: 71.5 },
  ],
  waistTrend: [
    { name: "W1", value: 88.0 },
    { name: "W2", value: 87.2 },
    { name: "W3", value: 86.5 },
    { name: "W4", value: 85.8 },
    { name: "W5", value: 84.5 },
    { name: "W6", value: 83.2 },
  ],
};

export type Difficulty = "Beginner" | "Intermediate" | "Advanced";

export interface Exercise {
  id: string;
  name: string;
  muscle: string;
  difficulty: Difficulty;
  setsReps: string;
}

export interface WorkoutDay {
  id: string;
  dayNumber: number;
  title: string;
  subtitle: string;
  warmup: string[];
  exercises: Exercise[];
  cooldown: string[];
}

export const mockWorkoutPlan: WorkoutDay[] = [
  {
    id: "d1",
    dayNumber: 1,
    title: "Push & Core",
    subtitle: "Upper body pushing movements",
    warmup: ["5 min Light Jog", "Dynamic Stretching"],
    exercises: [
      { id: "e1", name: "Bench Press", muscle: "Chest", difficulty: "Intermediate", setsReps: "3x10-12" },
      { id: "e2", name: "Shoulder Press", muscle: "Shoulders", difficulty: "Intermediate", setsReps: "3x12" },
      { id: "e3", name: "Tricep Dips", muscle: "Triceps", difficulty: "Beginner", setsReps: "3x15" },
    ],
    cooldown: ["Static Stretching (Hamstrings, Chest)"],
  },
  {
    id: "d2",
    dayNumber: 2,
    title: "Pull & Cardio",
    subtitle: "Back thickness and stamina",
    warmup: ["5 min Rower", "Arm Circles"],
    exercises: [
      { id: "e4", name: "Deadlift", muscle: "Back", difficulty: "Advanced", setsReps: "3x8" },
      { id: "e5", name: "Pull Ups", muscle: "Back", difficulty: "Intermediate", setsReps: "3xMax" },
      { id: "e6", name: "Treadmill Intervals", muscle: "Cardio", difficulty: "Beginner", setsReps: "15 mins" },
    ],
    cooldown: ["Child's Pose", "Cat-Cow Stretches"],
  },
  {
    id: "d3",
    dayNumber: 3,
    title: "Lower Body",
    subtitle: "Quad and hamstring focus",
    warmup: ["5 min Jump Rope", "Bodyweight Squats"],
    exercises: [
      { id: "e7", name: "Barbell Squat", muscle: "Legs", difficulty: "Advanced", setsReps: "4x8-10" },
      { id: "e8", name: "Lunges", muscle: "Legs", difficulty: "Beginner", setsReps: "3x12/leg" },
      { id: "e9", name: "Calf Raises", muscle: "Calves", difficulty: "Beginner", setsReps: "3x20" },
    ],
    cooldown: ["Quadriceps Stretch", "Foam Rolling"],
  },
];

// === MEASUREMENTS ===
export interface Measurement {
  date: string;
  weight: number;
  bmi: number;
  bodyFat: number;
  waist: number;
  chest: number;
  hips: number;
}
export const mockMeasurements: Measurement[] = [
  { date: "Jan 1", weight: 78.0, bmi: 26.5, bodyFat: 22.1, waist: 90, chest: 98, hips: 100 },
  { date: "Jan 15", weight: 77.2, bmi: 26.2, bodyFat: 21.8, waist: 89, chest: 97, hips: 99 },
  { date: "Feb 1", weight: 76.0, bmi: 25.8, bodyFat: 21.2, waist: 87, chest: 96, hips: 98 },
  { date: "Feb 15", weight: 75.2, bmi: 25.5, bodyFat: 20.8, waist: 86, chest: 95, hips: 97 },
  { date: "Mar 1", weight: 74.0, bmi: 25.1, bodyFat: 20.3, waist: 84, chest: 94, hips: 96 },
  { date: "Mar 15", weight: 73.1, bmi: 24.8, bodyFat: 19.9, waist: 83, chest: 93, hips: 95 },
];

// === MEALS ===
export interface Meal {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  time: string;
  type: "Breakfast" | "Lunch" | "Dinner" | "Snack";
  tags: string[];
}
export const mockMeals: Meal[] = [
  { id: "m1", name: "Greek Yogurt & Berries", calories: 280, protein: 18, carbs: 32, fat: 8, time: "7:30 AM", type: "Breakfast", tags: ["High Protein", "Antioxidants"] },
  { id: "m2", name: "Scrambled Eggs with Spinach", calories: 320, protein: 24, carbs: 6, fat: 20, time: "7:30 AM", type: "Breakfast", tags: ["Keto-friendly", "Iron"] },
  { id: "m3", name: "Grilled Chicken Salad", calories: 450, protein: 42, carbs: 18, fat: 22, time: "12:30 PM", type: "Lunch", tags: ["High Protein", "Low Carb"] },
  { id: "m4", name: "Quinoa & Roasted Veggies", calories: 520, protein: 18, carbs: 68, fat: 14, time: "12:30 PM", type: "Lunch", tags: ["Plant-based", "Fiber"] },
  { id: "m5", name: "Salmon with Sweet Potato", calories: 580, protein: 38, carbs: 45, fat: 18, time: "7:00 PM", type: "Dinner", tags: ["Omega-3", "Complex Carbs"] },
  { id: "m6", name: "Turkey Stir Fry", calories: 490, protein: 36, carbs: 38, fat: 14, time: "7:00 PM", type: "Dinner", tags: ["Lean Protein", "Veggies"] },
  { id: "m7", name: "Almonds & Apple", calories: 180, protein: 4, carbs: 22, fat: 9, time: "3:00 PM", type: "Snack", tags: ["Healthy Fats"] },
  { id: "m8", name: "Protein Shake", calories: 220, protein: 28, carbs: 18, fat: 4, time: "10:00 AM", type: "Snack", tags: ["Post-workout"] },
];

// === RECOMMENDATIONS ===
export interface Recommendation {
  id: string;
  category: "Nutrition" | "Workout" | "Recovery" | "Lifestyle";
  priority: "High" | "Medium" | "Low";
  title: string;
  description: string;
  action: string;
  icon: string;
}
export const mockRecommendations: Recommendation[] = [
  { id: "r1", category: "Nutrition", priority: "High", title: "Increase Protein Intake", description: "Based on your muscle gain goal, increase daily protein to 150g. Your current intake is ~110g.", action: "View meal plan", icon: "utensils" },
  { id: "r2", category: "Workout", priority: "High", title: "Add Cardio Sessions", description: "Your weight loss plateau suggests adding 2 extra cardio sessions this week.", action: "View workout plan", icon: "dumbbell" },
  { id: "r3", category: "Recovery", priority: "Medium", title: "Optimize Sleep Schedule", description: "Your average sleep of 6.2hrs is below target. Aim for 7-8 hours for better recovery.", action: "Set sleep reminder", icon: "moon" },
  { id: "r4", category: "Lifestyle", priority: "Medium", title: "Hydration Goal", description: "You're averaging 1.8L of water per day. Increase to 2.5L for better metabolism and recovery.", action: "Track water intake", icon: "droplets" },
  { id: "r5", category: "Workout", priority: "Low", title: "Try Progressive Overload", description: "You've been consistent with weights. It's time to increase bench press by 5kg.", action: "Update workout", icon: "trending-up" },
  { id: "r6", category: "Nutrition", priority: "Low", title: "Add Omega-3 Foods", description: "Include more fatty fish or supplements to support joint health and inflammation reduction.", action: "View foods", icon: "heart" },
];

// === ANALYTICS ===
export const mockWeeklyStats = {
  caloriesBurned: [320, 410, 0, 500, 380, 450, 0],
  workoutsCompleted: [1, 1, 0, 1, 1, 1, 0],
  waterIntake: [2.1, 2.5, 1.8, 2.3, 2.6, 2.4, 1.9],
  sleepHours: [6.5, 7.2, 8.0, 6.8, 7.5, 7.0, 8.5],
  days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
};
export const mockHealthScore = {
  overall: 78,
  nutrition: 72,
  fitness: 85,
  sleep: 68,
  hydration: 80,
  recovery: 75,
};
export const mockMonthlyProgress = [
  { month: "Oct", weight: 80.0, bmi: 27.1, calories: 2100 },
  { month: "Nov", weight: 78.5, bmi: 26.6, calories: 1980 },
  { month: "Dec", weight: 77.0, bmi: 26.1, calories: 1920 },
  { month: "Jan", weight: 75.8, bmi: 25.7, calories: 1850 },
  { month: "Feb", weight: 74.5, bmi: 25.2, calories: 1800 },
  { month: "Mar", weight: 73.1, bmi: 24.8, calories: 1750 },
];

// === AI CHAT ===
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  time: string;
}
export const mockChatMessages: ChatMessage[] = [
  { id: "c1", role: "assistant", content: "Hello! I'm your LifeFit AI coach. How can I help you today? You can ask me about your nutrition, workouts, or health goals.", time: "10:00 AM" },
  { id: "c2", role: "user", content: "Why am I not losing weight even though I'm following the plan?", time: "10:02 AM" },
  { id: "c3", role: "assistant", content: "Based on your recent check-in data, you might be experiencing a plateau. This is normal after 4-6 weeks. I recommend: ① Increase cardio by 20 minutes, ② Try intermittent fasting (16:8), ③ Check if you're tracking all meals accurately. Want me to adjust your plan?", time: "10:02 AM" },
  { id: "c4", role: "user", content: "Yes please, can you suggest a better cardio routine?", time: "10:05 AM" },
  { id: "c5", role: "assistant", content: "Great! Based on your fitness level (Intermediate), here's what I suggest: Monday & Thursday — 30 min HIIT intervals, Wednesday — 45 min steady-state cardio (Zone 2). This should break your plateau within 2 weeks. Shall I add this to your workout plan?", time: "10:05 AM" },
];

// === HABITS ===
export interface Habit {
  id: string;
  name: string;
  icon: string;
  completed: boolean;
  streak: number;
  target: string;
}
export const mockHabits: Habit[] = [
  { id: "h1", name: "Drink 2.5L Water", icon: "droplets", completed: true, streak: 5, target: "2.5L" },
  { id: "h2", name: "8,000 Steps", icon: "footprints", completed: true, streak: 3, target: "8,000" },
  { id: "h3", name: "Workout Session", icon: "dumbbell", completed: false, streak: 4, target: "1 session" },
  { id: "h4", name: "7h Sleep", icon: "moon", completed: true, streak: 2, target: "7 hrs" },
  { id: "h5", name: "Log Meals", icon: "utensils", completed: false, streak: 6, target: "All meals" },
  { id: "h6", name: "Meditation 10min", icon: "brain", completed: false, streak: 1, target: "10 min" },
];

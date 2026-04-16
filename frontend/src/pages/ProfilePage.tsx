import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Target, AlertCircle } from "lucide-react";
import { SidebarLayout } from "@/components/SidebarLayout";
import { api, ApiError, type Profile } from "@/lib/api";
import {
  experienceLabel,
  normalizeExperienceLevel,
  normalizeGoalType,
  goalLabel,
} from "@/lib/health";
import { toast } from "@/hooks/use-toast";

type ProfileFormState = {
  age: string;
  gender: "male" | "female";
  height_cm: string;
  initial_weight_kg: string;
  goal_type: string;
  experience_level: string;
  gym_days_per_week: string;
  session_minutes: string;
  injuries: string[];
};

const defaultForm: ProfileFormState = {
  age: "25",
  gender: "male",
  height_cm: "175",
  initial_weight_kg: "75",
  goal_type: "lose_weight",
  experience_level: "beginner",
  gym_days_per_week: "3",
  session_minutes: "60",
  injuries: ["None"],
};

function mapProfileToForm(profile: Profile): ProfileFormState {
  return {
    age: String(profile.age ?? ""),
    gender: (profile.gender as "male" | "female") ?? "male",
    height_cm: String(profile.height_cm ?? ""),
    initial_weight_kg: String(profile.initial_weight_kg ?? ""),
    goal_type: profile.goal_type ?? "lose_weight",
    experience_level: profile.experience_level ?? "beginner",
    gym_days_per_week: String(profile.gym_days_per_week ?? 3),
    session_minutes: String(profile.session_minutes ?? 60),
    injuries:
      profile.injuries && profile.injuries.length > 0
        ? profile.injuries
        : ["None"],
  };
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<ProfileFormState>(defaultForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasExistingProfile, setHasExistingProfile] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      try {
        const response = await api.getProfile();
        if (!isMounted) return;
        setForm(mapProfileToForm(response.profile));
        setHasExistingProfile(true);
      } catch (err) {
        if (!isMounted) return;

        if (err instanceof ApiError && err.status === 404) {
          setHasExistingProfile(false);
          setForm(defaultForm);
        } else {
          setError(err instanceof Error ? err.message : "Unable to load profile");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedGoalLabel = useMemo(() => goalLabel(form.goal_type), [form.goal_type]);

  const handleChange = (field: keyof ProfileFormState, value: string | string[]) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    const payload = {
      age: Number(form.age),
      gender: form.gender,
      height_cm: Number(form.height_cm),
      initial_weight_kg: Number(form.initial_weight_kg),
      goal_type: form.goal_type,
      experience_level: form.experience_level,
      gym_days_per_week: Number(form.gym_days_per_week),
      session_minutes: Number(form.session_minutes),
      injuries: form.injuries.includes("None") ? null : form.injuries,
      chronic_flags: null,
    };

    try {
      if (hasExistingProfile) {
        await api.updateProfile(payload);
      } else {
        await api.createProfile(payload);
        setHasExistingProfile(true);
      }

      await api.generateRecommendationPlan();

      toast({
        title: hasExistingProfile ? "Profile updated" : "Profile created",
        description: "Your new recommendation plan is ready.",
      });

      navigate("/plan");
    } catch (err: any) {
      setError(err.message ?? "Unable to save profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <SidebarLayout className="p-4 sm:p-8">
        <div className="max-w-3xl mx-auto w-full rounded-2xl border border-border bg-card p-8 text-muted-foreground">
          Loading your profile...
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout className="p-4 sm:p-8">
      <div className="max-w-3xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-card rounded-2xl shadow-sm border border-border p-6 md:p-8">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-primary tracking-tight">
              {hasExistingProfile ? "Update Your Profile" : "Create Your Profile"}
            </h1>
            <p className="text-muted-foreground mt-2">
              Please provide accurate information to generate your personalized
              AI plan.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="font-bold text-primary tracking-tight">Age</label>
                <input
                  type="number"
                  value={form.age}
                  onChange={(e) => handleChange("age", e.target.value)}
                  className="w-full px-4 py-3 bg-background font-bold text-primary tracking-tight border-2 border-border rounded-xl focus:border-ring focus:ring-4 focus:ring-accent/10 transition-all"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="font-bold text-primary tracking-tight">Gender</label>
                <select
                  value={form.gender}
                  onChange={(e) => handleChange("gender", e.target.value as "male" | "female")}
                  className="w-full px-4 py-3 bg-background font-bold text-primary tracking-tight border-2 border-border rounded-xl focus:border-ring focus:ring-4 focus:ring-accent/10 transition-all appearance-none"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="font-bold text-primary tracking-tight">Height (cm)</label>
                <input
                  type="number"
                  value={form.height_cm}
                  onChange={(e) => handleChange("height_cm", e.target.value)}
                  className="w-full px-4 py-3 bg-background font-bold text-primary tracking-tight border-2 border-border rounded-xl focus:border-ring focus:ring-4 focus:ring-accent/10 transition-all"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="font-bold text-primary tracking-tight">Weight (kg)</label>
                <input
                  type="number"
                  value={form.initial_weight_kg}
                  onChange={(e) => handleChange("initial_weight_kg", e.target.value)}
                  className="w-full px-4 py-3 bg-background font-bold text-primary tracking-tight border-2 border-border rounded-xl focus:border-ring focus:ring-4 focus:ring-accent/10 transition-all"
                  required
                />
              </div>
            </div>

            <hr className="border-border" />

            <div className="space-y-6">
              <div className="flex items-center gap-2 text-primary">
                <Target className="w-5 h-5" />
                <h3 className="text-lg font-semibold">Goals & Experience</h3>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="font-bold text-primary tracking-tight">
                    Primary Goal
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {["Fat Loss", "Fitness", "Muscle Gain"].map((goal) => {
                      const value = normalizeGoalType(goal);
                      return (
                        <button
                          key={goal}
                          type="button"
                          onClick={() => handleChange("goal_type", value)}
                          className={`px-4 py-2 rounded-full text-sm transition-all ${
                            form.goal_type === value
                              ? "bg-primary text-primary-foreground font-bold tracking-tight shadow-md shadow-primary/20"
                              : "bg-background font-bold text-primary tracking-tight border-2 border-border hover:border-primary/30"
                          }`}
                        >
                          {goal}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Selected goal: {selectedGoalLabel}
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="font-bold text-primary tracking-tight">
                    Experience Level
                  </label>
                  <select
                    value={experienceLabel(form.experience_level)}
                    onChange={(e) =>
                      handleChange(
                        "experience_level",
                        normalizeExperienceLevel(e.target.value),
                      )
                    }
                    className="w-full px-4 py-3 bg-background font-bold text-primary tracking-tight border-2 border-border rounded-xl focus:border-ring focus:ring-4 focus:ring-accent/10 transition-all appearance-none"
                  >
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-2">
                  <label className="font-bold text-primary tracking-tight">
                    Gym Days per Week
                  </label>
                  <select
                    value={form.gym_days_per_week}
                    onChange={(e) => handleChange("gym_days_per_week", e.target.value)}
                    className="w-full px-4 py-3 bg-background font-bold text-primary tracking-tight border-2 border-border rounded-xl focus:border-ring focus:ring-4 focus:ring-accent/10 transition-all appearance-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                      <option key={day} value={day}>
                        {day} Days
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="font-bold text-primary tracking-tight">
                    Session Duration
                  </label>
                  <select
                    value={form.session_minutes}
                    onChange={(e) => handleChange("session_minutes", e.target.value)}
                    className="w-full px-4 py-3 bg-background font-bold text-primary tracking-tight border-2 border-border rounded-xl focus:border-ring focus:ring-4 focus:ring-accent/10 transition-all appearance-none"
                  >
                    {[45, 60, 90].map((minutes) => (
                      <option key={minutes} value={minutes}>
                        {minutes} Minutes
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <hr className="border-border" />

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <AlertCircle className="w-5 h-5" />
                <h3 className="text-lg font-semibold">Existing Injuries</h3>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              {["None", "Knee", "Back", "Shoulder", "Ankle"].map((injury) => (
                <label
                  key={injury}
                  className="flex items-center gap-2 cursor-pointer group"
                >
                  <input
                    type="checkbox"
                    checked={form.injuries.includes(injury)}
                    onChange={() => {
                      if (injury === "None") {
                        handleChange("injuries", ["None"]);
                        return;
                      }

                      const updated = form.injuries
                        .filter((value) => value !== "None")
                        .filter((value) => value !== injury);

                      if (!form.injuries.includes(injury)) {
                        updated.push(injury);
                      }

                      handleChange("injuries", updated.length > 0 ? updated : ["None"]);
                    }}
                    className="w-4.5 h-4.5 rounded border-border text-accent focus:ring-accent transition-all"
                  />
                  <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                    {injury}
                  </span>
                </label>
              ))}
            </div>

            <div className="pt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold text-lg flex justify-center items-center gap-2 hover:bg-primary/90 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Generating Plan..." : "Generate AI Plan"}
                {!isSubmitting && <Sparkles className="w-5 h-5 text-accent" />}
              </button>
            </div>
          </form>
        </div>
      </div>
    </SidebarLayout>
  );
}

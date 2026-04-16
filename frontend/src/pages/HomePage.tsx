import { useNavigate } from "react-router-dom";
import { ArrowRight, Dumbbell, Activity, Brain } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { PageContainer } from "@/components/PageContainer";
import { useAuth } from "@/context/AuthContext";

export default function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <>
      <Navbar />
      <PageContainer className="px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="pt-24 pb-16 flex flex-col items-center text-center max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-primary tracking-tight leading-[1.15]">
            AI-Based{" "}
            <span className="bg-gradient-to-r from-emerald-500 to-blue-500 bg-clip-text text-transparent">
              Healthy Lifestyle
            </span>
            <br />
            Recommendation System
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed">
            A smart system that generates personalized workout and routine
            recommendations based on your physiology, adjusting automatically as
            you progress.
          </p>
          <button
            onClick={() => navigate(isAuthenticated ? "/profile" : "/login")}
            className="mt-10 px-8 py-4 bg-primary text-primary-foreground rounded-full font-semibold text-lg flex items-center gap-2 shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-1 transition-all duration-300"
          >
            Get Started
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 pb-24">
          {/* Card 1 */}
          <div className="bg-card rounded-2xl p-8 border border-border shadow-sm hover:shadow-lg hover:border-blue-200 transition-all duration-300 group">
            <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <Dumbbell className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-card-foreground mb-3">
              Personalized Workout Plan
            </h3>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Tailored exercise schedules based on your intake data including
              experience level, available equipment, and specific goals.
            </p>
            <a
              href="#"
              className="text-blue-600 font-semibold hover:text-blue-700 inline-flex items-center gap-1 group-hover:gap-2 transition-all"
            >
              Learn more <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {/* Card 2 */}
          <div className="bg-card rounded-2xl p-8 border border-border shadow-sm hover:shadow-lg hover:border-emerald-200 transition-all duration-300 group">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <Activity className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-card-foreground mb-3">
              Progress Tracking
            </h3>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Log your daily activities and physiological measurements to
              visualize your journey towards a healthier lifestyle.
            </p>
            <a
              href="#"
              className="text-emerald-600 font-semibold hover:text-emerald-700 inline-flex items-center gap-1 group-hover:gap-2 transition-all"
            >
              Learn more <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {/* Card 3 */}
          <div className="bg-card rounded-2xl p-8 border border-border shadow-sm hover:shadow-lg hover:border-purple-200 transition-all duration-300 group">
            <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <Brain className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-card-foreground mb-3">
              Smart Plan Adjustment
            </h3>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Our AI algorithms analyze your adherence and progress to
              automatically refine your routine for optimal results.
            </p>
            <a
              href="#"
              className="text-purple-600 font-semibold hover:text-purple-700 inline-flex items-center gap-1 group-hover:gap-2 transition-all"
            >
              Learn more <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* HOW IT WORKS Section */}
        <div className="py-20 bg-white -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 border-t border-border">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
                How LifeFit AI Works
              </h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                Your journey to a healthier lifestyle in three simple steps.
              </p>
            </div>

            <div className="relative">
              {/* Connecting line for desktop */}
              <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-muted"></div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
                {/* Step 1 */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-24 h-24 rounded-full bg-background border-4 border-white shadow-lg flex items-center justify-center relative mb-6">
                    <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-primary text-white font-bold flex items-center justify-center border-2 border-white shadow-sm">
                      1
                    </div>
                    <Activity className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">
                    Create Your Profile
                  </h3>
                  <p className="text-muted-foreground">
                    Input your physical stats, experience level, available
                    equipment, and goals.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-24 h-24 rounded-full bg-background border-4 border-white shadow-lg flex items-center justify-center relative mb-6">
                    <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-primary text-white font-bold flex items-center justify-center border-2 border-white shadow-sm">
                      2
                    </div>
                    <Brain className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">
                    Get AI Recommendations
                  </h3>
                  <p className="text-muted-foreground">
                    Our AI engine creates a highly personalized, adaptable
                    workout and nutrition plan.
                  </p>
                </div>

                {/* Step 3 */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-24 h-24 rounded-full bg-background border-4 border-white shadow-lg flex items-center justify-center relative mb-6">
                    <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-primary text-white font-bold flex items-center justify-center border-2 border-white shadow-sm">
                      3
                    </div>
                    <Dumbbell className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">
                    Track & Improve
                  </h3>
                  <p className="text-muted-foreground">
                    Log your progress and watch as the AI continually adjusts
                    your routine for optimal results.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI PERSONALIZATION Section */}
        <div className="py-20 bg-primary -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 text-primary-foreground">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-6">
                Powered by Advanced AI
              </h2>
              <p className="text-primary-foreground/80 text-lg leading-relaxed mb-8">
                Unlike static templates, LifeFit AI continuously learns from
                your feedback, adherence rates, and biometric changes to
                perfectly calibrate your fitness journey.
              </p>
              <ul className="space-y-4">
                {[
                  "Dynamic adjustment of sets, reps, and weights",
                  "Nutrition macros perfectly tuned to your metabolic rate",
                  "Recovery suggestions based on sleep and strain data",
                  "Plateau detection and protocol pivoting",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="mt-1 w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                      <div className="w-2 h-2 rounded-full bg-accent"></div>
                    </div>
                    <span className="text-primary-foreground/90 font-medium">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-[#0f1b36] border border-[#1e2e54] p-8 rounded-3xl shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl"></div>

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8 pb-6 border-b border-[#1e2e54]">
                  <h3 className="font-bold text-xl flex items-center gap-2">
                    <Brain className="w-6 h-6 text-accent" /> AI Analysis
                  </h3>
                  <span className="px-3 py-1 bg-accent/10 text-accent text-xs font-bold rounded-full">
                    LIVE
                  </span>
                </div>

                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-primary-foreground/60">
                        Recommendation Confidence
                      </span>
                      <span className="font-bold text-accent">94%</span>
                    </div>
                    <div className="h-2 w-full bg-[#0a1224] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent rounded-full"
                        style={{ width: "94%" }}
                      ></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="bg-[#0a1224] p-4 rounded-xl border border-[#1e2e54]">
                      <div className="text-3xl font-extrabold text-white mb-1">
                        1.2M+
                      </div>
                      <div className="text-xs text-primary-foreground/60 uppercase tracking-wider font-semibold">
                        Data Points Analyzed
                      </div>
                    </div>
                    <div className="bg-[#0a1224] p-4 rounded-xl border border-[#1e2e54]">
                      <div className="text-3xl font-extrabold text-white mb-1">
                        2,450
                      </div>
                      <div className="text-xs text-primary-foreground/60 uppercase tracking-wider font-semibold">
                        Personalized Routines
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* TESTIMONIALS Section */}
        <div className="py-20 bg-muted/50 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 border-t border-border">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
                Success Stories
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  name: "Sarah M.",
                  role: "Lost 15 lbs",
                  quote:
                    "The AI adjusted my plan when I hit a plateau. It felt like having a personal trainer watching my data every single day.",
                  initial: "S",
                  color: "bg-purple-500",
                },
                {
                  name: "David K.",
                  role: "Gained 8 lbs Muscle",
                  quote:
                    "I've never been so consistent. The smart workout adjustments ensure I'm always pushing exactly as hard as I need to.",
                  initial: "D",
                  color: "bg-blue-500",
                },
                {
                  name: "Elena R.",
                  role: "Marathon Finisher",
                  quote:
                    "LifeFit perfectly balanced my running volume with strength training and nutrition. I felt unstoppable on race day.",
                  initial: "E",
                  color: "bg-emerald-500",
                },
              ].map((t, i) => (
                <div
                  key={i}
                  className="bg-card p-8 rounded-2xl border border-border shadow-sm"
                >
                  <div className="flex items-center gap-1 mb-6 text-orange-400">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className="w-5 h-5 fill-current"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27Z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-muted-foreground text-lg mb-8 italic">
                    "{t.quote}"
                  </p>
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-full ${t.color} text-white flex items-center justify-center font-bold text-lg`}
                    >
                      {t.initial}
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground">{t.name}</h4>
                      <p className="text-sm font-semibold text-muted-foreground">
                        {t.role}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </PageContainer>

      {/* FOOTER */}
      <footer className="bg-primary text-primary-foreground py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-white leading-none">
                LifeFit AI
              </span>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-sm font-medium text-primary-foreground/70">
            <a href="/home" className="hover:text-white transition-colors">
              Home
            </a>
            <a href="/profile" className="hover:text-white transition-colors">
              Profile
            </a>
            <a href="/plan" className="hover:text-white transition-colors">
              Plan
            </a>
            <a href="/dashboard" className="hover:text-white transition-colors">
              Dashboard
            </a>
            
          </div>

          <div className="text-sm text-primary-foreground/50 font-medium">
            © 2026 LifeFit AI. Graduation Project.
          </div>
        </div>
      </footer>
    </>
  );
}

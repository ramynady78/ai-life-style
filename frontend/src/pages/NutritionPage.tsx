import { useState } from "react";
import { Droplet, Plus, Minus, RefreshCw } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { SidebarLayout } from "@/components/SidebarLayout";
import { mockMeals } from "@/data/mockData";

export default function NutritionPage() {
  const [glasses, setGlasses] = useState(6);
  const maxGlasses = 8;
  const glassVolume = 0.3125; // 2.5L / 8 glasses

  const macroData = [
    { name: "Protein", value: 112, color: "#3B82F6" },
    { name: "Carbs", value: 185, color: "#F97316" },
    { name: "Fat", value: 58, color: "#A855F7" },
  ];

  const mealTypes = ["Breakfast", "Lunch", "Dinner", "Snack"] as const;
  const colors = {
    Breakfast: "bg-orange-500",
    Lunch: "bg-blue-500",
    Dinner: "bg-purple-500",
    Snack: "bg-emerald-500"
  };

  return (
    <SidebarLayout className="p-4 sm:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 animate-in fade-in duration-500">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary tracking-tight">Meal Plan & Nutrition</h1>
          <p className="text-muted-foreground mt-1 font-medium">Today, March 28</p>
        </div>
        <button className="flex items-center gap-2 bg-white border border-border hover:bg-muted text-foreground px-5 py-2.5 rounded-xl font-semibold shadow-sm hover:shadow-md transition-all duration-200">
          <RefreshCw className="w-4 h-4 text-muted-foreground" />
          Regenerate Plan
        </button>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-card p-5 rounded-2xl border border-border shadow-sm">
          <p className="text-sm font-semibold text-muted-foreground mb-2">Daily Calories</p>
          <div className="flex items-end justify-between mb-2">
            <h3 className="text-2xl font-bold text-foreground">1,750 <span className="text-sm font-medium text-muted-foreground">/ 2,000</span></h3>
          </div>
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: '87%' }}></div>
          </div>
        </div>
        <div className="bg-card p-5 rounded-2xl border border-border shadow-sm">
          <p className="text-sm font-semibold text-muted-foreground mb-2">Protein</p>
          <div className="flex items-end justify-between mb-2">
            <h3 className="text-2xl font-bold text-foreground">112g <span className="text-sm font-medium text-muted-foreground">/ 150g</span></h3>
          </div>
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: '74%' }}></div>
          </div>
        </div>
        <div className="bg-card p-5 rounded-2xl border border-border shadow-sm">
          <p className="text-sm font-semibold text-muted-foreground mb-2">Carbs</p>
          <div className="flex items-end justify-between mb-2">
            <h3 className="text-2xl font-bold text-foreground">185g <span className="text-sm font-medium text-muted-foreground">/ 220g</span></h3>
          </div>
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-orange-500 rounded-full" style={{ width: '84%' }}></div>
          </div>
        </div>
        <div className="bg-card p-5 rounded-2xl border border-border shadow-sm">
          <p className="text-sm font-semibold text-muted-foreground mb-2">Fat</p>
          <div className="flex items-end justify-between mb-2">
            <h3 className="text-2xl font-bold text-foreground">58g <span className="text-sm font-medium text-muted-foreground">/ 70g</span></h3>
          </div>
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-purple-500 rounded-full" style={{ width: '82%' }}></div>
          </div>
        </div>
      </div>

      {/* Middle Row (Water + Macros) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 animate-in fade-in slide-in-from-bottom-6 duration-500">
        
        {/* Water Tracker */}
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-foreground mb-1">Water Intake</h3>
          <p className="text-sm text-muted-foreground mb-6">Stay hydrated for optimal recovery</p>
          
          <div className="flex-1 flex flex-col items-center justify-center">
            <h4 className="text-3xl font-extrabold text-blue-500 mb-1">{(glasses * glassVolume).toFixed(1)}L <span className="text-lg text-muted-foreground">/ 2.5L</span></h4>
            <p className="text-sm font-medium text-muted-foreground mb-6">{glasses}/{maxGlasses} glasses</p>
            
            <div className="flex flex-wrap justify-center gap-2 mb-8 max-w-[200px]">
              {Array.from({ length: maxGlasses }).map((_, i) => (
                <div key={i} className={`w-8 h-10 rounded-b-xl rounded-t-sm border-2 flex items-end justify-center overflow-hidden transition-all duration-300 ${i < glasses ? 'border-blue-400 bg-blue-50' : 'border-border bg-muted'}`}>
                  {i < glasses && (
                    <div className="w-full bg-blue-400 h-[70%] animate-in slide-in-from-bottom-full"></div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setGlasses(Math.max(0, glasses - 1))}
                className="w-12 h-12 rounded-full border border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors"
              >
                <Minus className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setGlasses(Math.min(maxGlasses, glasses + 1))}
                className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center hover:bg-blue-200 transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Macro Chart */}
        <div className="lg:col-span-2 bg-card p-6 rounded-2xl border border-border shadow-sm flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 w-full">
            <h3 className="text-lg font-bold text-foreground mb-6">Macronutrient Breakdown</h3>
            <div className="space-y-4">
              {macroData.map(m => (
                <div key={m.name} className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: m.color }} />
                  <span className="text-sm font-medium w-16">{m.name}</span>
                  <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(m.value / 220) * 100}%`, backgroundColor: m.color }} />
                  </div>
                  <span className="text-sm font-bold w-12 text-right">{m.value}g</span>
                </div>
              ))}
            </div>
          </div>
          <div className="h-[200px] w-[200px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={macroData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {macroData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Meals Grid */}
      <h3 className="text-xl font-bold text-foreground mb-4">Today's Meals</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-500 mb-8">
        {mealTypes.map(type => (
          <div key={type} className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm flex flex-col">
            <div className="p-4 border-b border-border flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${colors[type]}`}></div>
              <h4 className="font-bold text-foreground">{type}</h4>
            </div>
            
            <div className="p-4 flex-1 space-y-4">
              {mockMeals.filter(m => m.type === type).map(meal => (
                <div key={meal.id} className="p-4 bg-background border border-border rounded-xl hover:shadow-md transition-all group">
                  <div className="flex justify-between items-start mb-2">
                    <h5 className="font-bold text-foreground">{meal.name}</h5>
                    <span className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-1 rounded-md">{meal.time}</span>
                  </div>
                  
                  <div className="text-xs text-muted-foreground mb-3 flex items-center gap-3">
                    <span className="font-bold text-primary">{meal.calories} kcal</span>
                    <span>•</span>
                    <span>{meal.protein}g P</span>
                    <span>•</span>
                    <span>{meal.carbs}g C</span>
                    <span>•</span>
                    <span>{meal.fat}g F</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {meal.tags.map(tag => (
                      <span key={tag} className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-semibold border border-border">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              
              <button className="w-full py-3 border-2 border-dashed border-border rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-all flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> Add {type}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Insights */}
      <div className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 rounded-2xl border border-border p-6 shadow-sm">
        <h4 className="text-sm font-bold text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
          <Droplet className="w-4 h-4" /> Nutrition Insights
        </h4>
        <div className="flex flex-wrap gap-3">
          <span className="px-4 py-2 bg-white rounded-xl text-sm font-medium border border-border shadow-sm text-amber-700">
            ⚠️ You're 38g short on protein today
          </span>
          <span className="px-4 py-2 bg-white rounded-xl text-sm font-medium border border-border shadow-sm text-emerald-700">
            ✅ Great fiber intake from lunch!
          </span>
          <span className="px-4 py-2 bg-white rounded-xl text-sm font-medium border border-border shadow-sm text-blue-700">
            💡 Consider adding omega-3 foods
          </span>
        </div>
      </div>

    </SidebarLayout>
  );
}

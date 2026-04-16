import { useState, type FormEvent } from "react";
import { Navigate, Link, useLocation, useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowRight } from "lucide-react";
import { AuthCard } from "@/components/AuthCard";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, isInitializing } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isInitializing && isAuthenticated) {
    return <Navigate replace to="/dashboard" />;
  }

  const redirectTo = (location.state as { from?: string } | null)?.from ?? "/dashboard";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login({ email, password });
      toast({
        title: "Signed in successfully",
        description: "Your dashboard is ready.",
      });
      navigate(redirectTo, { replace: true });
    } catch (err: any) {
      setError(err.message ?? "Unable to sign in");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthCard>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-primary">Welcome Back</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Sign in to access your personalized plan
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground ml-1">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-muted-foreground" />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-background border-2 border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring focus:ring-4 focus:ring-accent/10 transition-all"
              placeholder="you@example.com"
              required
            />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between ml-1 mr-1">
            <label className="text-sm font-medium text-foreground">
              Password
            </label>
            <a
              href="#"
              className="text-sm font-medium text-accent hover:text-accent/80 transition-colors"
            >
              Forgot?
            </a>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-muted-foreground" />
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-background border-2 border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring focus:ring-4 focus:ring-accent/10 transition-all"
              placeholder="********"
              required
            />
          </div>
        </div>

        <div className="flex items-center ml-1">
          <input
            id="remember-me"
            type="checkbox"
            className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
          />
          <label
            htmlFor="remember-me"
            className="ml-2 block text-sm text-muted-foreground"
          >
            Remember me
          </label>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground py-3.5 px-4 rounded-full font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
        >
          {isLoading ? "Signing in..." : "Sign In"}
          {!isLoading && <ArrowRight className="w-5 h-5" />}
        </button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="font-semibold text-accent hover:text-accent/80 transition-colors"
          >
            Create Account
          </Link>
        </p>
      </div>
    </AuthCard>
  );
}

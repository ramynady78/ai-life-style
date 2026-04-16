import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Mail, Lock, User, ArrowRight } from "lucide-react";
import { AuthCard } from "@/components/AuthCard";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";

export default function SignupPage() {
  const navigate = useNavigate();
  const { register, isAuthenticated, isInitializing } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isInitializing && isAuthenticated) {
    return <Navigate replace to="/profile" />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    const nameParts = fullName.trim().split(/\s+/).filter(Boolean);
    const firstName = nameParts[0] ?? "";
    const lastName = nameParts.slice(1).join(" ") || firstName;

    if (!firstName) {
      setError("Please enter your full name.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      await register({
        first_name: firstName,
        last_name: lastName,
        username: email.split("@")[0],
        email,
        password,
      });

      toast({
        title: "Account created",
        description: "Now let's build your profile.",
      });

      navigate("/profile", { replace: true });
    } catch (err: any) {
      setError(err.message ?? "Unable to create account");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthCard>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-primary">Create Account</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Join to get your AI-powered health plan
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground ml-1">
            Full Name
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-muted-foreground" />
            </div>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-background border-2 border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring focus:ring-4 focus:ring-accent/10 transition-all"
              placeholder="John Doe"
              required
            />
          </div>
        </div>

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
          <label className="text-sm font-medium text-foreground ml-1">
            Password
          </label>
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

        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground ml-1">
            Confirm Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-muted-foreground" />
            </div>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-background border-2 border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring focus:ring-4 focus:ring-accent/10 transition-all"
              placeholder="********"
              required
            />
          </div>
        </div>

        <div className="flex items-start ml-1 pt-2">
          <input
            id="terms"
            type="checkbox"
            required
            className="h-4 w-4 mt-0.5 rounded border-border text-accent focus:ring-accent"
          />
          <label htmlFor="terms" className="ml-2 block text-sm text-muted-foreground leading-relaxed">
            I agree to the <a href="#" className="text-accent hover:underline">Terms of Service</a> and <a href="#" className="text-accent hover:underline">Privacy Policy</a>
          </label>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground py-3.5 px-4 rounded-full font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
        >
          {isLoading ? "Creating Account..." : "Create Account"}
          {!isLoading && <ArrowRight className="w-5 h-5" />}
        </button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-accent hover:text-accent/80 transition-colors">
            Sign In
          </Link>
        </p>
      </div>
    </AuthCard>
  );
}

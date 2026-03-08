import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user, signIn, signUp } = useAuth();

  const [isSignUp, setIsSignUp] = useState(searchParams.get("mode") === "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate("/dashboard");
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = isSignUp ? await signUp(email, password) : await signIn(email, password);

    if (error) {
      toast.error(error.message);
    } else if (isSignUp) {
      toast.success("Check your email to confirm your account!");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary px-4">
      <div className="card-elevated w-full max-w-md p-8">
        <h1 className="font-display text-2xl font-bold text-foreground text-center mb-2">
          Ghost<span className="text-gradient">Wear</span>
        </h1>
        <p className="text-center text-muted-foreground mb-8">
          {isSignUp ? t("auth.signup") : t("auth.login")}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">{t("auth.email")}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="password">{t("auth.password")}</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="mt-1"
            />
          </div>

          <Button type="submit" className="w-full btn-gradient" disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {isSignUp ? t("auth.signup") : t("auth.login")}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          {isSignUp ? t("auth.have_account") : t("auth.no_account")}{" "}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-primary font-medium hover:underline"
          >
            {isSignUp ? t("auth.login") : t("auth.signup")}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;

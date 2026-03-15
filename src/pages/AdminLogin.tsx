import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }

    // Check admin role
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Auth error"); return; }

    const { data: hasRole } = await (supabase as any).rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });

    if (!hasRole) {
      await supabase.auth.signOut();
      toast.error("Access denied — not an admin.");
      return;
    }

    toast.success("Welcome, admin!");
    navigate("/admin");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-sm border-border/50">
        <CardHeader className="text-center space-y-2">
          <ShieldCheck className="w-10 h-10 text-primary mx-auto" />
          <CardTitle className="text-xl">Admin Access</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="current-password"
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {mode === "login" ? "Log in" : "Create account"}
            </Button>
          </form>
          <button
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="mt-4 text-xs text-muted-foreground hover:text-foreground transition-colors w-full text-center"
          >
            {mode === "login" ? "First time? Create account" : "Already have an account? Log in"}
          </button>
        </CardContent>
      </Card>
    </div>
  );
}

import { useState, type FormEvent } from "react"
import { trpc } from "@/lib/trpc"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LogIn } from "lucide-react"

export default function SignIn() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const utils = trpc.useUtils();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(mode === "signup" ? "/api/auth/signup" : "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: name.trim(), username: username.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Sign-in failed. Please try again.");
        return;
      }

      if (data.token) {
        try {
          localStorage.setItem("app_session_token", data.token);
        } catch {}
      }

      // Refresh auth state then redirect according to role
      await utils.auth.me.invalidate();
      if (data.role === "admin") {
        window.location.href = "/hr";
      } else {
        window.location.href = "/";
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f7f4] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="font-semibold text-lg tracking-tight text-[#18352f]">
            Sassy Cosmetic &amp; Beauty Products
          </div>
          <div className="text-sm text-[#6d8075] mt-1">Merchandiser Route Planning</div>
        </div>

        <Card className="border-0 shadow-[0_18px_60px_rgba(37,68,52,.10)] rounded-[28px] overflow-hidden">
          <CardHeader className="bg-[#143f37] text-[#f2f4e8] p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-[.2em] text-[#b7cbb3]">Welcome back</div>
                <CardTitle className="text-2xl mt-2 text-[#f2f4e8]">{mode === "signup" ? "Create account" : "Sign in"}</CardTitle>
              </div>
              <LogIn className="text-[#b7cbb3]" size={22} />
            </div>
          </CardHeader>

          <CardContent className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {mode === "signup" && <div>
                <Label htmlFor="name" className="text-xs uppercase tracking-[.14em] text-[#708078]">
                  Full name
                </Label>
                <Input id="name" type="text" autoComplete="name" value={name} onChange={e => setName(e.target.value)} required className="mt-2 h-12 rounded-xl bg-white border-[#dfe7df]" placeholder="Enter your full name" />
              </div>}

              <div>
                <Label htmlFor="username" className="text-xs uppercase tracking-[.14em] text-[#708078]">
                  Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                  className="mt-2 h-12 rounded-xl bg-white border-[#dfe7df]"
                  placeholder="Enter your username"
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-xs uppercase tracking-[.14em] text-[#708078]">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="mt-2 h-12 rounded-xl bg-white border-[#dfe7df]"
                  placeholder="Enter your password"
                />
              </div>

              {error && (
                <p role="alert" className="rounded-xl bg-[#fff1eb] px-4 py-3 text-sm text-[#a34f38]">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl bg-[#a86743] hover:bg-[#8f5537] text-white shadow-lg shadow-[#a86743]/20"
              >
                {loading ? (mode === "signup" ? "Creating account…" : "Signing in…") : mode === "signup" ? "Create account" : "Sign in"}
              </Button>
              <button type="button" onClick={() => { setMode(mode === "signup" ? "signin" : "signup"); setError(null); }} className="w-full text-sm text-[#6d8075] hover:text-[#18352f]">
                {mode === "signup" ? "Already have an account? Sign in" : "New merchandizer? Create an account"}
              </button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

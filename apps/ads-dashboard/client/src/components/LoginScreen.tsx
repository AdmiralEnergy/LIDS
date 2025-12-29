import { useState } from "react";
import { useUser } from "@/lib/user-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Phone, AlertCircle, Loader2 } from "lucide-react";

export function LoginScreen() {
  const { loginByEmail } = useUser();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setError("");
    setIsLoading(true);

    const user = await loginByEmail(email.trim().toLowerCase());

    if (!user) {
      setError("Email not found. You must be a Twenty CRM workspace member to access ADS Dashboard.");
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0c2f4a] p-4">
      <Card className="w-full max-w-md bg-[#f7f5f2] border-[#c9a648]/30">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-xl bg-gradient-to-br from-[#0c2f4a] to-[#1a4a6e] flex items-center justify-center mb-4 shadow-lg">
            <Phone className="w-8 h-8 text-[#c9a648]" />
          </div>
          <CardTitle className="text-2xl text-[#0c2f4a]">ADS Dashboard</CardTitle>
          <CardDescription className="text-[#0c2f4a]/70">
            Admiral Dialer System
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#0c2f4a]">Work Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your work email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
                autoFocus
                className="border-[#0c2f4a]/20 focus:border-[#c9a648]"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-[#0c2f4a] hover:bg-[#0c2f4a]/90 text-white"
              disabled={isLoading || !email.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Login"
              )}
            </Button>

            <p className="text-xs text-center text-[#0c2f4a]/60 mt-4">
              Access is managed through Twenty CRM.
              <br />
              Contact your admin if you need access.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

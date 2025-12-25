import { useState } from 'react';
import { useUser, HELM_USERS } from '@/lib/user-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Compass, AlertCircle, Loader2 } from 'lucide-react';
import { getAgent } from '@/lib/compass/agents';

export function LoginScreen() {
  const { loginByEmail } = useUser();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Small delay for UX
    await new Promise(r => setTimeout(r, 500));

    const user = loginByEmail(email.trim().toLowerCase());

    if (!user) {
      setError('Email not found in system. Contact your administrator.');
      setIsLoading(false);
    }
    // If user is found, loginByEmail updates context and triggers re-render
  };

  // Show available users for reference (dev mode only)
  const showDevHints = import.meta.env.DEV;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-chart-1 flex items-center justify-center mb-4">
            <Compass className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">COMPASS</CardTitle>
          <CardDescription>
            AI Sales Assistant - Sign in with your work email
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Work Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@admiralenergy.ai"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {showDevHints && (
            <div className="mt-6 pt-4 border-t">
              <p className="text-xs text-muted-foreground mb-2">Dev Mode - Available users:</p>
              <div className="space-y-1">
                {HELM_USERS.slice(0, 3).map((user) => {
                  const agent = getAgent(user.fieldops_agent_id);
                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => setEmail(user.email)}
                      className="w-full text-left text-xs p-2 rounded hover:bg-muted transition-colors"
                    >
                      <span className="font-medium">{user.name}</span>
                      <span className="text-muted-foreground"> - {agent?.name} ({user.role})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

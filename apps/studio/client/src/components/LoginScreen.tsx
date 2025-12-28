import { useState } from 'react';
import { useUser } from '@/lib/user-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Compass, AlertCircle, Loader2 } from 'lucide-react';

export function LoginScreen() {
  const { loginByEmail } = useUser();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const user = await loginByEmail(email.trim().toLowerCase());

      if (!user) {
        setError('Email not found. You must be registered in Twenty CRM to access COMPASS.');
      }
    } catch (err) {
      setError('Unable to connect to authentication service. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-chart-1 flex items-center justify-center mb-4">
            <Compass className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">COMPASS</CardTitle>
          <CardDescription>
            AI Sales Assistant - Sign in with your Twenty CRM email
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Work Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Checking Twenty CRM...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <p className="mt-4 text-xs text-center text-muted-foreground">
            Access is managed through Twenty CRM. Contact your administrator if you need access.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

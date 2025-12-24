import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '../context/AuthContext';
import { Zap, Target, Swords } from 'lucide-react';
import logoImage from '@assets/openart-image_wP95_892_1766559352238_raw_1766573865247.png';

const loginSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      name: '',
      email: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    const repId = `rep_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    setTimeout(() => {
      login({
        id: repId,
        name: data.name,
        email: data.email,
      });
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full overflow-hidden mb-4">
            <img src={logoImage} alt="RedHawk" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">RedHawk Sales Academy</h1>
          <p className="text-muted-foreground">Master the Framework. Dominate the Game.</p>
          <p className="text-xs text-muted-foreground">Powered by AdmiralEnergy.ai</p>
        </div>

        <Card>
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl">Welcome, Sales Rep</CardTitle>
            <CardDescription>Enter your details to access training</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="John Smith" 
                          data-testid="input-name"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="john@redhawksolar.com" 
                          data-testid="input-email"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                  data-testid="button-login"
                >
                  {isLoading ? 'Signing in...' : 'Start Training'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="grid grid-cols-3 gap-4 pt-4">
          <div className="text-center p-4 rounded-lg bg-card border">
            <Zap className="w-6 h-6 mx-auto mb-2 text-amber-500" />
            <div className="text-xs text-muted-foreground">Earn XP</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-card border">
            <Target className="w-6 h-6 mx-auto mb-2 text-green-500" />
            <div className="text-xs text-muted-foreground">7 Modules</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-card border">
            <Swords className="w-6 h-6 mx-auto mb-2 text-primary" />
            <div className="text-xs text-muted-foreground">Boss Battles</div>
          </div>
        </div>
      </div>
    </div>
  );
}

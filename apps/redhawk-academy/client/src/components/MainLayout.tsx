import { useLocation, Link } from 'wouter';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '../context/AuthContext';
import { Home, BookOpen, Swords, Award, User, LogOut } from 'lucide-react';
import type { ReactNode } from 'react';
import logoImage from '@assets/openart-image_wP95_892_1766559352238_raw_1766573865247.png';

const menuItems = [
  { title: 'Dashboard', url: '/', icon: Home },
  { title: 'Modules', url: '/modules', icon: BookOpen },
  { title: 'Boss Battle', url: '/battle', icon: Swords },
  { title: 'Certifications', url: '/certification', icon: Award },
  { title: 'Profile', url: '/profile', icon: User },
];

export function MainLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { rep, logout } = useAuth();

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <Sidebar>
          <SidebarHeader className="p-4 border-b border-sidebar-border">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-full overflow-hidden">
                <img src={logoImage} alt="RedHawk" className="w-full h-full object-cover" />
              </div>
              <span className="font-bold text-lg">RedHawk</span>
            </Link>
          </SidebarHeader>
          
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => {
                    const isActive = location === item.url || 
                      (item.url !== '/' && location.startsWith(item.url));
                    
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild isActive={isActive}>
                          <Link 
                            href={item.url}
                            data-testid={`nav-${item.title.toLowerCase().replace(' ', '-')}`}
                          >
                            <item.icon className="w-4 h-4" />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="p-4 border-t border-sidebar-border">
            {rep && (
              <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                  <User className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{rep.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{rep.email}</div>
                </div>
              </div>
            )}
          </SidebarFooter>
        </Sidebar>

        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between gap-4 p-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

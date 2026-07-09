import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, Users, UserCircle, LogOut, MessageSquare } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { user, isLoading, logout } = useAuth();

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/users", label: "User Directory", icon: Users },
    { href: "/messages", label: "Messages", icon: MessageSquare },
    { href: "/profile", label: "My Profile", icon: UserCircle },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Skeleton className="w-64 h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row font-sans">
      {/* Sidebar */}
      <aside className="w-full md:w-64 border-r border-border bg-card flex flex-col shrink-0 sticky top-0 md:h-screen z-10">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <div className="flex items-center gap-2 text-primary">
            <Users className="w-6 h-6" />
            <span className="font-bold text-lg tracking-tight text-foreground">User Admin</span>
          </div>
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        {user && (
          <div className="p-4 border-t border-border bg-card/50">
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="w-9 h-9 border border-border">
                <AvatarImage src={user.avatarUrl || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="overflow-hidden">
                <div className="text-sm font-semibold truncate">{user.name}</div>
                <div className="text-xs text-muted-foreground truncate">{user.email}</div>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full justify-start text-muted-foreground hover:text-foreground"
              size="sm"
              onClick={logout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </Button>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto min-h-[calc(100vh-4rem)] md:min-h-screen">
        <div className="p-6 md:p-10 max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}

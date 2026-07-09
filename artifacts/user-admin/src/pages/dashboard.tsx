import { format } from "date-fns";
import { ShieldCheck, UserCircle2, CalendarDays, Activity } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useListUsers } from "@workspace/api-client-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { user } = useAuth();
  
  const { data: usersData, isLoading: isLoadingUsers } = useListUsers({
    limit: 1,
    page: 1,
  });

  if (!user) return null;

  const joinDate = format(new Date(user.createdAt), "MMMM d, yyyy");

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user.name.split(" ")[0]}</h1>
        <p className="text-muted-foreground mt-1 text-lg">Here's an overview of your account and system status.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1 md:col-span-2 border-border/60 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold">Your Profile</CardTitle>
            <CardDescription>Personal details and role information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
              <Avatar className="w-24 h-24 border-2 border-background shadow-sm ring-1 ring-border">
                <AvatarImage src={user.avatarUrl || undefined} />
                <AvatarFallback className="text-3xl bg-secondary text-secondary-foreground">
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2 flex-1">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">{user.name}</h2>
                  <div className="text-muted-foreground font-mono text-sm mt-0.5">{user.email}</div>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge variant={user.role === "admin" ? "default" : "secondary"} className="px-2.5 py-0.5 rounded-full font-medium">
                    {user.role === "admin" ? <ShieldCheck className="w-3.5 h-3.5 mr-1" /> : <UserCircle2 className="w-3.5 h-3.5 mr-1" />}
                    {user.role === "admin" ? "Administrator" : "Standard User"}
                  </Badge>
                  <Badge variant="outline" className="px-2.5 py-0.5 rounded-full text-muted-foreground border-border">
                    <CalendarDays className="w-3.5 h-3.5 mr-1" />
                    Joined {joinDate}
                  </Badge>
                </div>
                
                {user.bio && (
                  <p className="text-sm mt-4 p-3 bg-secondary/30 rounded-lg text-foreground border border-border/50">
                    {user.bio}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6 flex flex-col">
          <Card className="border-border/60 shadow-sm flex-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center">
                <Activity className="w-4 h-4 mr-2 text-primary" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              {isLoadingUsers ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ) : (
                <div>
                  <div className="text-5xl font-bold tracking-tighter text-foreground">
                    {usersData?.total || 0}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 font-medium">
                    Total registered users
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="border-border/60 shadow-sm flex-1 bg-primary text-primary-foreground border-none">
            <CardContent className="p-6 h-full flex flex-col justify-center">
              <h3 className="font-bold text-lg mb-2">Need help?</h3>
              <p className="text-primary-foreground/80 text-sm leading-relaxed mb-4">
                Check the documentation or contact support for assistance with your account.
              </p>
              <div className="text-sm font-semibold hover:underline cursor-pointer mt-auto">
                View guides →
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

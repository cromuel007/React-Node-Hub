import { useParams, Link } from "wouter";
import { format } from "date-fns";
import { ArrowLeft, Shield, User as UserIcon, Calendar, Mail, FileText } from "lucide-react";
import { useGetUser, getGetUserQueryKey } from "@workspace/api-client-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function UserDetail() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);

  const { data: user, isLoading, isError } = useGetUser(id, {
    query: {
      enabled: id > 0,
      queryKey: getGetUserQueryKey(id),
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-32" />
        <Card className="border-none shadow-none bg-transparent">
          <div className="h-48 bg-secondary/50 rounded-t-xl animate-pulse" />
          <div className="px-8 -mt-16 flex items-end gap-6 relative z-10 pb-6">
            <Skeleton className="h-32 w-32 rounded-xl ring-4 ring-background" />
            <div className="space-y-3 pb-2 flex-1">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="text-center py-20 space-y-4">
        <h2 className="text-2xl font-bold">User not found</h2>
        <p className="text-muted-foreground">The user you're looking for doesn't exist or you don't have access.</p>
        <Link href="/users">
          <Button variant="outline">Back to Directory</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Link href="/users">
        <Button variant="ghost" size="sm" className="mb-2 -ml-3 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Directory
        </Button>
      </Link>

      <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-sm">
        {/* Banner */}
        <div className="h-32 md:h-48 bg-gradient-to-r from-primary/10 via-primary/5 to-secondary w-full relative">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
        </div>
        
        <div className="px-6 md:px-10 pb-8 relative">
          {/* Profile Header */}
          <div className="flex flex-col sm:flex-row sm:items-end gap-5 sm:gap-6 -mt-12 sm:-mt-16 mb-8 relative z-10">
            <Avatar className="h-24 w-24 sm:h-32 sm:w-32 rounded-2xl ring-4 ring-card shadow-sm border border-border/50 bg-card">
              <AvatarImage src={user.avatarUrl || undefined} className="object-cover" />
              <AvatarFallback className="text-3xl sm:text-4xl font-bold bg-secondary text-secondary-foreground rounded-2xl">
                {user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 pb-1 sm:pb-2">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{user.name}</h1>
                <Badge 
                  variant={user.role === 'admin' ? 'default' : 'secondary'} 
                  className="capitalize"
                >
                  {user.role}
                </Badge>
              </div>
              <p className="text-muted-foreground font-mono text-sm mt-1">{user.email}</p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="col-span-1 md:col-span-2 space-y-6">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2 border-b border-border/50 pb-2 mb-4">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                  About
                </h3>
                {user.bio ? (
                  <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap">
                    {user.bio}
                  </p>
                ) : (
                  <p className="text-muted-foreground italic">No bio provided.</p>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold border-b border-border/50 pb-2 mb-4">
                  Information
                </h3>
                <dl className="space-y-4 text-sm">
                  <div>
                    <dt className="text-muted-foreground flex items-center gap-2 mb-1">
                      <Mail className="w-4 h-4" /> Email Address
                    </dt>
                    <dd className="font-medium font-mono">{user.email}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground flex items-center gap-2 mb-1">
                      <Shield className="w-4 h-4" /> System Role
                    </dt>
                    <dd className="font-medium capitalize">{user.role}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground flex items-center gap-2 mb-1">
                      <Calendar className="w-4 h-4" /> Joined
                    </dt>
                    <dd className="font-medium">
                      {format(new Date(user.createdAt), "MMMM d, yyyy")}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

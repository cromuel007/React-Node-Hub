import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Users, Loader2 } from "lucide-react";
import { useRegister } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function Register() {
  const { login: setAuthData } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const registerMutation = useRegister();

  function onSubmit(values: z.infer<typeof registerSchema>) {
    registerMutation.mutate(
      { data: values },
      {
        onSuccess: (data) => {
          setAuthData(data.token);
          toast({
            title: "Account created",
            description: "Welcome to User Admin.",
          });
        },
        onError: (error: any) => {
          toast({
            title: "Registration failed",
            description: error?.error || "Could not create account.",
            variant: "destructive",
          });
        },
      }
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row-reverse">
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 lg:p-24 relative z-10">
        <div className="w-full max-w-[400px] space-y-6">
          <div className="flex items-center gap-2 mb-8 md:hidden">
            <Users className="w-6 h-6 text-primary" />
            <span className="font-bold text-xl">User Admin</span>
          </div>

          <Card className="border-border/50 shadow-xl shadow-black/5 bg-card/50 backdrop-blur-xl">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl font-bold tracking-tight">Create an account</CardTitle>
              <CardDescription>
                Enter your details below to set up your profile.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Jane Doe"
                            className="bg-background/50"
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
                        <FormLabel>Email address</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="name@company.com"
                            type="email"
                            className="bg-background/50"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="••••••••"
                            type="password"
                            className="bg-background/50"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full mt-2"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Register
                  </Button>
                </form>
              </Form>
              
              <div className="mt-6 text-center text-sm">
                <span className="text-muted-foreground">Already have an account? </span>
                <Link href="/login" className="text-primary hover:underline font-medium">
                  Sign in
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Decorative Side Panel */}
      <div className="hidden md:flex flex-1 bg-secondary items-center justify-center p-12 relative overflow-hidden border-r border-border">
        {/* Subtle noise/texture */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
        
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-primary/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 max-w-md space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center border border-border">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <span className="font-bold text-2xl tracking-tight">User Admin</span>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-3xl font-bold leading-tight tracking-tighter">
              Join the directory.
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Create your profile to access the member directory and connect with other users in the organization.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="p-4 rounded-xl bg-card border border-border shadow-sm">
              <div className="font-semibold text-lg">Secure</div>
              <div className="text-sm text-muted-foreground mt-1">Enterprise-grade protection</div>
            </div>
            <div className="p-4 rounded-xl bg-card border border-border shadow-sm">
              <div className="font-semibold text-lg">Fast</div>
              <div className="text-sm text-muted-foreground mt-1">Optimized for productivity</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

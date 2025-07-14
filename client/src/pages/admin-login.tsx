import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Shield } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      console.log("Frontend - Sending login data:", data);
      // Add a 10s timeout to the login request
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      try {
        const response = await fetch("/api/admin/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
          credentials: "include",
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (!response.ok) {
          let msg = "Login failed";
          try {
            const err = await response.json();
            msg = err.message || msg;
          } catch {}
          throw new Error(msg);
        }
        const result = await response.json();
        console.log("Frontend - Received response:", result);
        return result;
      } catch (err: any) {
        clearTimeout(timeout);
        if (err.name === "AbortError") {
          throw new Error("Login request timed out. Please try again.");
        }
        throw err;
      }
    },
    onSuccess: (data) => {
      console.log("Frontend - Login success:", data);
      if (data.success) {
        sessionStorage.setItem("adminToken", data.token);
        setLocation("/admin/dashboard");
        toast({
          title: "Welcome",
          description: "Successfully logged in as admin",
        });
      } else {
        toast({
          title: "Login Failed",
          description: data.message || "Invalid username or password",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      console.error("Frontend - Login error:", error);
      toast({
        title: "Error",
        description: error.message || "Login failed",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginFormData) => {
    console.log("Frontend - Form submitted with:", data);
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Admin Login</CardTitle>
          <p className="text-gray-600">Sign in to access the admin dashboard</p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter username" {...field} />
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
                      <Input type="password" placeholder="Enter password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </Form>
          
          <div className="mt-6 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Admin Access:</strong><br />
              Contact system administrator for credentials
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
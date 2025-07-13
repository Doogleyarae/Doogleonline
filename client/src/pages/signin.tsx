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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/language-context";

const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean().optional(),
});

type SignInFormData = z.infer<typeof signInSchema>;

export default function SignIn() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const { t } = useLanguage();

  const form = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const signInMutation = useMutation({
    mutationFn: async (data: SignInFormData) => {
      const response = await apiRequest("POST", "/api/auth/signin", data);
      const result = await response.json();
      return result;
    },
    onSuccess: (data) => {
      if (data.success) {
        // Store token and user data
        if (form.getValues("rememberMe")) {
          localStorage.setItem("userToken", data.token);
          localStorage.setItem("userData", JSON.stringify(data.user));
        } else {
          sessionStorage.setItem("userToken", data.token);
          sessionStorage.setItem("userData", JSON.stringify(data.user));
        }
        
        setLocation("/");
        toast({
          title: "Welcome back!",
          description: "Successfully signed in to your account",
        });
      } else {
        toast({
          title: "Sign in failed",
          description: data.message || "Invalid email or password",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Sign in failed. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SignInFormData) => {
    signInMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl flex flex-col lg:flex-row gap-8 items-center justify-center">
        {/* Sidebar: Doogle Online Features */}
        <aside className="hidden lg:flex flex-col justify-center w-1/2 h-full bg-white/70 rounded-xl shadow-md p-8 mr-2">
          <h2 className="text-2xl font-bold text-primary mb-4">Doogle Online Features</h2>
          <ul className="space-y-4 text-gray-700">
            <li className="flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 10c-4.41 0-8-1.79-8-4V6c0-2.21 3.59-4 8-4s8 1.79 8 4v8c0 2.21-3.59 4-8 4z"/></svg>
              <a href="/exchange" className="hover:underline">Exchange</a>
            </li>
            <li className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 19c-4.41 0-8-1.79-8-4V7c0-2.21 3.59-4 8-4s8 1.79 8 4v8c0 2.21-3.59 4-8 4z"/></svg>
              <a href="/track-order" className="hover:underline">Track Order</a>
            </li>
            <li className="flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 8h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2"/><circle cx="12" cy="7" r="4"/></svg>
              <a href="/contact" className="hover:underline">24/7 Contact</a>
            </li>
            <li className="flex items-center gap-2">
              <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M12 4v16m0 0H3"/></svg>
              <a href="/how-it-works" className="hover:underline">How It Works</a>
            </li>
            <li className="flex items-center gap-2">
              <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
              <a href="/about" className="hover:underline">About</a>
            </li>
            <li className="flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
              Secure Transactions
            </li>
            <li className="flex items-center gap-2">
              <svg className="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 12h18"/><path d="M12 3v18"/></svg>
              Real-time Rates
            </li>
          </ul>
        </aside>
        {/* Form Card */}
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center space-y-4">
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">{t("welcomeBack")}</CardTitle>
              <p className="text-gray-600 mt-2">{t("signInToAccount")}</p>
            </div>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">{t("email")}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input 
                            placeholder={t("email")}
                            className="pl-10"
                            {...field} 
                          />
                        </div>
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
                      <FormLabel className="text-gray-700">{t("password")}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input 
                            type={showPassword ? "text" : "password"}
                            placeholder={t("password")}
                            className="pl-10 pr-10"
                            {...field} 
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex items-center justify-between">
                  <FormField
                    control={form.control}
                    name="rememberMe"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="text-sm text-gray-600 cursor-pointer">
                          {t("rememberMe")}
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                  <Link href="/forgot-password">
                    <span className="text-sm text-primary hover:text-primary/80 cursor-pointer">
                      {t("forgotPassword")}
                    </span>
                  </Link>
                </div>
                
                <Button
                  type="submit"
                  className="w-full"
                  disabled={signInMutation.isPending}
                >
                  {signInMutation.isPending ? t("loading") : t("signIn")}
                </Button>
              </form>
            </Form>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                {t("alreadyHaveAccount")}{" "}
                <Link href="/signup">
                  <span className="text-primary hover:text-primary/80 cursor-pointer font-medium">
                    {t("signUp")}
                  </span>
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
        {/* Mobile sidebar below form */}
        <aside className="block lg:hidden w-full mt-8 bg-white/70 rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-primary mb-2">Doogle Online Features</h2>
          <ul className="mb-4 space-y-2 text-gray-700 text-sm">
            <li><a href="/exchange" className="hover:underline">Exchange</a></li>
            <li><a href="/track-order" className="hover:underline">Track Order</a></li>
            <li><a href="/contact" className="hover:underline">24/7 Contact</a></li>
            <li><a href="/how-it-works" className="hover:underline">How It Works</a></li>
            <li><a href="/about" className="hover:underline">About</a></li>
            <li>Secure Transactions</li>
            <li>Real-time Rates</li>
          </ul>
        </aside>
      </div>
    </div>
  );
} 
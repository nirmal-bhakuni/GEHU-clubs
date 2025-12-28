import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Users, Lock } from "lucide-react";
import CaptchaComponent from "@/components/CaptchaComponent";

export default function ClubAdminLogin() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/auth/login", data);
      return res.json();
    },
    onSuccess: (data) => {
      if (data.admin.clubId) {
        // Club admin logged in successfully
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        setLocation("/club-admin");
        toast({
          title: "Login successful",
          description: "Welcome to your club admin panel.",
        });
      } else {
        // University admin, redirect to dashboard
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        setLocation("/dashboard");
        toast({
          title: "Login successful",
          description: "Welcome to the admin dashboard.",
        });
      }
    },
    onError: () => {
      toast({
        title: "Login failed",
        description: "Invalid username or password.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!captchaVerified) {
      toast({
        title: "Captcha required",
        description: "Please verify you're human first",
        variant: "destructive",
      });
      return;
    }

    loginMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Club Administration Login
          </h1>
          <p className="text-muted-foreground">
            Sign in to manage your club's events and content
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="Enter your username"
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              required
              disabled={loginMutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
              disabled={loginMutation.isPending}
            />
          </div>

          {/* Interactive Captcha */}
          <CaptchaComponent onVerify={setCaptchaVerified} />

          <Button
            type="submit"
            className="w-full"
            disabled={loginMutation.isPending || !captchaVerified}
          >
            {loginMutation.isPending ? (
              "Signing in..."
            ) : (
              <>
                <Lock className="w-4 h-4 mr-2" />
                Sign In
              </>
            )}
          </Button>
        </form>

        <div className="mt-6">
          <div className="text-center mb-4">
            <p className="text-sm text-muted-foreground">
              Available Club Admin Credentials:
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-1 gap-3 text-sm">
              <div className="flex justify-between items-center p-2 bg-background rounded border">
                <div>
                  <span className="font-medium">IEEE (Technology)</span>
                </div>
                <div className="text-right">
                  <div className="font-mono text-xs">ieee_admin</div>
                  <div className="font-mono text-xs text-muted-foreground">admin123</div>
                </div>
              </div>
              <div className="flex justify-between items-center p-2 bg-background rounded border">
                <div>
                  <span className="font-medium">ARYAVRAT (Academic)</span>
                </div>
                <div className="text-right">
                  <div className="font-mono text-xs">aryavrat_admin</div>
                  <div className="font-mono text-xs text-muted-foreground">admin123</div>
                </div>
              </div>
              <div className="flex justify-between items-center p-2 bg-background rounded border">
                <div>
                  <span className="font-medium">PAPERTECH-GEHU (Arts)</span>
                </div>
                <div className="text-right">
                  <div className="font-mono text-xs">papertech_admin</div>
                  <div className="font-mono text-xs text-muted-foreground">admin123</div>
                </div>
              </div>
              <div className="flex justify-between items-center p-2 bg-background rounded border">
                <div>
                  <span className="font-medium">Entrepreneurship Hub (Business)</span>
                </div>
                <div className="text-right">
                  <div className="font-mono text-xs">entrepreneurship_admin</div>
                  <div className="font-mono text-xs text-muted-foreground">admin123</div>
                </div>
              </div>
              <div className="flex justify-between items-center p-2 bg-background rounded border">
                <div>
                  <span className="font-medium">CODE_HUNTERS (Academic)</span>
                </div>
                <div className="text-right">
                  <div className="font-mono text-xs">codehunters_admin</div>
                  <div className="font-mono text-xs text-muted-foreground">admin123</div>
                </div>
              </div>
              <div className="flex justify-between items-center p-2 bg-background rounded border">
                <div>
                  <span className="font-medium">RANGMANCH (Social)</span>
                </div>
                <div className="text-right">
                  <div className="font-mono text-xs">rangmanch_admin</div>
                  <div className="font-mono text-xs text-muted-foreground">admin123</div>
                </div>
              </div>
            </div>
          </div>
          <div className="text-center mt-4">
            <p className="text-xs text-muted-foreground">
              University administrators,{" "}
              <a
                href="/admin/login"
                className="text-primary hover:underline"
                onClick={(e) => {
                  e.preventDefault();
                  setLocation("/admin/login");
                }}
              >
                click here
              </a>
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
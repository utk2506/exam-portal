import { useEffect, FormEvent, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { apiClient } from "../../../api/client";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Logo } from "../../../components/ui/Logo";
import { ChimeraLogo } from "../../../components/ui/ChimeraLogo";

export function AdminLoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("ChangeMe123!");

  // URL guard: if already authenticated, skip login and go straight to dashboard
  const meQuery = useQuery({
    queryKey: ["admin-me-login-check"],
    queryFn: () => apiClient.get<{ admin: unknown }>("/auth/me"),
    retry: false
  });

  useEffect(() => {
    if (meQuery.isSuccess) {
      navigate("/admin", { replace: true });
    }
  }, [meQuery.isSuccess, navigate]);

  const loginMutation = useMutation({
    mutationFn: () =>
      apiClient.post<{ admin: unknown }>("/auth/login", {
        username,
        password
      }),
    onSuccess: () => {
      navigate("/admin");
    }
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    loginMutation.mutate();
  };

  // Show nothing while checking auth (avoids login form flash for authenticated admins)
  if (meQuery.isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-slate-500">Checking session...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex" style={{ backgroundColor: "#fefefe" }}>
      {/* Left Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center px-6 py-12 md:px-12" style={{ backgroundColor: "#fefefe" }}>
        <div className="w-full max-w-sm space-y-8">
          {/* Logo & Branding */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Logo variant="icon" size="lg" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#FF4a03" }}>Admin Portal</p>
                <p className="text-xs" style={{ color: "#FF4a03" }}>Exam Management System</p>
              </div>
            </div>
          </div>

          {/* Form Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-slate-900">Login</h1>
            <p className="text-sm text-slate-600">Enter your account details</p>
          </div>

          {/* Login Form */}
          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Username Field */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Username</label>
              <Input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="!bg-slate-50 !border-slate-300 !text-slate-900 placeholder-slate-500"
                style={{ "--tw-ring-color": "#FF4a03", "--tw-ring-opacity": "0.3", borderColor: "#FF4a03", outlineColor: "#FF4a03" } as any}
                placeholder="Enter username"
                required
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="!bg-slate-50 !border-slate-300 !text-slate-900 placeholder-slate-500"
                style={{ "--tw-ring-color": "#FF4a03", "--tw-ring-opacity": "0.3", borderColor: "#FF4a03", outlineColor: "#FF4a03" } as any}
                placeholder="Enter password"
                required
              />
            </div>

            {/* Error Message */}
            {loginMutation.error ? (
              <div className="rounded-lg bg-rose-50 border border-rose-200 px-4 py-3">
                <p className="text-sm text-rose-700 font-medium">
                  {(loginMutation.error as Error).message}
                </p>
              </div>
            ) : null}

            {/* Submit Button */}
            <Button
              type="submit"
              block
              disabled={loginMutation.isPending}
              className="mt-6 text-white font-semibold rounded-lg py-2.5 shadow-lg hover:shadow-xl transition-all"
              style={{ backgroundColor: "#FF4a03" }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#e63f00"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#FF4a03"}
            >
              {loginMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span> Signing in...
                </span>
              ) : (
                "Login"
              )}
            </Button>
          </form>

          {/* Footer Link */}
          <div className="text-center">
            <p className="text-xs text-slate-600">
              Chimera Fresher's Drive 2026 • Admin Access
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Welcome Section */}
      <div className="hidden lg:flex w-1/2 items-center justify-center relative overflow-hidden" style={{ backgroundColor: "#fefefe" }}>
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-100/30 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-50/30 rounded-full blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative z-10 text-center space-y-6 px-8 max-w-md">
          {/* Chimera Logo */}
          <div className="flex items-center justify-center">
            <ChimeraLogo size="lg" />
          </div>

          {/* Welcome Text */}
          <div className="space-y-3">
            <h2 className="text-4xl font-bold text-slate-900 leading-tight whitespace-nowrap">
              Welcome to Admin Control
            </h2>
            <p className="text-lg text-slate-600">
              Manage exams, monitor candidates, and access comprehensive analytics in one place.
            </p>
          </div>

          {/* Feature Pills */}
          <div className="flex flex-wrap justify-center gap-2 pt-4">
            <div className="px-3 py-1 rounded-full bg-orange-50" style={{ borderColor: "#FF4a03", border: "1px solid" }}>
              <p className="text-xs font-medium" style={{ color: "#FF4a03" }}>Real-time Monitoring</p>
            </div>
            <div className="px-3 py-1 rounded-full bg-orange-50" style={{ borderColor: "#FF4a03", border: "1px solid" }}>
              <p className="text-xs font-medium" style={{ color: "#FF4a03" }}>Auto Grading</p>
            </div>
            <div className="px-3 py-1 rounded-full bg-orange-50" style={{ borderColor: "#FF4a03", border: "1px solid" }}>
              <p className="text-xs font-medium" style={{ color: "#FF4a03" }}>Analytics</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

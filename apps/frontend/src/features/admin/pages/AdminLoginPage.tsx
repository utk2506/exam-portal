import { FormEvent, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { apiClient } from "../../../api/client";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";

export function AdminLoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("ChangeMe123!");

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

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">Admin Panel</p>
          <h1 className="font-display text-4xl text-ink">Exam Control Center</h1>
          <p className="text-sm text-muted">Sign in to manage exams, monitor candidates, and grade subjective answers.</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-ink">Username</span>
            <Input value={username} onChange={(event) => setUsername(event.target.value)} />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-ink">Password</span>
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          {loginMutation.error ? (
            <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {(loginMutation.error as Error).message}
            </p>
          ) : null}

          <Button type="submit" block disabled={loginMutation.isPending}>
            {loginMutation.isPending ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </Card>
    </main>
  );
}

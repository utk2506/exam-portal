import { FormEvent, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { apiClient } from "../../../api/client";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { Input } from "../../../components/ui/Input";

export function CandidateRegistrationPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [examCode, setExamCode] = useState("");

  const registerMutation = useMutation({
    mutationFn: () =>
      apiClient.post<{
        session: { id: string; candidateId: string };
      }>("/candidate-sessions/register", {
        name,
        email,
        phone,
        examCode
      }),
    onSuccess: (data) => {
      navigate(`/exam/${data.session.id}/instructions`);
    }
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    registerMutation.mutate();
  };

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <Card className="overflow-hidden p-0">
          <div className="grid lg:grid-cols-[1.15fr,0.85fr]">
            <div className="space-y-6 bg-gradient-to-br from-teal-900 via-teal-800 to-orange-700 px-8 py-10 text-white">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-100">Office LAN Test Hub</p>
                <h1 className="font-display text-5xl leading-tight">JEE-style exam delivery with live invigilation signals.</h1>
                <p className="max-w-2xl text-sm text-teal-50/90">
                  Complete your candidate registration, read the instructions, and launch the timed assessment in fullscreen mode.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur">
                  <p className="text-sm font-semibold">Browser-only anti-cheat</p>
                  <p className="mt-2 text-sm text-teal-50/85">Tab switches, fullscreen exits, shortcut attempts, and reconnect gaps are logged live.</p>
                </div>
                <div className="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur">
                  <p className="text-sm font-semibold">Auto-save + auto-submit</p>
                  <p className="mt-2 text-sm text-teal-50/85">Answers are saved during the exam and the attempt closes automatically when the timer ends.</p>
                </div>
              </div>
            </div>

            <div className="bg-white px-8 py-10">
              <div className="mb-6 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Candidate Registration</p>
                <h2 className="font-display text-4xl text-ink">Enter exam details</h2>
                <p className="text-sm text-muted">Use the exam code given by the administrator. Existing active attempts will resume automatically.</p>
              </div>

              <form className="space-y-4" onSubmit={handleSubmit}>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-ink">Full Name</span>
                  <Input value={name} onChange={(event) => setName(event.target.value)} required />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-ink">Email</span>
                  <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-ink">Phone</span>
                  <Input value={phone} onChange={(event) => setPhone(event.target.value)} required />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-ink">Exam Code</span>
                  <Input value={examCode} onChange={(event) => setExamCode(event.target.value)} required />
                </label>

                {registerMutation.error ? (
                  <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {(registerMutation.error as Error).message}
                  </p>
                ) : null}

                <Button type="submit" block disabled={registerMutation.isPending}>
                  {registerMutation.isPending ? "Registering..." : "Continue to Instructions"}
                </Button>
              </form>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}

import { FormEvent, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { apiClient } from "../../../api/client";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Logo } from "../../../components/ui/Logo";
import { ChimeraLogo } from "../../../components/ui/ChimeraLogo";

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
    <main className="min-h-screen flex" style={{ backgroundColor: "#fefefe" }}>
      {/* Left Panel - Welcome Section */}
      <div className="hidden lg:flex w-1/2 items-center justify-center relative overflow-hidden" style={{ height: "100vh", backgroundColor: "#fefefe" }}>
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
          <div className="space-y-3 w-full text-center">
            <h2 className="text-4xl font-bold text-slate-900 leading-tight">
              Welcome to Fresher's Drive 2026
            </h2>
            <p className="text-lg text-slate-600">
              Register now, read instructions, and start your timed assessment in a secure environment.
            </p>
          </div>

          {/* Feature Pills */}
          <div className="flex flex-wrap justify-center gap-2 pt-4">
            <div className="px-3 py-1 rounded-full bg-orange-50" style={{ borderColor: "#FF4a03", border: "1px solid" }}>
              <p className="text-xs font-medium" style={{ color: "#FF4a03" }}>Secure Exam</p>
            </div>
            <div className="px-3 py-1 rounded-full bg-orange-50" style={{ borderColor: "#FF4a03", border: "1px solid" }}>
              <p className="text-xs font-medium" style={{ color: "#FF4a03" }}>Instant Results</p>
            </div>
            <div className="px-3 py-1 rounded-full bg-orange-50" style={{ borderColor: "#FF4a03", border: "1px solid" }}>
              <p className="text-xs font-medium" style={{ color: "#FF4a03" }}>Live Monitoring</p>
            </div>
          </div>

          {/* Social Links placeholder */}
          <div className="pt-8 flex justify-center gap-6 text-slate-400">
            <a href="#" className="hover:text-[#FF4a03] transition-colors" title="LinkedIn">
              <span className="sr-only">LinkedIn</span>
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
              </svg>
            </a>
            <a href="#" className="hover:text-[#FF4a03] transition-colors" title="Instagram">
              <span className="sr-only">Instagram</span>
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
              </svg>
            </a>
          </div>

        </div>
      </div>

      {/* Right Panel - Registration Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center px-6 py-12 md:px-12" style={{ backgroundColor: "#fefefe" }}>
        <div className="w-full max-w-sm space-y-8">
          {/* Logo & Branding */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Logo variant="icon" size="lg" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#FF4a03" }}>Fresher Drive 2026</p>
                <p className="text-xs" style={{ color: "#FF4a03" }}>Register for Assessment</p>
              </div>
            </div>
          </div>

          {/* Form Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-slate-900">Fresher Drive 2026</h1>
            <p className="text-sm text-slate-600">Enter your details to get started</p>
          </div>

          {/* Registration Form */}
          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Full Name */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Full Name</label>
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="!bg-slate-50 !border-slate-300 !text-slate-900 placeholder-slate-500"
                style={{ "--tw-ring-color": "#FF4a03", "--tw-ring-opacity": "0.3", borderColor: "#FF4a03", outlineColor: "#FF4a03" } as any}
                placeholder="John Doe"
                required
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Email Address</label>
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="!bg-slate-50 !border-slate-300 !text-slate-900 placeholder-slate-500"
                style={{ "--tw-ring-color": "#FF4a03", "--tw-ring-opacity": "0.3", borderColor: "#FF4a03", outlineColor: "#FF4a03" } as any}
                placeholder="john@example.com"
                required
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Phone Number</label>
              <Input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="!bg-slate-50 !border-slate-300 !text-slate-900 placeholder-slate-500"
                style={{ "--tw-ring-color": "#FF4a03", "--tw-ring-opacity": "0.3", borderColor: "#FF4a03", outlineColor: "#FF4a03" } as any}
                placeholder="+91 98765 43210"
                required
              />
            </div>

            {/* Exam Code */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Exam Code</label>
              <Input
                value={examCode}
                onChange={(event) => setExamCode(event.target.value)}
                className="!bg-slate-50 !border-slate-300 !text-slate-900 placeholder-slate-500 uppercase"
                style={{ "--tw-ring-color": "#FF4a03", "--tw-ring-opacity": "0.3", borderColor: "#FF4a03", outlineColor: "#FF4a03" } as any}
                placeholder="EXAM2026-001"
                required
              />
            </div>

            {/* Error Message */}
            {registerMutation.error ? (
              <div className="rounded-lg bg-rose-50 border border-rose-200 px-4 py-3">
                <p className="text-sm text-rose-700 font-medium">
                  {(registerMutation.error as Error).message}
                </p>
              </div>
            ) : null}

            {/* Submit Button */}
            <Button
              type="submit"
              block
              disabled={registerMutation.isPending}
              className="mt-6 text-white font-semibold rounded-lg py-2.5 shadow-lg hover:shadow-xl transition-all"
              style={{ backgroundColor: "#FF4a03" }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#e63f00"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#FF4a03"}
            >
              {registerMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span> Registering...
                </span>
              ) : (
                "Continue to Instructions"
              )}
            </Button>
          </form>

        </div>
      </div>
    </main>
  );
}

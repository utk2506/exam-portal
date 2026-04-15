import { Suspense, lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

const CandidateRegistrationPage = lazy(() =>
  import("../features/candidate/pages/CandidateRegistrationPage").then((module) => ({
    default: module.CandidateRegistrationPage
  }))
);
const ExamInstructionsPage = lazy(() =>
  import("../features/candidate/pages/ExamInstructionsPage").then((module) => ({
    default: module.ExamInstructionsPage
  }))
);
const ExamRuntimePage = lazy(() =>
  import("../features/exam/pages/ExamRuntimePage").then((module) => ({
    default: module.ExamRuntimePage
  }))
);
const AdminLoginPage = lazy(() =>
  import("../features/admin/pages/AdminLoginPage").then((module) => ({
    default: module.AdminLoginPage
  }))
);
const AdminDashboardPage = lazy(() =>
  import("../features/admin/pages/AdminDashboardPage").then((module) => ({
    default: module.AdminDashboardPage
  }))
);
const ResultPage = lazy(() =>
  import("../features/candidate/pages/ResultPage").then((module) => ({
    default: module.ResultPage
  }))
);
const AccessDeniedPage = lazy(() =>
  import("../features/candidate/pages/AccessDeniedPage").then((module) => ({
    default: module.AccessDeniedPage
  }))
);

export function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-sm text-muted">Loading...</div>}>
        <Routes>
          <Route path="/" element={<Navigate to="/exam" replace />} />
          <Route path="/exam" element={<CandidateRegistrationPage />} />
          <Route path="/exam/:sessionId/instructions" element={<ExamInstructionsPage />} />
          <Route path="/exam/:sessionId/runtime" element={<ExamRuntimePage />} />
          <Route path="/exam/:sessionId/result" element={<ResultPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/access-denied" element={<AccessDeniedPage />} />
          {/* Catch-all: any unknown URL → access denied page */}
          <Route path="*" element={<AccessDeniedPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

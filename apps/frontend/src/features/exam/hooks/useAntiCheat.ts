import { useEffect, useRef, useState } from "react";

type ViolationReporter = (payload: {
  type: string;
  severity: "info" | "warning" | "critical";
  metadata?: Record<string, unknown>;
}) => Promise<void> | void;

const THROTTLE_MS = 2500;

export function useAntiCheat({
  enabled,
  reportViolation
}: {
  enabled: boolean;
  reportViolation: ViolationReporter;
}) {
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const lastEventAt = useRef<Record<string, number>>({});
  const reportViolationRef = useRef<ViolationReporter>(reportViolation);

  useEffect(() => {
    reportViolationRef.current = reportViolation;
  }, [reportViolation]);

  useEffect(() => {
    if (!warningMessage) {
      return;
    }

    const timeout = window.setTimeout(() => setWarningMessage(null), 3500);
    return () => window.clearTimeout(timeout);
  }, [warningMessage]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const report = (type: string, severity: "info" | "warning" | "critical", message: string, metadata?: Record<string, unknown>) => {
      const now = Date.now();
      if (lastEventAt.current[type] && now - lastEventAt.current[type] < THROTTLE_MS) {
        return;
      }

      lastEventAt.current[type] = now;
      setWarningMessage(message);
      void reportViolationRef.current({ type, severity, metadata });
    };

    const handleVisibility = () => {
      if (document.hidden) {
        report("tab_switch", "warning", "Tab switch detected.", { hidden: true });
      }
    };

    const handleFullscreen = () => {
      if (!document.fullscreenElement) {
        report("fullscreen_exit", "warning", "Fullscreen exit detected.");
      }
    };

    const handleContextMenu = (event: MouseEvent) => {
      event.preventDefault();
      report("right_click", "info", "Right click is disabled.");
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const isBlockedShortcut =
        (event.ctrlKey && ["c", "v", "t", "w"].includes(event.key.toLowerCase())) ||
        event.key === "F12" ||
        (event.ctrlKey && event.key === "Tab");

      if (!isBlockedShortcut) {
        return;
      }

      event.preventDefault();
      report("blocked_shortcut", "warning", "Restricted shortcut blocked.", {
        key: event.key,
        ctrlKey: event.ctrlKey,
        shiftKey: event.shiftKey,
        altKey: event.altKey
      });
    };

    const handleBeforeUnload = () => {
      report("reload_attempt", "info", "Page refresh attempt recorded.");
    };

    document.addEventListener("visibilitychange", handleVisibility);
    document.addEventListener("fullscreenchange", handleFullscreen);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      document.removeEventListener("fullscreenchange", handleFullscreen);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [enabled]);

  return {
    warningMessage
  };
}

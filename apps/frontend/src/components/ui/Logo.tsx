export function Logo({ variant = "full", size = "md" }: { variant?: "full" | "icon"; size?: "sm" | "md" | "lg" }) {
  const sizeMap = {
    sm: { width: 24, height: 24, textSize: "text-sm" },
    md: { width: 32, height: 32, textSize: "text-base" },
    lg: { width: 48, height: 48, textSize: "text-lg" },
  };

  const { width, height, textSize } = sizeMap[size];

  if (variant === "icon") {
    return (
      <svg
        width={width}
        height={height}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        {/* Outer Circle */}
        <circle cx="20" cy="20" r="19" stroke="currentColor" strokeWidth="2" />

        {/* Gradient Background */}
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF4a03" />
            <stop offset="100%" stopColor="#FF6B35" />
          </linearGradient>
        </defs>

        {/* Center Circle */}
        <circle cx="20" cy="20" r="16" fill="url(#logoGradient)" />

        {/* Test/Exam Symbol - Checkmark */}
        <path
          d="M15 20L18 23L26 15"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <div className="flex items-center gap-2.5">
      <svg
        width={width}
        height={height}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        {/* Outer Circle */}
        <circle cx="20" cy="20" r="19" stroke="currentColor" strokeWidth="2" />

        {/* Gradient Background */}
        <defs>
          <linearGradient id="logoGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF4a03" />
            <stop offset="100%" stopColor="#FF6B35" />
          </linearGradient>
        </defs>

        {/* Center Circle */}
        <circle cx="20" cy="20" r="16" fill="url(#logoGradient2)" />

        {/* Test/Exam Symbol - Checkmark */}
        <path
          d="M15 20L18 23L26 15"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      <div className={`${textSize} font-bold`}>
        <div className="leading-tight">
          <span className="bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent font-bold">
            Exam
          </span>
        </div>
        <div className="text-xs font-semibold text-slate-600 -mt-0.5">Portal</div>
      </div>
    </div>
  );
}

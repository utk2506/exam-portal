import ChimeraLogoImg from "../../assets/Chimera-logo.png";

export function ChimeraLogo({ size = "lg" }: { size?: "sm" | "md" | "lg" }) {
  const sizeMap = {
    sm: { height: 60 },
    md: { height: 100 },
    lg: { height: 160 },
  };

  const { height } = sizeMap[size];

  return (
    <img
      src={ChimeraLogoImg}
      alt="Chimera Logo"
      style={{ height: `${height}px`, width: "auto" }}
      className="flex-shrink-0 object-contain"
    />
  );
}

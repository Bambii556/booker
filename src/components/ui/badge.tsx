"use client";

interface BadgeProps {
  variant?: "default" | "outline" | "blue";
  className?: string;
  children: React.ReactNode;
}

export function Badge({ variant = "default", className = "", children }: BadgeProps) {
  const baseStyles =
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors";

  const variants = {
    default:
      "bg-muted text-muted-foreground",
    outline:
      "border border-border text-foreground",
    blue: "bg-primary/10 text-primary",
  };

  return (
    <span className={`${baseStyles} ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
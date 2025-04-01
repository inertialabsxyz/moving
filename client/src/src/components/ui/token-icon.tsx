
import { Coins } from "lucide-react";
import { getTokenColorClass } from "@/lib/types";

interface TokenIconProps {
  token: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function TokenIcon({ token, className, size = "md" }: TokenIconProps) {
  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5"
  };
  
  const tokenColorClass = getTokenColorClass(token);
  const baseClass = `${sizeClasses[size]} ${tokenColorClass.replace('bg-', 'text-')}`;
  
  return <Coins className={`${baseClass} ${className || ''}`} />;
}

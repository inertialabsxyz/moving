
import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { TokenIcon } from "@/components/ui/token-icon";

interface StatsCardProps {
  title: string;
  icon: ReactNode;
  count?: number | string;
  linkText?: string;
  linkTo?: string;
  children?: ReactNode;
  className?: string;
}

export function StatsCard({ 
  title, 
  icon, 
  count, 
  linkText, 
  linkTo, 
  children,
  className
}: StatsCardProps) {
  return (
    <div className={cn("glass-card rounded-xl p-6", className)}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 rounded-full p-2">
            {icon}
          </div>
          <h3 className="text-lg font-medium">{title}</h3>
        </div>
        {count !== undefined && <span className="text-xl font-bold">{count}</span>}
      </div>
      
      {children && (
        <div className="mt-2 space-y-1">
          {children}
        </div>
      )}
      
      {linkText && linkTo && (
        <div className="flex items-center mt-4">
          <Link to={linkTo} className="text-primary text-sm font-medium link-hover inline-flex items-center gap-1">
            {linkText}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );
}

export function TokenDisplay({ 
  token, 
  amount, 
  label 
}: { 
  token: string; 
  amount: number | string; 
  label?: string;
}) {
  return (
    <>
      {label && <div className="text-xs text-muted-foreground mb-1">{label}</div>}
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{amount}</span>
        <div className="flex items-center gap-1.5">
          <TokenIcon token={token} />
          <span>{token}</span>
        </div>
      </div>
    </>
  );
}

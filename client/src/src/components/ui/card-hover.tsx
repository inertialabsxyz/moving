
import { cn } from "@/lib/utils";
import React, { useState, useRef, useEffect } from "react";

interface CardHoverProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
  border?: boolean;
  shadow?: boolean;
}

export function CardHover({
  children,
  className,
  intensity = 20,
  border = true,
  shadow = true,
  ...props
}: CardHoverProps) {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const newRotateX = ((y - centerY) / centerY) * -intensity * 0.2;
    const newRotateY = ((x - centerX) / centerX) * intensity * 0.2;
    
    setRotateX(newRotateX);
    setRotateY(newRotateY);
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    setRotateX(0);
    setRotateY(0);
  };

  useEffect(() => {
    const card = cardRef.current;
    
    if (card) {
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${isHovering ? 1.02 : 1})`;
    }
  }, [rotateX, rotateY, isHovering]);

  return (
    <div
      ref={cardRef}
      className={cn(
        "transition-transform duration-200 ease-out",
        border && "border border-neutral-200 dark:border-neutral-800",
        shadow && "shadow-sm hover:shadow-md",
        "rounded-xl bg-white/60 backdrop-blur-md dark:bg-zinc-900/60 overflow-hidden",
        isHovering && "z-10",
        className
      )}
      style={{ 
        transformStyle: "preserve-3d",
        backfaceVisibility: "hidden",
        willChange: "transform" 
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      <div className="relative">{children}</div>
    </div>
  );
}

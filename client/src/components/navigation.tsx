
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { WalletIcon, Home, LayoutDashboard, ArrowDownUp, ChevronDown } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { useState, useEffect } from "react";
import { WalletButton } from "./wallet/wallet-button";

export function Navigation() {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  
  const isActive = (path: string) => {
    if (path === "/") return location.pathname === path;
    return location.pathname.startsWith(path);
  };
  
  const navLinkClass = (path: string) => {
    return `py-2 px-4 rounded-lg text-sm transition-colors duration-200 ${
      isActive(path)
        ? "bg-primary/10 text-primary font-medium"
        : "text-foreground hover:bg-muted"
    }`;
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 px-6 py-4 transition-all duration-300 ${
      scrolled ? "bg-background/80 backdrop-blur-md shadow-sm" : "bg-background"
    }`}>
      <div className="mx-auto max-w-7xl flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Link to="/" className="flex items-center gap-2 mr-6">
            <WalletIcon className="h-6 w-6 text-primary" />
            <span className="font-medium text-xl">Inertia Pay</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-2">
            <Link to="/" className={navLinkClass("/")}>
              <div className="flex items-center gap-1">
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
              </div>
            </Link>
            <Link to="/vaults" className={navLinkClass("/vaults")}>
              <div className="flex items-center gap-1">
                <WalletIcon className="h-4 w-4" />
                <span>My Vaults</span>
              </div>
            </Link>
            <Link to="/streams" className={navLinkClass("/streams")}>
              <div className="flex items-center gap-1">
                <ArrowDownUp className="h-4 w-4" />
                <span>All Streams</span>
              </div>
            </Link>
          </nav>
        </div>
        
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <WalletButton />
        </div>
      </div>
    </header>
  );
}

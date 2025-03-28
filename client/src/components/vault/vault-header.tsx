
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit } from "lucide-react";
import { Link } from "react-router-dom";

interface VaultHeaderProps {
  vaultName: string;
  onEditNameClick: () => void;
}

export function VaultHeader({ vaultName, onEditNameClick }: VaultHeaderProps) {
  return (
    <div className="flex items-center gap-2 mb-6">
      <Button variant="ghost" size="icon" asChild className="dark:hover:bg-purple-900/50">
        <Link to="/vaults">
          <ArrowLeft className="h-5 w-5" />
        </Link>
      </Button>
      <h1 className="text-3xl font-bold flex items-center gap-2">
        {vaultName}
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 dark:hover:bg-purple-900/50" 
          onClick={onEditNameClick}
        >
          <Edit className="h-4 w-4" />
        </Button>
      </h1>
    </div>
  );
}

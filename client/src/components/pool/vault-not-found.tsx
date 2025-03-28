
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Navigation } from "@/components/navigation";

export function VaultNotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <main className="pt-20 pb-16 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="page-transition text-center py-20">
          <h1 className="text-3xl font-bold mb-4">Vault Not Found</h1>
          <p className="text-muted-foreground mb-8">
            The vault you're looking for doesn't exist or you don't have access to it.
          </p>
          <Button asChild className="dark:bg-purple-700 dark:hover:bg-purple-600">
            <Link to="/pools">Back to Vaults</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}


import { Navigation } from "@/components/navigation";
import { VaultCard } from "@/components/vault-card.tsx";
import { CreateVaultDialog } from "@/components/create-vault-dialog.tsx";
import { mockWallet } from "@/lib/types";
import { Wallet2 } from "lucide-react";
import { useVaultsQuery } from "@/hooks/use-vaults-query";
import { useState } from "react";
import { ViewToggle, ViewMode } from "@/components/ui/view-toggle";
import { VaultListItem } from "@/components/vault-list-item";
import { 
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody
} from "@/components/ui/table";

const Vaults = () => {
  // Use the React Query hook to fetch vaults
  const { data: vaults, isLoading, error } = useVaultsQuery();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  
  // Get only user's vaults (filtering will happen after data loads)
  const userVaults = vaults
    ? vaults.filter((vault) => vault.owner === mockWallet.address)
    : [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      
      <main className="pt-20 pb-16 px-4 sm:px-6 max-w-7xl mx-auto">
        <section className="page-transition mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">My Vaults</h1>
              <p className="text-muted-foreground mt-1">
                Manage your payment vaults
              </p>
            </div>
            <div className="flex items-center gap-2">
              <ViewToggle view={viewMode} onChange={setViewMode} />
              <CreateVaultDialog />
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-pulse text-muted-foreground">Loading vaults...</div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-16 text-destructive">
              Error loading vaults
            </div>
          ) : userVaults.length > 0 ? (
            viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {userVaults.map((vault) => (
                  <VaultCard key={vault.id} vault={vault} />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {userVaults.map((vault) => (
                  <VaultCard key={vault.id} vault={vault} compact={true} />
                ))}
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="bg-muted rounded-full p-4 mb-4">
                <Wallet2 className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold mb-2">No vaults yet</h2>
              <p className="text-muted-foreground max-w-md mb-6">
                Create your first payment vault to start sending money to recipients in continuous streams.
              </p>
              <CreateVaultDialog />
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Vaults;


import { Navigation } from "@/components/navigation";
import { VaultCard } from "@/components/vault-card.tsx";
import { CreateVaultDialog } from "@/components/create-vault-dialog.tsx";
import { mockWallet } from "@/lib/types";
import { Wallet2, AlertCircle } from "lucide-react";
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
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useWalletContext } from "@/context/WalletContext";
import { Button } from "@/components/ui/button";

const Vaults = () => {
  // Use the wallet context to check connection status
  const { connected } = useWalletContext();
  
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
            <div className="flex flex-col gap-4 py-8">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  There was a problem loading your vaults. Please try refreshing the page.
                </AlertDescription>
              </Alert>
            </div>
          ) : !connected ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="bg-muted rounded-full p-4 mb-4">
                <Wallet2 className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Wallet not connected</h2>
              <p className="text-muted-foreground max-w-md mb-6">
                Please connect your wallet to view and manage your payment vaults. You'll need a connected wallet to create and fund vaults.
              </p>
              <Alert className="mb-6 max-w-md mx-auto">
                <AlertTitle className="text-center">Why connect a wallet?</AlertTitle>
                <AlertDescription className="text-center">
                  Your wallet is used to sign transactions when creating vaults and streams. It also identifies you as the owner of these vaults.
                </AlertDescription>
              </Alert>
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
              <p className="text-muted-foreground max-w-md mb-2">
                You haven't created any payment vaults yet. You need to create a vault before you can start creating payment streams.
              </p>
              <p className="text-muted-foreground max-w-md mb-6">
                Vaults hold funds that are used to finance your continuous payment streams to recipients.
              </p>
              <Alert className="mb-6 max-w-md mx-auto">
                <AlertTitle className="text-center">Why create a vault?</AlertTitle>
                <AlertDescription className="text-center">
                  Vaults are required to create payment streams. Each stream must be connected to a vault that will provide its funding.
                </AlertDescription>
              </Alert>
              <CreateVaultDialog />
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Vaults;

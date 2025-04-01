import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Navigation } from "@/components/navigation";
import { formatCurrency } from "@/lib/types";
import { DrainVaultDialog } from "@/components/vault/drain-vault-dialog.tsx";
import { EditVaultNameDialog } from "@/components/vault/edit-vault-name-dialog.tsx";
import { DeleteVaultDialog } from "@/components/vault/delete-vault-dialog";
import { VaultHeader } from "@/components/vault/vault-header.tsx";
import { VaultStats } from "@/components/vault/vault-stats.tsx";
import { StreamsList } from "@/components/vault/streams-list";
import { AddCreditDialog } from "@/components/vault/add-credit-dialog";
import { VaultNotFound } from "@/components/vault/vault-not-found";
import { useVaultQuery } from "@/hooks/use-vaults-query";
import { 
  useUpdateVaultMutation, 
  useDeleteVaultMutation,
  useAddCreditMutation,
  useDrainVaultMutation 
} from "@/hooks/use-vault-mutations";

const Vault = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [addCreditOpen, setAddCreditOpen] = useState(false);
  const [drainVaultOpen, setDrainVaultOpen] = useState(false);
  const [editNameOpen, setEditNameOpen] = useState(false);
  const [deleteVaultOpen, setDeleteVaultOpen] = useState(false);
  const [creditAmount, setCreditAmount] = useState("");
  const { toast: hookToast } = useToast();
  
  // Use the React Query hook to fetch vault data
  const { data: vault, isLoading, error } = useVaultQuery(id);
  
  // Use mutation hooks
  const updateVaultMutation = useUpdateVaultMutation();
  const deleteVaultMutation = useDeleteVaultMutation();
  const addCreditMutation = useAddCreditMutation();
  const drainVaultMutation = useDrainVaultMutation();
  
  // Copy address to clipboard
  const copyToClipboard = (address: string) => {
    navigator.clipboard.writeText(address);
    hookToast({
      title: "Address Copied",
      description: "The wallet address has been copied to your clipboard."
    });
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navigation />
        <main className="pt-20 pb-16 px-4 sm:px-6 max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-16">
            <div className="animate-pulse text-muted-foreground">Loading vault details...</div>
          </div>
        </main>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navigation />
        <main className="pt-20 pb-16 px-4 sm:px-6 max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-16 text-destructive">
            Error loading vault details
          </div>
        </main>
      </div>
    );
  }

  // Show not found state if no vault is returned
  if (!vault) {
    return <VaultNotFound />;
  }

  // Calculate the total amount being streamed per second
  const totalStreamingRate = vault.streams.reduce(
    (sum, stream) => sum + (stream.active ? stream.amountPerSecond : 0),
    0
  );

  // Calculate how long the vault will last at the current rate
  const timeLeftInSeconds = totalStreamingRate > 0 
    ? vault.balance / totalStreamingRate
    : 0;
  
  // Format the time left
  const formatTimeLeft = (seconds: number) => {
    if (seconds === 0) return "∞";
    
    const days = Math.floor(seconds / (24 * 3600));
    const hours = Math.floor((seconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // Calculate the percentage of active streams to all streams
  const activeStreamsPercentage = 
    vault.streams.length > 0
      ? (vault.streams.filter(s => s.active).length / vault.streams.length) * 100
      : 0;

  const handleAddCredit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id || !creditAmount) return;
    
    const amount = parseFloat(creditAmount);
    if (isNaN(amount) || amount <= 0) return;
    
    // Use the mutation hook
    await addCreditMutation.mutateAsync({ id, amount });
    
    setAddCreditOpen(false);
    setCreditAmount("");
  };

  const handleDrainVault = async (amount: number) => {
    if (!id) return;
    
    // Use the mutation hook
    await drainVaultMutation.mutateAsync({ id, amount });
    
    setDrainVaultOpen(false);
  };
  
  const handleSaveVaultName = (newName: string) => {
    if (!id) return;
    
    // Use the mutation hook
    updateVaultMutation.mutate({ 
      id, 
      updates: { name: newName } 
    });
    
    setEditNameOpen(false);
  };
  
  const handleDeleteVault = async () => {
    if (!id) return;
    
    // Use the mutation hook
    await deleteVaultMutation.mutateAsync(id);
    
    // Navigate back to vaults list
    navigate("/vaults");
  };
  
  // Get the vault name or use the ID as fallback
  const vaultName = vault?.name || `Vault ${vault?.id.split("-")[1]}`;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      
      <main className="pt-20 pb-16 px-4 sm:px-6 max-w-7xl mx-auto">
        <section className="page-transition">
          <VaultHeader
            vaultName={vaultName}
            onEditNameClick={() => setEditNameOpen(true)}
          />
          
          <VaultStats
            vault={vault}
            totalStreamingRate={totalStreamingRate}
            timeLeftInSeconds={timeLeftInSeconds}
            activeStreamsPercentage={activeStreamsPercentage}
            formatTimeLeft={formatTimeLeft}
            onAddCreditClick={() => setAddCreditOpen(true)}
            onDrainVaultClick={() => setDrainVaultOpen(true)}
            onDeleteVaultClick={() => setDeleteVaultOpen(true)}
            copyToClipboard={copyToClipboard}
          />
          
          {/* Here's the fixed StreamsList call */}
          <StreamsList vaultId={vault.id} />
        </section>
      </main>
      
      <AddCreditDialog 
        open={addCreditOpen}
        onOpenChange={setAddCreditOpen}
        onConfirm={handleAddCredit}
        tokenType={vault?.token || ""}
        creditAmount={creditAmount}
        setCreditAmount={setCreditAmount}
        loading={addCreditMutation.isPending}
      />
      
      <DrainVaultDialog
        open={drainVaultOpen}
        onOpenChange={setDrainVaultOpen}
        onConfirm={handleDrainVault}
        vaultBalance={vault?.balance || 0}
        tokenType={vault?.token || ""}
      />
      
      <EditVaultNameDialog
        open={editNameOpen}
        onOpenChange={setEditNameOpen}
        currentName={vaultName}
        onSave={handleSaveVaultName}
      />
      
      <DeleteVaultDialog
        open={deleteVaultOpen}
        onOpenChange={setDeleteVaultOpen}
        onConfirm={handleDeleteVault}
        vaultName={vaultName}
      />
    </div>
  );
};

export default Vault;

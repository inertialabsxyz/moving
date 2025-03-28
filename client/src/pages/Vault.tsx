
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useToast } from "@/hooks/use-toast";
import { Navigation } from "@/components/navigation";
import { formatCurrency, mockVaults } from "@/lib/types";
import { DrainVaultDialog } from "@/components/vault/drain-vault-dialog.tsx";
import { EditVaultNameDialog } from "@/components/vault/edit-vault-name-dialog.tsx";
import { DeleteVaultDialog } from "@/components/vault/delete-vault-dialog";
import { VaultHeader } from "@/components/vault/vault-header.tsx";
import { VaultStats } from "@/components/vault/vault-stats.tsx";
import { StreamsList } from "@/components/vault/streams-list";
import { AddCreditDialog } from "@/components/vault/add-credit-dialog";
import { VaultNotFound } from "@/components/vault/vault-not-found";

const Vault = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [addCreditOpen, setAddCreditOpen] = useState(false);
  const [drainVaultOpen, setDrainVaultOpen] = useState(false);
  const [editNameOpen, setEditNameOpen] = useState(false);
  const [deleteVaultOpen, setDeleteVaultOpen] = useState(false);
  const [creditAmount, setCreditAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast: hookToast } = useToast();

  // Find the vault from the mockVaults
  const vault = mockVaults.find((p) => p.id === id);
  
  // Copy address to clipboard
  const copyToClipboard = (address: string) => {
    navigator.clipboard.writeText(address);
    hookToast({
      title: "Address Copied",
      description: "The wallet address has been copied to your clipboard."
    });
  };

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
    
    setLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast.success(`Added ${formatCurrency(parseFloat(creditAmount))} to vault`);
    setLoading(false);
    setAddCreditOpen(false);
    setCreditAmount("");
  };

  const handleDrainVault = async (amount: number) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast.success(`Drained ${formatCurrency(amount)} from vault`);
    setDrainVaultOpen(false);
  };
  
  const handleSaveVaultName = (newName: string) => {
    // In a real app, this would make an API call
    // For now, just show a toast
    toast.success(`Vault name updated to "${newName}"`);
  };
  
  const handleDeleteVault = async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast.success(`Vault "${vaultName}" has been deleted`);
    
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
          
          <StreamsList 
            streams={vault.streams}
            vaultId={vault.id}
          />
        </section>
      </main>
      
      <AddCreditDialog 
        open={addCreditOpen}
        onOpenChange={setAddCreditOpen}
        onConfirm={handleAddCredit}
        tokenType={vault?.token || ""}
        creditAmount={creditAmount}
        setCreditAmount={setCreditAmount}
        loading={loading}
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

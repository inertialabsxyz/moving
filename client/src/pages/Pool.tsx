
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useToast } from "@/hooks/use-toast";
import { Navigation } from "@/components/navigation";
import { formatCurrency, mockPools } from "@/lib/types";
import { DrainPoolDialog } from "@/components/pool/drain-pool-dialog";
import { EditPoolNameDialog } from "@/components/pool/edit-pool-name-dialog";
import { DeleteVaultDialog } from "@/components/pool/delete-vault-dialog";
import { PoolHeader } from "@/components/pool/pool-header";
import { PoolStats } from "@/components/pool/pool-stats";
import { StreamsList } from "@/components/pool/streams-list";
import { AddCreditDialog } from "@/components/pool/add-credit-dialog";
import { VaultNotFound } from "@/components/pool/vault-not-found";

const Pool = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [addCreditOpen, setAddCreditOpen] = useState(false);
  const [drainPoolOpen, setDrainPoolOpen] = useState(false);
  const [editNameOpen, setEditNameOpen] = useState(false);
  const [deleteVaultOpen, setDeleteVaultOpen] = useState(false);
  const [creditAmount, setCreditAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast: hookToast } = useToast();

  // Find the pool from the mockPools
  const pool = mockPools.find((p) => p.id === id);
  
  // Copy address to clipboard
  const copyToClipboard = (address: string) => {
    navigator.clipboard.writeText(address);
    hookToast({
      title: "Address Copied",
      description: "The wallet address has been copied to your clipboard."
    });
  };

  if (!pool) {
    return <VaultNotFound />;
  }

  // Calculate the total amount being streamed per second
  const totalStreamingRate = pool.streams.reduce(
    (sum, stream) => sum + (stream.active ? stream.amountPerSecond : 0),
    0
  );

  // Calculate how long the pool will last at the current rate
  const timeLeftInSeconds = totalStreamingRate > 0 
    ? pool.balance / totalStreamingRate 
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
    pool.streams.length > 0
      ? (pool.streams.filter(s => s.active).length / pool.streams.length) * 100
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

  const handleDrainPool = async (amount: number) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast.success(`Drained ${formatCurrency(amount)} from vault`);
    setDrainPoolOpen(false);
  };
  
  const handleSavePoolName = (newName: string) => {
    // In a real app, this would make an API call
    // For now, just show a toast
    toast.success(`Vault name updated to "${newName}"`);
  };
  
  const handleDeleteVault = async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast.success(`Vault "${poolName}" has been deleted`);
    
    // Navigate back to vaults list
    navigate("/pools");
  };
  
  // Get the pool name or use the ID as fallback
  const poolName = pool?.name || `Vault ${pool?.id.split("-")[1]}`;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      
      <main className="pt-20 pb-16 px-4 sm:px-6 max-w-7xl mx-auto">
        <section className="page-transition">
          <PoolHeader 
            poolName={poolName}
            onEditNameClick={() => setEditNameOpen(true)}
          />
          
          <PoolStats 
            pool={pool}
            totalStreamingRate={totalStreamingRate}
            timeLeftInSeconds={timeLeftInSeconds}
            activeStreamsPercentage={activeStreamsPercentage}
            formatTimeLeft={formatTimeLeft}
            onAddCreditClick={() => setAddCreditOpen(true)}
            onDrainPoolClick={() => setDrainPoolOpen(true)}
            onDeleteVaultClick={() => setDeleteVaultOpen(true)}
            copyToClipboard={copyToClipboard}
          />
          
          <StreamsList 
            streams={pool.streams}
            poolId={pool.id}
          />
        </section>
      </main>
      
      <AddCreditDialog 
        open={addCreditOpen}
        onOpenChange={setAddCreditOpen}
        onConfirm={handleAddCredit}
        tokenType={pool?.token || ""}
        creditAmount={creditAmount}
        setCreditAmount={setCreditAmount}
        loading={loading}
      />
      
      <DrainPoolDialog
        open={drainPoolOpen}
        onOpenChange={setDrainPoolOpen}
        onConfirm={handleDrainPool}
        poolBalance={pool?.balance || 0}
        tokenType={pool?.token || ""}
      />
      
      <EditPoolNameDialog
        open={editNameOpen}
        onOpenChange={setEditNameOpen}
        currentName={poolName}
        onSave={handleSavePoolName}
      />
      
      <DeleteVaultDialog
        open={deleteVaultOpen}
        onOpenChange={setDeleteVaultOpen}
        onConfirm={handleDeleteVault}
        vaultName={poolName}
      />
    </div>
  );
};

export default Pool;

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { mockVaults, SUPPORTED_TOKENS } from "@/lib/types";

interface CreateStreamDialogProps {
  vaultId?: string;
}

export function CreateStreamDialog({ vaultId }: CreateStreamDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedVault, setSelectedVault] = useState(vaultId || "");
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");
  const [recipient, setRecipient] = useState("");
  const [rate, setRate] = useState("");
  const [timeUnit, setTimeUnit] = useState("second");
  const [loading, setLoading] = useState(false);
  const [vaultToken, setVaultToken] = useState("");

  useEffect(() => {
    // Set initial vault token if vaultId is provided
    if (vaultId) {
      const vault = mockVaults.find(p => p.id === vaultId);
      if (vault) {
        setVaultToken(vault.token);
      }
    }
  }, [vaultId]);

  // Update vault token when selected vault changes
  useEffect(() => {
    if (selectedVault) {
      const vault = mockVaults.find(p => p.id === selectedVault);
      if (vault) {
        setVaultToken(vault.token);
      }
    }
  }, [selectedVault]);

  // Validate name field when it changes
  const validateName = (value: string) => {
    if (value.length < 3) {
      setNameError("Name must be at least 3 characters");
      return false;
    }
    
    if (!/^[a-zA-Z0-9\s]+$/.test(value)) {
      setNameError("Name must be alphanumeric");
      return false;
    }
    
    setNameError("");
    return true;
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);
    validateName(value);
  };

  // Convert rate to per-second rate based on selected time unit
  const calculateRatePerSecond = (rateValue: string, unit: string): number => {
    const numericRate = parseFloat(rateValue);
    if (isNaN(numericRate)) return 0;
    
    switch (unit) {
      case "second":
        return numericRate;
      case "minute":
        return numericRate / 60;
      case "hour":
        return numericRate / 3600;
      case "day":
        return numericRate / 86400;
      default:
        return numericRate;
    }
  };

  // Calculate equivalent rates for display
  const calculateEquivalentRates = (rateValue: string, unit: string) => {
    const numericRate = parseFloat(rateValue);
    if (isNaN(numericRate)) return { perSecond: 0, perHour: 0, perDay: 0 };
    
    let perSecond: number;
    
    switch (unit) {
      case "second":
        perSecond = numericRate;
        break;
      case "minute":
        perSecond = numericRate / 60;
        break;
      case "hour":
        perSecond = numericRate / 3600;
        break;
      case "day":
        perSecond = numericRate / 86400;
        break;
      default:
        perSecond = numericRate;
    }
    
    return {
      perSecond,
      perHour: perSecond * 3600,
      perDay: perSecond * 86400
    };
  };

  const handleCreateStream = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Final validation
    if (!validateName(name)) {
      return;
    }
    
    setLoading(true);
    
    // Convert rate to per-second rate
    const ratePerSecond = calculateRatePerSecond(rate, timeUnit);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast.success("Stream created successfully!");
    setLoading(false);
    setOpen(false);
    setName("");
    setRecipient("");
    setRate("");
    setTimeUnit("second");
  };

  const equivalentRates = calculateEquivalentRates(rate, timeUnit);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-1">
          <Plus className="h-4 w-4" /> New Stream
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Payment Stream</DialogTitle>
          <DialogDescription>
            Create a new payment stream to automatically send funds over time.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreateStream}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Stream Name</Label>
              <Input
                id="name"
                placeholder="My Payment Stream"
                value={name}
                onChange={handleNameChange}
                required
              />
              {nameError && (
                <p className="text-sm text-destructive">{nameError}</p>
              )}
            </div>
            
            {!vaultId && (
              <div className="grid gap-2">
                <Label htmlFor="vault">Select Vault</Label>
                <Select
                  value={selectedVault}
                  onValueChange={setSelectedVault}
                  required
                >
                  <SelectTrigger id="vault">
                    <SelectValue placeholder="Select a vault" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockVaults.map((vault) => (
                      <SelectItem key={vault.id} value={vault.id}>
                        {vault.name || `Vault ${vault.id.split("-")[1]}`} ({vault.token})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="recipient">Recipient Address</Label>
              <Input
                id="recipient"
                placeholder="0x..."
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rate">Payment Rate</Label>
              <div className="flex gap-2">
                <Input
                  id="rate"
                  type="number"
                  step="0.0001"
                  min="0"
                  placeholder="0.00"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  required
                  className="flex-1"
                />
                <Select
                  value={timeUnit}
                  onValueChange={setTimeUnit}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="per second" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="second">per second</SelectItem>
                    <SelectItem value="minute">per minute</SelectItem>
                    <SelectItem value="hour">per hour</SelectItem>
                    <SelectItem value="day">per day</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(selectedVault || vaultId) && rate && (
                <div className="text-sm text-muted-foreground mt-1">
                  <p>This is approximately:</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1">
                    <p className="font-medium">
                      {equivalentRates.perSecond.toFixed(6)} {vaultToken}/second
                    </p>
                    <p className="font-medium">
                      {equivalentRates.perHour.toFixed(4)} {vaultToken}/hour
                    </p>
                    <p className="font-medium">
                      {equivalentRates.perDay.toFixed(2)} {vaultToken}/day
                    </p>
                    <p className="font-medium">
                      {(equivalentRates.perDay * 30).toFixed(2)} {vaultToken}/month
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !name || nameError !== "" || !recipient || !rate || (!vaultId && !selectedVault)}
            >
              {loading ? "Creating..." : "Create Stream"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

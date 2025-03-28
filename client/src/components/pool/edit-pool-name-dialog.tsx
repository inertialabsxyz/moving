
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface EditPoolNameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentName: string;
  onSave: (newName: string) => void;
}

export function EditPoolNameDialog({ open, onOpenChange, currentName, onSave }: EditPoolNameDialogProps) {
  const [newName, setNewName] = useState(currentName);
  const [nameError, setNameError] = useState("");
  
  // Validate name field
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
    setNewName(value);
    validateName(value);
  };

  const handleSaveName = () => {
    if (validateName(newName)) {
      onSave(newName);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Vault Name</DialogTitle>
          <DialogDescription>
            Update the name of this payment vault.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="poolName">Vault Name</Label>
            <Input
              id="poolName"
              placeholder="My Payment Vault"
              value={newName}
              onChange={handleNameChange}
              required
            />
            {nameError && (
              <p className="text-sm text-destructive">{nameError}</p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handleSaveName}
            disabled={!newName || nameError !== ""}
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


import { LayoutGrid, List } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export type ViewMode = "grid" | "list";

interface ViewToggleProps {
  view: ViewMode;
  onChange: (view: ViewMode) => void;
}

export function ViewToggle({ view, onChange }: ViewToggleProps) {
  return (
    <ToggleGroup
      type="single"
      value={view}
      onValueChange={(value) => {
        if (value) onChange(value as ViewMode);
      }}
      className="border rounded-md"
      variant="outline"
    >
      <ToggleGroupItem value="grid" aria-label="Grid view">
        <LayoutGrid className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="list" aria-label="List view">
        <List className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}

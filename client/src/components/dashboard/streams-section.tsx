
import { Button } from "@/components/ui/button";
import { StreamCard } from "@/components/stream-card";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Stream } from "@/lib/types";

interface StreamsSectionProps {
  streams: Stream[];
  title: string;
  linkTo: string;
  isReceiving?: boolean;
}

export function StreamsSection({ streams, title, linkTo, isReceiving = false }: StreamsSectionProps) {
  if (streams.length === 0) return null;
  
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">{title}</h2>
        <Button variant="ghost" asChild>
          <Link to={linkTo} className="gap-1">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {streams.map((stream) => (
          <StreamCard key={stream.id} stream={stream} isReceiving={isReceiving} />
        ))}
      </div>
    </div>
  );
}

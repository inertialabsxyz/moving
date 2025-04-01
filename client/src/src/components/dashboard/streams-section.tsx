
import { Button } from "@/components/ui/button";
import { StreamCard } from "@/components/stream-card";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Stream } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

interface StreamsSectionProps {
  streams: Stream[];
  title: string;
  linkTo: string;
  isReceiving?: boolean;
  isLoading?: boolean;
}

export function StreamsSection({ streams, title, linkTo, isReceiving = false, isLoading = false }: StreamsSectionProps) {
  if (streams.length === 0 && !isLoading) return null;
  
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
      <div className="space-y-3">
        {isLoading ? (
          [1, 2].map((i) => (
            <div key={`skeleton-${i}`} className="p-6 rounded-lg border">
              <Skeleton className="h-6 w-1/2 mb-2" />
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-4 w-2/3 mb-4" />
              <div className="flex justify-between">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-5 w-1/4" />
              </div>
            </div>
          ))
        ) : (
          streams.map((stream) => (
            <StreamCard 
              key={stream.id} 
              stream={stream} 
              isReceiving={isReceiving} 
              compact={true} 
            />
          ))
        )}
      </div>
    </div>
  );
}

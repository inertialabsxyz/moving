
import { Stream } from "@/lib/types";
import { StreamCard } from "@/components/stream-card";
import { CreateStreamDialog } from "@/components/create-stream-dialog";

interface StreamsListProps {
  streams: Stream[];
  poolId: string;
}

export function StreamsList({ streams, poolId }: StreamsListProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Payment Streams</h2>
        <CreateStreamDialog poolId={poolId} />
      </div>
      
      {streams.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {streams.map((stream) => (
            <StreamCard key={stream.id} stream={stream} hidePoolInfo={true} />
          ))}
        </div>
      ) : (
        <div className="glass-card rounded-xl p-8 text-center">
          <h3 className="text-lg font-medium mb-2">No streams yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first payment stream to start sending funds.
          </p>
          <CreateStreamDialog poolId={poolId} />
        </div>
      )}
    </div>
  );
}

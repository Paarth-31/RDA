import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link2 } from "lucide-react";

interface JoinCardProps {
  remoteId: string;
  setRemoteId: (id: string) => void;
  handleJoin: () => void;
}

export const JoinCard = ({ remoteId, setRemoteId, handleJoin }: JoinCardProps) => {
  return (
    <Card className="bg-black/40 backdrop-blur-md border-white/10 hover:border-primary/50 transition-all duration-300 group">
       <CardHeader className="text-center pb-2">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
          <Link2 className="w-6 h-6 text-primary" />
        </div>
        <CardTitle className="text-white text-xl">Join Session</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input 
          placeholder="Enter Peer ID..." 
          value={remoteId}
          onChange={(e) => setRemoteId(e.target.value)}
          className="h-12 bg-black/50 border-white/10 text-center text-lg font-mono tracking-widest focus-visible:ring-primary"
        />
        <Button 
          onClick={handleJoin}
          className="w-full h-12 bg-primary text-black font-black uppercase tracking-widest hover:bg-primary/90 shadow-[0_0_20px_rgba(6,182,212,0.3)]"
        >
          Connect Now
        </Button>
      </CardContent>
    </Card>
  );
};
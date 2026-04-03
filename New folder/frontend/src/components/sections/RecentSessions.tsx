import { Monitor } from "lucide-react";

const SESSIONS = [
  { name: "Newt Sccok", id: "890-123-456", online: true },
  { name: "Hestia Sostle", id: "445-678-901", online: false },
  { name: "Ironbound Bedplate", id: "112-334-556", online: false },
  { name: "Media Server", id: "998-776-554", online: true },
  { name: "Liesatee Seeds", id: "332-112-009", online: false },
];

export const RecentSessions = () => {
  return (
    <div className="w-full max-w-5xl mt-12 animate-in slide-in-from-bottom-10 duration-500">
      <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Recent Sessions</h3>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {SESSIONS.map((session) => (
          <div key={session.id} className="bg-card/30 border border-white/5 hover:border-primary/30 p-4 rounded-lg cursor-pointer transition-all group">
            <div className="flex items-start justify-between mb-2">
              <Monitor className="w-8 h-8 text-white/20 group-hover:text-primary transition-colors" />
              {session.online && <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_5px_lime]" />}
            </div>
            <div className="text-xs font-bold text-white group-hover:text-primary truncate">{session.name}</div>
            <div className="text-[10px] font-mono text-muted-foreground">{session.id}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
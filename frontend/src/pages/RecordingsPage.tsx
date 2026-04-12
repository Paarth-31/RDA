import { useState } from 'react';
import { ChevronLeft, Film, Play, Download, Trash2, Clock, Calendar, HardDrive, Search } from 'lucide-react';

interface Props {
  onBack: () => void;
}

const MOCK_RECORDINGS = [
  { id: '1', name: 'Work Laptop Session', date: '2026-04-10', duration: '00:45:12', size: '234 MB', remoteId: '48291039472' },
  { id: '2', name: 'Home Desktop — Troubleshoot', date: '2026-04-08', duration: '00:12:05', size: '62 MB', remoteId: '71930284710' },
  { id: '3', name: 'Office PC Setup', date: '2026-04-05', duration: '01:02:44', size: '512 MB', remoteId: '39017483920' },
  { id: '4', name: 'Support Session #4', date: '2026-03-30', duration: '00:08:33', size: '41 MB', remoteId: '82930471029' },
];

export function RecordingsPage({ onBack }: Props) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = MOCK_RECORDINGS.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white flex flex-col" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* Header */}
      <header className="flex items-center gap-4 px-6 py-4 border-b border-white/[0.06] bg-black/40">
        <button onClick={onBack} className="flex items-center gap-1.5 text-white/40 hover:text-white/80 text-sm transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <div className="w-px h-5 bg-white/10" />
        <div className="flex items-center gap-2">
          <Film className="w-4 h-4 text-rose-400" />
          <span className="font-bold text-sm">Saved Recordings</span>
        </div>
      </header>

      <main className="flex-1 px-8 py-6 max-w-4xl mx-auto w-full">
        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search recordings..."
            className="w-full bg-[#111113] border border-white/[0.07] rounded-xl pl-10 pr-4 py-3 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-indigo-500/40 transition-all"
          />
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { icon: Film, label: 'Total recordings', value: MOCK_RECORDINGS.length.toString(), color: 'text-rose-400' },
            { icon: HardDrive, label: 'Storage used', value: '849 MB', color: 'text-amber-400' },
            { icon: Clock, label: 'Total duration', value: '2h 08m', color: 'text-blue-400' },
          ].map(stat => (
            <div key={stat.label} className="bg-[#111113] border border-white/[0.07] rounded-xl p-4 flex items-center gap-3">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
              <div>
                <p className="text-white font-bold text-lg">{stat.value}</p>
                <p className="text-[11px] text-white/30">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Recordings list */}
        <div className="flex flex-col gap-2">
          {filtered.length === 0 && (
            <div className="text-center py-16 text-white/20">
              <Film className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No recordings found</p>
            </div>
          )}
          {filtered.map(rec => (
            <div
              key={rec.id}
              onClick={() => setSelected(s => s === rec.id ? null : rec.id)}
              className={`bg-[#111113] border rounded-xl p-4 cursor-pointer transition-all ${selected === rec.id ? 'border-indigo-500/40 bg-indigo-500/5' : 'border-white/[0.07] hover:border-white/[0.15]'}`}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
                  <Film className="w-5 h-5 text-rose-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white/90 text-sm">{rec.name}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="flex items-center gap-1 text-[11px] text-white/30">
                      <Calendar className="w-3 h-3" /> {rec.date}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-white/30">
                      <Clock className="w-3 h-3" /> {rec.duration}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-white/30">
                      <HardDrive className="w-3 h-3" /> {rec.size}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                  <button className="p-2 rounded-lg text-white/30 hover:text-white/80 hover:bg-white/10 transition-all">
                    <Play className="w-4 h-4" />
                  </button>
                  <button className="p-2 rounded-lg text-white/30 hover:text-blue-400 hover:bg-blue-500/10 transition-all">
                    <Download className="w-4 h-4" />
                  </button>
                  <button className="p-2 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
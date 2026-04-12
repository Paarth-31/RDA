// import { useState } from 'react';
// import { ChevronLeft, Book, Monitor, Star, StarOff, Search, Plus, ArrowRight, Wifi, WifiOff, Trash2, Edit3, Check, X } from 'lucide-react';

// interface Props {
//   onBack: () => void;
//   onConnect: (id: string) => void;
// }

// interface Contact {
//   id: string;
//   remoteId: string;
//   name: string;
//   online: boolean;
//   favourite: boolean;
//   lastSeen: string;
//   useCount: number;
// }

// const INITIAL_CONTACTS: Contact[] = [
//   { id: '1', remoteId: '48291039472', name: 'Work Laptop',    online: true,  favourite: true,  lastSeen: '2h ago',    useCount: 42 },
//   { id: '2', remoteId: '71930284710', name: 'Home Desktop',   online: false, favourite: true,  lastSeen: 'Yesterday', useCount: 18 },
//   { id: '3', remoteId: '39017483920', name: 'Office PC',      online: false, favourite: false, lastSeen: '3 days ago',useCount: 7  },
//   { id: '4', remoteId: '82930471029', name: 'Server Node',    online: true,  favourite: false, lastSeen: 'Just now',  useCount: 3  },
//   { id: '5', remoteId: '11029384756', name: "Dad's PC",       online: false, favourite: true,  lastSeen: '1 week ago',useCount: 5  },
// ];

// export function AddressBookPage({ onBack, onConnect }: Props) {
//   const [contacts, setContacts] = useState<Contact[]>(INITIAL_CONTACTS);
//   const [search, setSearch] = useState('');
//   const [filter, setFilter] = useState<'all' | 'online' | 'favourites'>('all');
//   const [editingId, setEditingId] = useState<string | null>(null);
//   const [editName, setEditName] = useState('');
//   const [showAddForm, setShowAddForm] = useState(false);
//   const [newId, setNewId] = useState('');
//   const [newName, setNewName] = useState('');

//   const filtered = contacts
//     .filter(c => {
//       if (filter === 'online') return c.online;
//       if (filter === 'favourites') return c.favourite;
//       return true;
//     })
//     .filter(c =>
//       c.name.toLowerCase().includes(search.toLowerCase()) ||
//       c.remoteId.includes(search)
//     );

//   const toggleFavourite = (id: string) => {
//     setContacts(cs => cs.map(c => c.id === id ? { ...c, favourite: !c.favourite } : c));
//   };

//   const removeContact = (id: string) => {
//     setContacts(cs => cs.filter(c => c.id !== id));
//   };

//   const startEdit = (c: Contact) => {
//     setEditingId(c.id);
//     setEditName(c.name);
//   };

//   const saveEdit = (id: string) => {
//     setContacts(cs => cs.map(c => c.id === id ? { ...c, name: editName } : c));
//     setEditingId(null);
//   };

//   const addContact = () => {
//     if (!newId.trim()) return;
//     setContacts(cs => [...cs, {
//       id: Date.now().toString(),
//       remoteId: newId.trim(),
//       name: newName.trim() || `Device ${newId.trim().slice(-4)}`,
//       online: false,
//       favourite: false,
//       lastSeen: 'Never',
//       useCount: 0,
//     }]);
//     setNewId('');
//     setNewName('');
//     setShowAddForm(false);
//   };

//   return (
//     <div className="min-h-screen bg-[#0a0a0b] text-white flex flex-col" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
//       <header className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-black/40">
//         <div className="flex items-center gap-4">
//           <button onClick={onBack} className="flex items-center gap-1.5 text-white/40 hover:text-white/80 text-sm transition-colors">
//             <ChevronLeft className="w-4 h-4" /> Back
//           </button>
//           <div className="w-px h-5 bg-white/10" />
//           <div className="flex items-center gap-2">
//             <Book className="w-4 h-4 text-blue-400" />
//             <span className="font-bold text-sm">Address Book</span>
//           </div>
//         </div>
//         <button
//           onClick={() => setShowAddForm(v => !v)}
//           className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 text-xs font-semibold border border-indigo-500/20 transition-all"
//         >
//           <Plus className="w-3.5 h-3.5" /> Add Contact
//         </button>
//       </header>

//       <main className="flex-1 px-8 py-6 max-w-3xl mx-auto w-full">

//         {/* Add contact form */}
//         {showAddForm && (
//           <div className="bg-[#111113] border border-indigo-500/20 rounded-xl p-4 mb-5">
//             <p className="text-sm font-semibold mb-3 text-white/70">Add new contact</p>
//             <div className="flex gap-3">
//               <input
//                 placeholder="Remote ID (11 digits)"
//                 value={newId}
//                 onChange={e => setNewId(e.target.value)}
//                 className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/40"
//               />
//               <input
//                 placeholder="Nickname (optional)"
//                 value={newName}
//                 onChange={e => setNewName(e.target.value)}
//                 className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/40"
//               />
//               <button onClick={addContact} className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all">
//                 Add
//               </button>
//               <button onClick={() => setShowAddForm(false)} className="p-2 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/10 transition-all">
//                 <X className="w-4 h-4" />
//               </button>
//             </div>
//           </div>
//         )}

//         {/* Filters + search */}
//         <div className="flex items-center gap-3 mb-5">
//           <div className="relative flex-1">
//             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25" />
//             <input
//               value={search}
//               onChange={e => setSearch(e.target.value)}
//               placeholder="Search by name or ID..."
//               className="w-full bg-[#111113] border border-white/[0.07] rounded-lg pl-9 pr-3 py-2.5 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-indigo-500/40 transition-all"
//             />
//           </div>
//           <div className="flex gap-1 p-1 bg-white/[0.04] rounded-lg border border-white/[0.06]">
//             {(['all', 'online', 'favourites'] as const).map(f => (
//               <button
//                 key={f}
//                 onClick={() => setFilter(f)}
//                 className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-all ${filter === f ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/60'}`}
//               >
//                 {f}
//               </button>
//             ))}
//           </div>
//         </div>

//         {/* Contact list */}
//         <div className="flex flex-col gap-2">
//           {filtered.length === 0 && (
//             <div className="text-center py-16 text-white/20">
//               <Book className="w-10 h-10 mx-auto mb-3 opacity-30" />
//               <p className="text-sm">No contacts found</p>
//             </div>
//           )}
//           {filtered.map(contact => (
//             <div key={contact.id} className="group bg-[#111113] hover:bg-[#161618] border border-white/[0.06] hover:border-white/[0.12] rounded-xl p-4 transition-all">
//               <div className="flex items-center gap-4">
//                 <div className="relative">
//                   <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
//                     <Monitor className="w-5 h-5 text-white/25" />
//                   </div>
//                   <div className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#111113] ${contact.online ? 'bg-emerald-400' : 'bg-white/15'}`} />
//                 </div>

//                 <div className="flex-1 min-w-0">
//                   {editingId === contact.id ? (
//                     <div className="flex items-center gap-2">
//                       <input
//                         value={editName}
//                         onChange={e => setEditName(e.target.value)}
//                         onKeyDown={e => { if (e.key === 'Enter') saveEdit(contact.id); if (e.key === 'Escape') setEditingId(null); }}
//                         className="bg-black/50 border border-indigo-500/40 rounded-lg px-2 py-1 text-sm text-white focus:outline-none"
//                         autoFocus
//                       />
//                       <button onClick={() => saveEdit(contact.id)} className="p-1 text-emerald-400 hover:bg-emerald-500/10 rounded transition-all">
//                         <Check className="w-3.5 h-3.5" />
//                       </button>
//                       <button onClick={() => setEditingId(null)} className="p-1 text-white/30 hover:bg-white/10 rounded transition-all">
//                         <X className="w-3.5 h-3.5" />
//                       </button>
//                     </div>
//                   ) : (
//                     <p className="font-semibold text-sm text-white/80">{contact.name}</p>
//                   )}
//                   <div className="flex items-center gap-3 mt-0.5">
//                     <span className="font-mono text-[11px] text-white/25">{contact.remoteId.slice(0,3)} {contact.remoteId.slice(3,6)} {contact.remoteId.slice(6,9)} {contact.remoteId.slice(9)}</span>
//                     <span className={`flex items-center gap-1 text-[11px] ${contact.online ? 'text-emerald-400' : 'text-white/25'}`}>
//                       {contact.online ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
//                       {contact.online ? 'Online' : contact.lastSeen}
//                     </span>
//                     <span className="text-[11px] text-white/20">{contact.useCount} sessions</span>
//                   </div>
//                 </div>

//                 {/* Actions */}
//                 <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
//                   <button onClick={() => toggleFavourite(contact.id)} className={`p-1.5 rounded-lg transition-all ${contact.favourite ? 'text-amber-400 bg-amber-500/10' : 'text-white/25 hover:text-amber-400 hover:bg-amber-500/10'}`}>
//                     {contact.favourite ? <Star className="w-3.5 h-3.5 fill-amber-400" /> : <StarOff className="w-3.5 h-3.5" />}
//                   </button>
//                   <button onClick={() => startEdit(contact)} className="p-1.5 rounded-lg text-white/25 hover:text-white/70 hover:bg-white/10 transition-all">
//                     <Edit3 className="w-3.5 h-3.5" />
//                   </button>
//                   <button onClick={() => removeContact(contact.id)} className="p-1.5 rounded-lg text-white/25 hover:text-red-400 hover:bg-red-500/10 transition-all">
//                     <Trash2 className="w-3.5 h-3.5" />
//                   </button>
//                 </div>

//                 <button
//                   onClick={() => onConnect(contact.remoteId)}
//                   className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-xs font-semibold border border-indigo-500/20 transition-all ml-1"
//                 >
//                   Connect <ArrowRight className="w-3 h-3" />
//                 </button>
//               </div>
//             </div>
//           ))}
//         </div>
//       </main>
//     </div>
//   );
// }



import { useState, useEffect } from 'react';
import { favouritesApi, type Favourite } from '../services/api';
import {
  ChevronLeft, Book, Monitor, Star, Search, Plus,
  ArrowRight, Wifi, Trash2, Edit3, Check, X, Loader2, AlertCircle
} from 'lucide-react';

interface Props {
  onBack: () => void;
  onConnect: (id: string) => void;
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Never used';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return days < 7 ? `${days}d ago` : new Date(dateStr).toLocaleDateString();
}

export function AddressBookPage({ onBack, onConnect }: Props) {
  const [favourites, setFavourites] = useState<Favourite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRemoteId, setNewRemoteId] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    setError(null);
    favouritesApi.list()
      .then(setFavourites)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = favourites.filter(f =>
    (f.label ?? '').toLowerCase().includes(search.toLowerCase()) ||
    f.remote_id.includes(search)
  );

  const addContact = async () => {
    if (!newRemoteId.trim()) return;
    setSaving(true);
    try {
      await favouritesApi.upsert(newRemoteId.trim(), newLabel.trim() || undefined);
      setNewRemoteId('');
      setNewLabel('');
      setShowAddForm(false);
      load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const saveEdit = async (fav: Favourite) => {
    try {
      await favouritesApi.upsert(fav.remote_id, editLabel.trim() || undefined);
      setEditingId(null);
      load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const remove = async (fav: Favourite) => {
    try {
      await favouritesApi.delete(fav.id);
      setFavourites(fs => fs.filter(f => f.id !== fav.id));
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleConnect = (remoteId: string) => {
    favouritesApi.upsert(remoteId).catch(() => {});
    onConnect(remoteId);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white flex flex-col" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-black/40">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="flex items-center gap-1.5 text-white/40 hover:text-white/80 text-sm transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <div className="w-px h-5 bg-white/10" />
          <div className="flex items-center gap-2">
            <Book className="w-4 h-4 text-blue-400" />
            <span className="font-bold text-sm">Address Book</span>
            {!loading && <span className="text-[11px] text-white/25 font-mono ml-1">{favourites.length} saved</span>}
          </div>
        </div>
        <button onClick={() => setShowAddForm(v => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 text-xs font-semibold border border-indigo-500/20 transition-all">
          <Plus className="w-3.5 h-3.5" /> Add Contact
        </button>
      </header>

      <main className="flex-1 px-8 py-6 max-w-3xl mx-auto w-full">

        {showAddForm && (
          <div className="bg-[#111113] border border-indigo-500/20 rounded-xl p-4 mb-5">
            <p className="text-sm font-semibold mb-3 text-white/70">Add new contact</p>
            <div className="flex gap-3">
              <input placeholder="Remote ID (11 digits)" value={newRemoteId} onChange={e => setNewRemoteId(e.target.value.replace(/\s/g,''))} maxLength={11}
                className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/40" />
              <input placeholder="Label (optional)" value={newLabel} onChange={e => setNewLabel(e.target.value)}
                className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/40" />
              <button onClick={addContact} disabled={saving || !newRemoteId.trim()}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm font-semibold transition-all flex items-center gap-1.5">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null} Add
              </button>
              <button onClick={() => setShowAddForm(false)} className="p-2 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/10 transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <div className="relative mb-5">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by label or ID..."
            className="w-full bg-[#111113] border border-white/[0.07] rounded-xl pl-10 pr-4 py-3 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-indigo-500/40 transition-all" />
        </div>

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">
            <AlertCircle className="w-4 h-4 shrink-0" />{error}
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-16 gap-2 text-white/30">
            <Loader2 className="w-4 h-4 animate-spin" /><span className="text-sm">Loading...</span>
          </div>
        )}

        {!loading && !filtered.length && (
          <div className="flex flex-col items-center py-16 gap-2 text-white/20">
            <Book className="w-10 h-10 opacity-30" />
            <p className="text-sm">{search ? 'No contacts match your search' : 'No contacts yet'}</p>
            {!search && <p className="text-[11px]">Add a contact above to get started</p>}
          </div>
        )}

        <div className="flex flex-col gap-2">
          {filtered.map(fav => (
            <div key={fav.id} className="group bg-[#111113] hover:bg-[#161618] border border-white/[0.06] hover:border-white/[0.12] rounded-xl p-4 transition-all">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <Monitor className="w-5 h-5 text-white/25" />
                  </div>
                  {/* Favourites always have a star indicator */}
                  <Star className="absolute -top-1 -right-1 w-3 h-3 text-amber-400 fill-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  {editingId === fav.id ? (
                    <div className="flex items-center gap-2">
                      <input value={editLabel} onChange={e => setEditLabel(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') saveEdit(fav); if (e.key === 'Escape') setEditingId(null); }}
                        className="bg-black/50 border border-indigo-500/40 rounded-lg px-2 py-1 text-sm text-white focus:outline-none"
                        autoFocus />
                      <button onClick={() => saveEdit(fav)} className="p-1 text-emerald-400 hover:bg-emerald-500/10 rounded transition-all"><Check className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setEditingId(null)} className="p-1 text-white/30 hover:bg-white/10 rounded transition-all"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  ) : (
                    <p className="font-semibold text-sm text-white/80">
                      {fav.label || `${fav.remote_id.slice(0,3)} ${fav.remote_id.slice(3,6)} ${fav.remote_id.slice(6,9)} ${fav.remote_id.slice(9)}`}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="font-mono text-[11px] text-white/25">
                      {fav.remote_id.slice(0,3)} {fav.remote_id.slice(3,6)} {fav.remote_id.slice(6,9)} {fav.remote_id.slice(9)}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-white/25">
                      <Wifi className="w-3 h-3" />{timeAgo(fav.last_used_at)}
                    </span>
                    <span className="text-[11px] text-white/20">{fav.use_count} session{fav.use_count !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditingId(fav.id); setEditLabel(fav.label ?? ''); }}
                    className="p-1.5 rounded-lg text-white/25 hover:text-white/70 hover:bg-white/10 transition-all">
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => remove(fav)} className="p-1.5 rounded-lg text-white/25 hover:text-red-400 hover:bg-red-500/10 transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <button onClick={() => handleConnect(fav.remote_id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-xs font-semibold border border-indigo-500/20 transition-all ml-1">
                  Connect <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
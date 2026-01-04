import { useState, useEffect } from 'react';
import { Star, Plus, User, Phone, Trash2, X, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from './PhoneApp';

interface Favorite {
  id: string;
  name: string;
  phone: string;
}

interface FavoritesTabProps {
  onDial: (phoneNumber: string) => void;
}

const STORAGE_KEY = 'ads_phone_favorites';

export function FavoritesTab({ onDial }: FavoritesTabProps) {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setFavorites(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse favorites', e);
      }
    }
  }, []);

  const saveFavorites = (newFavs: Favorite[]) => {
    setFavorites(newFavs);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newFavs));
  };

  const handleAdd = () => {
    if (!newName || !newPhone) return;
    const newFav = {
      id: crypto.randomUUID(),
      name: newName,
      phone: newPhone.replace(/\D/g, ''),
    };
    saveFavorites([...favorites, newFav]);
    setNewName('');
    setNewPhone('');
    setIsAdding(false);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    saveFavorites(favorites.filter(f => f.id !== id));
  };

  return (
    <div className="flex flex-col h-full bg-black">
      {/* Header */}
      <div className="pt-12 pb-4 px-6 shrink-0 border-b border-white/5 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Favorites</h1>
        <button 
          onClick={() => setIsAdding(true)}
          className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-[#00ffff] hover:bg-zinc-700 transition-colors"
        >
          <Plus size={20} />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {favorites.map((fav) => (
            <motion.button
              layout
              key={fav.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              onClick={() => onDial(fav.phone)}
              className="w-full flex items-center px-6 py-4 border-b border-white/5 hover:bg-zinc-900 active:bg-zinc-800 transition-colors group"
            >
              <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center mr-4 group-hover:bg-[#0c2f4a] transition-colors">
                <User size={20} className="text-zinc-500 group-hover:text-[#00ffff]" />
              </div>
              
              <div className="flex-1 text-left">
                <p className="text-base font-semibold">{fav.name}</p>
                <p className="text-xs text-zinc-500 font-mono">
                  {fav.phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3')}
                </p>
              </div>
              
              <button 
                onClick={(e) => handleDelete(fav.id, e)}
                className="ml-4 opacity-0 group-hover:opacity-100 p-2 text-zinc-600 hover:text-red-500 transition-all"
              >
                <Trash2 size={18} />
              </button>
            </motion.button>
          ))}
        </AnimatePresence>

        {favorites.length === 0 && !isAdding && (
          <div className="flex flex-col items-center justify-center py-20 px-10 text-center">
            <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center mb-4">
              <Star size={32} className="text-zinc-700" />
            </div>
            <p className="text-zinc-500 font-medium mb-4">No favorites yet</p>
            <button 
              onClick={() => setIsAdding(true)}
              className="text-[#00ffff] text-sm font-bold flex items-center gap-2 hover:underline"
            >
              <Plus size={16} />
              Add Favorite
            </button>
          </div>
        )}
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="w-full bg-zinc-900 rounded-t-3xl p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">New Favorite</h2>
                <button onClick={() => setIsAdding(false)} className="text-zinc-500">
                  <X size={24} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest block mb-1">Name</label>
                  <input 
                    autoFocus
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full bg-zinc-800 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#00ffff]/50"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest block mb-1">Phone Number</label>
                  <input 
                    value={newPhone}
                    onChange={e => setNewPhone(e.target.value)}
                    placeholder="(704) 555-0123"
                    className="w-full bg-zinc-800 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#00ffff]/50"
                  />
                </div>
                
                <button
                  onClick={handleAdd}
                  disabled={!newName || !newPhone}
                  className="w-full bg-[#00ffff] text-black font-bold py-4 rounded-xl mt-4 disabled:opacity-50 transition-opacity shadow-[0_4px_20px_rgba(0,255,255,0.2)]"
                >
                  Save Favorite
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

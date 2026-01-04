import { useState, useEffect } from 'react';
import { Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed, Info } from 'lucide-react';
import { db, type Activity } from '../../lib/db';
import { motion, AnimatePresence } from 'framer-motion';

interface RecentsTabProps {
  onDial: (phoneNumber: string) => void;
}

export function RecentsTab({ onDial }: RecentsTabProps) {
  const [recents, setRecents] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRecents() {
      try {
        const calls = await db.activities
          .where('type')
          .equals('call')
          .toArray();
        
        // Sort by date desc
        const sorted = calls.sort((a, b) => {
          const aTime = new Date(a.createdAt).getTime();
          const bTime = new Date(b.createdAt).getTime();
          return bTime - aTime;
        });
        
        setRecents(sorted.slice(0, 50));
      } catch (err) {
        console.error('Failed to load recents:', err);
      } finally {
        setLoading(false);
      }
    }
    loadRecents();
  }, []);

  const formatTime = (date: Date | string) => {
    const d = new Date(date);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    
    if (isToday) {
      return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    }
    
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full bg-black">
      {/* Header */}
      <div className="pt-12 pb-4 px-6 shrink-0 border-b border-white/5">
        <h1 className="text-3xl font-bold">Recents</h1>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {recents.map((call) => (
            <motion.button
              layout
              key={call.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                // Try to find a phone number in metadata or content
                const phone = call.metadata?.phoneNumber || call.content?.match(/\d{10}/)?.[0];
                if (phone) onDial(phone);
              }}
              className="w-full flex items-center px-6 py-4 border-b border-white/5 hover:bg-zinc-900 active:bg-zinc-800 transition-colors group"
            >
              <div className="mr-4">
                {call.direction === 'inbound' ? (
                  <PhoneIncoming size={16} className="text-zinc-500" />
                ) : (
                  <PhoneOutgoing size={16} className="text-zinc-500" />
                )}
              </div>
              
              <div className="flex-1 text-left">
                <div className="flex items-baseline justify-between">
                  <span className="text-base font-semibold tracking-tight">
                    {call.metadata?.phoneNumber ? (
                       call.metadata.phoneNumber.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3')
                    ) : (
                       "Unknown Number"
                    )}
                  </span>
                  <span className="text-sm text-zinc-500 font-medium">
                    {formatTime(call.createdAt)}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-zinc-500">
                    {call.metadata?.disposition || 'Call'}
                  </span>
                  <span className="text-xs text-zinc-600">•</span>
                  <span className="text-xs text-zinc-500">
                    {formatDuration(call.metadata?.duration)}
                  </span>
                </div>
              </div>
              
              <div className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <Info size={20} className="text-[#00ffff]" />
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
        
        {!loading && recents.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 px-10 text-center">
            <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center mb-4">
              <Clock size={32} className="text-zinc-700" />
            </div>
            <p className="text-zinc-500 font-medium">No recent calls</p>
          </div>
        )}
      </div>
    </div>
  );
}

import { Clock } from 'lucide-react';

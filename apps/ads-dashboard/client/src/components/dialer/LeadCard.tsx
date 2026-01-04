import { motion } from 'framer-motion';
import { Phone, Mail, Building2, MapPin, Clock, User, Star, MessageSquare, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export interface Lead {
  id: string;
  name?: string;
  phone?: string;
  email?: string;
  company?: string;
  address?: string;
  city?: string;
  state?: string;
  lastContactDate?: string;
  lastDisposition?: string;
  // PropStream phone fields
  cell1?: string;
  cell2?: string;
  cell3?: string;
  cell4?: string;
  landline1?: string;
  landline2?: string;
  landline3?: string;
  landline4?: string;
  phone1?: string;
  phone2?: string;
  // Additional fields
  icpScore?: number;
  tcpaStatus?: string;
  email1?: string;
  email2?: string;
  email3?: string;
}

interface PhoneEntry {
  number: string;
  type: string;
  isCell: boolean;
}

function getAvailablePhones(lead: Lead): PhoneEntry[] {
  const phones: PhoneEntry[] = [];

  // Add primary phone first if it exists and isn't duplicated
  if (lead.phone) {
    phones.push({ number: lead.phone, type: 'Primary', isCell: true });
  }

  // Add all cell phones
  if (lead.cell1 && lead.cell1 !== lead.phone) phones.push({ number: lead.cell1, type: 'Cell 1', isCell: true });
  if (lead.cell2) phones.push({ number: lead.cell2, type: 'Cell 2', isCell: true });
  if (lead.cell3) phones.push({ number: lead.cell3, type: 'Cell 3', isCell: true });
  if (lead.cell4) phones.push({ number: lead.cell4, type: 'Cell 4', isCell: true });

  // Add landlines
  if (lead.landline1) phones.push({ number: lead.landline1, type: 'Landline 1', isCell: false });
  if (lead.landline2) phones.push({ number: lead.landline2, type: 'Landline 2', isCell: false });
  if (lead.landline3) phones.push({ number: lead.landline3, type: 'Landline 3', isCell: false });
  if (lead.landline4) phones.push({ number: lead.landline4, type: 'Landline 4', isCell: false });

  // Add generic phones
  if (lead.phone1) phones.push({ number: lead.phone1, type: 'Phone 1', isCell: true });
  if (lead.phone2) phones.push({ number: lead.phone2, type: 'Phone 2', isCell: true });

  return phones;
}

function getIcpColor(score: number | undefined): string {
  if (!score) return 'text-muted-foreground/30';
  if (score >= 80) return 'text-[#00ff88] border-[#00ff88]/40 bg-[#00ff88]/10'; // Hot
  if (score >= 60) return 'text-[#c9a648] border-[#c9a648]/40 bg-[#c9a648]/10'; // Warm
  if (score >= 40) return 'text-[#ff9900] border-[#ff9900]/40 bg-[#ff9900]/10'; // Cool
  return 'text-muted-foreground/50 border-white/10 bg-white/5'; // Cold
}

interface LeadCardProps {
  lead: Lead;
  isActive?: boolean;
  isPeek?: boolean;
  peekIndex?: number;
  isExpanded?: boolean;
  onTap?: () => void;
  showSwipeHint?: boolean;
  callStatus?: 'idle' | 'connecting' | 'connected';
  callDuration?: string;
  onDialPhone?: (phoneNumber: string) => void;
  onSmsPhone?: (phoneNumber: string) => void;
}

function formatPhone(phone: string | undefined): string {
  if (!phone) return 'No phone';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
}

function getInitials(name: string | undefined): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getTimeSince(dateStr: string | undefined): string {
  if (!dateStr) return 'Never contacted';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

export function LeadCard({
  lead,
  isActive = true,
  isPeek = false,
  peekIndex = 0,
  isExpanded = false,
  onTap,
  showSwipeHint = false,
  callStatus = 'idle',
  callDuration,
  onDialPhone,
  onSmsPhone,
}: LeadCardProps) {
  const isOnCall = callStatus === 'connecting' || callStatus === 'connected';
  const allPhones = getAvailablePhones(lead);
  
  // Peek card styling (cards behind the active one)
  const peekStyle = isPeek
    ? {
        scale: 1 - peekIndex * 0.05,
        y: peekIndex * 12,
        opacity: 1 - peekIndex * 0.25,
        zIndex: 10 - peekIndex,
      }
    : { scale: 1, y: 0, opacity: 1, zIndex: 10 };

  const icpClasses = getIcpColor(lead.icpScore);

  return (
    <motion.div
      layout
      initial={false}
      animate={peekStyle}
      whileTap={!isPeek && !isOnCall ? { scale: 0.98 } : undefined}
      onClick={!isPeek && onTap ? onTap : undefined}
      className={cn(
        "relative w-full max-w-[360px] mx-auto bg-[#0c2f4a]/60 backdrop-blur-sm rounded-2xl overflow-hidden transition-all duration-300",
        isPeek ? "absolute cursor-default" : "cursor-pointer",
        isExpanded ? "p-6 border-2 border-[#00ffff]/40" : "p-5 border border-[#00ffff]/20",
        isOnCall && "border-2 border-[#00ff88]/50 shadow-[0_8px_32px_rgba(0,255,136,0.2)]",
        !isOnCall && !isPeek && "shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:border-[#00ffff]/40"
      )}
    >
      {/* Call status overlay */}
      {isOnCall && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={cn(
            "absolute top-3 right-3 flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-md z-20",
            callStatus === 'connected' 
              ? "bg-[#00ff88]/20 border-[#00ff88]/40 text-[#00ff88]" 
              : "bg-[#0096ff]/20 border-[#0096ff]/40 text-[#0096ff]"
          )}
        >
          <motion.div
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className={cn(
              "w-2 h-2 rounded-full",
              callStatus === 'connected' ? "bg-[#00ff88]" : "bg-[#0096ff]"
            )}
          />
          <span className="text-xs font-mono font-bold">
            {callStatus === 'connected' ? callDuration || '00:00' : 'Connecting...'}
          </span>
        </motion.div>
      )}

      {/* Header Content */}
      <div className="flex flex-col items-center mb-4">
        {/* Avatar */}
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#0c2f4a] to-[#1a4a6e] border-2 border-[#c9a648]/40 flex items-center justify-center mb-3 shadow-lg">
          <span className="text-xl font-bold font-mono text-[#c9a648]">
            {getInitials(lead.name)}
          </span>
        </div>

        {/* Name + ICP Badge */}
        <div className="flex items-center gap-2 justify-center w-full px-2">
          <h3 className="text-xl font-bold text-[#f7f5f2] text-center truncate">
            {lead.name || 'Unknown Lead'}
          </h3>
          {lead.icpScore !== undefined && lead.icpScore > 0 && (
            <div className={cn("flex items-center gap-1 px-2 py-0.5 rounded-xl border text-xs font-bold font-mono", icpClasses)}>
              <Star size={10} className="fill-current" />
              <span>{lead.icpScore}</span>
            </div>
          )}
        </div>

        {/* TCPA Warning */}
        {lead.tcpaStatus && (lead.tcpaStatus === 'DANGEROUS' || lead.tcpaStatus === 'DNC') && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 mt-1.5 rounded-lg bg-red-500/20 border border-red-500/40">
            <AlertTriangle size={12} className="text-red-400" />
            <span className="text-[11px] font-semibold text-red-400">
              {lead.tcpaStatus === 'DNC' ? 'Do Not Call' : 'TCPA Risk'}
            </span>
          </div>
        )}

        {/* Primary Phone */}
        <div className="flex items-center gap-2 mt-2">
          <Phone size={16} className="text-[#00ffff]" />
          <span className="text-lg font-semibold font-mono text-[#00ffff] tracking-wide">
            {formatPhone(lead.phone)}
          </span>
        </div>
      </div>

      {/* Expanded details */}
      <motion.div
        initial={false}
        animate={{
          height: isExpanded ? 'auto' : 0,
          opacity: isExpanded ? 1 : 0,
        }}
        className="overflow-hidden"
      >
        <div className="flex flex-col gap-3 pt-4 border-t border-white/10">
          
          {/* All Phone Numbers */}
          {allPhones.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2">
                All Phone Numbers ({allPhones.length})
              </p>
              <div className="flex flex-col gap-2">
                {allPhones.map((phoneEntry, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2.5 bg-black/20 rounded-lg border border-white/10 hover:border-white/20 transition-colors"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] text-white/50 uppercase">
                        {phoneEntry.type}
                      </span>
                      <span className="text-sm font-mono text-[#00ffff]">
                        {formatPhone(phoneEntry.number)}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {/* Dial Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDialPhone?.(phoneEntry.number);
                        }}
                        disabled={isOnCall}
                        className={cn(
                          "w-9 h-9 rounded-full flex items-center justify-center transition-all",
                          isOnCall 
                            ? "bg-white/10 cursor-not-allowed opacity-50" 
                            : "bg-gradient-to-br from-[#00ff88] to-[#00cc6a] hover:brightness-110 shadow-lg"
                        )}
                      >
                        <Phone size={16} className={isOnCall ? "text-white/30" : "text-[#0c2f4a]"} />
                      </button>
                      
                      {/* SMS Button - only for cell phones */}
                      {phoneEntry.isCell && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSmsPhone?.(phoneEntry.number);
                          }}
                          className="w-9 h-9 rounded-full bg-[#0096ff]/20 border border-[#0096ff]/40 flex items-center justify-center hover:bg-[#0096ff]/30 transition-colors"
                        >
                          <MessageSquare size={16} className="text-[#0096ff]" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Details List */}
          <div className="space-y-2 mt-1">
            {(lead.email || lead.email1) && (
              <div className="flex items-center gap-2.5 text-white/70">
                <Mail size={14} className="text-white/40 shrink-0" />
                <span className="text-sm truncate">{lead.email || lead.email1}</span>
              </div>
            )}

            {lead.company && (
              <div className="flex items-center gap-2.5 text-white/70">
                <Building2 size={14} className="text-white/40 shrink-0" />
                <span className="text-sm truncate">{lead.company}</span>
              </div>
            )}

            {(lead.address || lead.city) && (
              <div className="flex items-center gap-2.5 text-white/70">
                <MapPin size={14} className="text-white/40 shrink-0" />
                <span className="text-sm truncate">
                  {[lead.address, lead.city, lead.state].filter(Boolean).join(', ')}
                </span>
              </div>
            )}

            {lead.lastContactDate && (
              <div className="flex items-center gap-2.5 text-white/70">
                <Clock size={14} className="text-white/40 shrink-0" />
                <span className="text-sm">
                  Last contact: {getTimeSince(lead.lastContactDate)}
                </span>
              </div>
            )}

            {lead.lastDisposition && (
              <div className="flex items-center gap-2.5 text-white/70">
                <User size={14} className="text-white/40 shrink-0" />
                <span className="text-sm">
                  Previous: {lead.lastDisposition}
                </span>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Swipe hint */}
      {showSwipeHint && !isExpanded && !isOnCall && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-center mt-4 text-xs font-mono text-white/40 tracking-wider"
        >
          ← SWIPE TO SKIP →
        </motion.div>
      )}

      {/* Tap hint when not expanded */}
      {!isExpanded && !isOnCall && !showSwipeHint && (
        <div className="text-center mt-3 text-[11px] text-white/30">
          Tap to view details
        </div>
      )}
    </motion.div>
  );
}
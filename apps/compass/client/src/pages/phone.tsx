import { useState, useEffect } from 'react';
import { Phone, MessageSquare, Mail, Delete, ChevronLeft, Users, Hash, User, Building, MapPin } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';

// Helper to format phone display
function formatPhoneDisplay(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 0) return '';
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  return `+${digits.slice(0, 1)} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 11)}`;
}

// Format for tel: link
function formatForTel(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return `+${digits}`;
}

// Lead type - will come from Twenty CRM
interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  company?: string;
  address?: string;
}

export default function PhonePage() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<'keypad' | 'leads'>('keypad');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showMessages, setShowMessages] = useState(false);
  const [messageType, setMessageType] = useState<'sms' | 'email'>('sms');
  const [messageBody, setMessageBody] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leads] = useState<Lead[]>([]); // Will be fetched from Twenty CRM

  // Check for phone number in URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const number = params.get('number');
    if (number) {
      setPhoneNumber(number.replace(/\D/g, ''));
    }
  }, []);

  const handleDigit = (digit: string) => {
    if (phoneNumber.length < 15) {
      setPhoneNumber(prev => prev + digit);
    }
  };

  const handleBackspace = () => {
    setPhoneNumber(prev => prev.slice(0, -1));
  };

  const handleCall = (number?: string) => {
    const numToCall = number || phoneNumber;
    if (numToCall.length >= 10) {
      const telUrl = `tel:${formatForTel(numToCall)}`;
      window.open(telUrl, '_self');
      saveToRecent(numToCall);
    }
  };

  const handleSms = (number?: string) => {
    const numToSms = number || phoneNumber;
    if (numToSms.length >= 10) {
      const body = encodeURIComponent(messageBody);
      const smsUrl = messageBody
        ? `sms:${formatForTel(numToSms)}?body=${body}`
        : `sms:${formatForTel(numToSms)}`;
      window.open(smsUrl, '_self');
    }
  };

  const handleEmail = (emailAddr?: string) => {
    const addr = emailAddr || email;
    if (addr) {
      const params = new URLSearchParams();
      if (subject) params.set('subject', subject);
      if (messageBody) params.set('body', messageBody);
      const mailtoUrl = `mailto:${addr}?${params.toString()}`;
      window.open(mailtoUrl, '_self');
    }
  };

  const handleSelectLead = (lead: Lead) => {
    setSelectedLead(lead);
    setPhoneNumber(lead.phone);
    if (lead.email) setEmail(lead.email);
    setActiveTab('keypad');
  };

  const saveToRecent = (number: string) => {
    try {
      const recent = JSON.parse(localStorage.getItem('compass_recent_calls') || '[]');
      const updated = [number, ...recent.filter((n: string) => n !== number)].slice(0, 10);
      localStorage.setItem('compass_recent_calls', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save recent call:', e);
    }
  };

  // Keypad button component
  const KeypadButton = ({ value, onClick }: { value: string; onClick: () => void }) => (
    <button
      onClick={onClick}
      className="w-16 h-16 rounded-full bg-zinc-800 hover:bg-zinc-700 text-xl font-light
                 flex items-center justify-center active:bg-zinc-600 transition-colors"
    >
      {value}
    </button>
  );

  return (
    <div className="h-full flex flex-col bg-background text-foreground overflow-hidden">
      {/* Tab Bar */}
      <div className="flex border-b border-border shrink-0">
        <button
          onClick={() => setActiveTab('keypad')}
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors
                     ${activeTab === 'keypad' ? 'text-orange-500 border-b-2 border-orange-500' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Hash className="w-4 h-4" />
          Keypad
        </button>
        <button
          onClick={() => setActiveTab('leads')}
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors
                     ${activeTab === 'leads' ? 'text-orange-500 border-b-2 border-orange-500' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Users className="w-4 h-4" />
          My Leads
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'keypad' ? (
          /* Keypad Tab */
          <div className="h-full flex flex-col">
            {/* Selected Lead Banner */}
            {selectedLead && (
              <div className="px-4 py-2 bg-orange-500/10 border-b border-orange-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-medium">{selectedLead.name}</span>
                </div>
                <button
                  onClick={() => { setSelectedLead(null); setPhoneNumber(''); setEmail(''); }}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
              </div>
            )}

            {/* Number Display */}
            <div className="py-4 px-4 text-center shrink-0">
              <div className="text-2xl font-light tracking-wider font-mono">
                {formatPhoneDisplay(phoneNumber) || (
                  <span className="text-muted-foreground">Enter number</span>
                )}
              </div>
            </div>

            {/* Keypad */}
            <div className="flex-1 flex flex-col items-center justify-center gap-3 pb-4">
              <div className="flex gap-4">
                <KeypadButton value="1" onClick={() => handleDigit('1')} />
                <KeypadButton value="2" onClick={() => handleDigit('2')} />
                <KeypadButton value="3" onClick={() => handleDigit('3')} />
              </div>
              <div className="flex gap-4">
                <KeypadButton value="4" onClick={() => handleDigit('4')} />
                <KeypadButton value="5" onClick={() => handleDigit('5')} />
                <KeypadButton value="6" onClick={() => handleDigit('6')} />
              </div>
              <div className="flex gap-4">
                <KeypadButton value="7" onClick={() => handleDigit('7')} />
                <KeypadButton value="8" onClick={() => handleDigit('8')} />
                <KeypadButton value="9" onClick={() => handleDigit('9')} />
              </div>
              <div className="flex gap-4">
                <KeypadButton value="*" onClick={() => handleDigit('*')} />
                <KeypadButton value="0" onClick={() => handleDigit('0')} />
                <KeypadButton value="#" onClick={() => handleDigit('#')} />
              </div>

              {/* Call Button */}
              <div className="mt-2">
                <button
                  onClick={() => handleCall()}
                  disabled={phoneNumber.length < 10}
                  className="w-14 h-14 rounded-full bg-green-600 hover:bg-green-500
                           disabled:bg-muted disabled:opacity-50
                           flex items-center justify-center transition-all active:scale-95"
                >
                  <Phone className="w-6 h-6 text-white" fill="white" />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-8 mt-2">
                <button
                  onClick={() => { setMessageType('sms'); setShowMessages(true); }}
                  disabled={phoneNumber.length < 10}
                  className="flex flex-col items-center gap-1 disabled:opacity-30 transition-opacity"
                >
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-blue-400" />
                  </div>
                  <span className="text-[9px] uppercase text-muted-foreground">SMS</span>
                </button>

                <button
                  onClick={handleBackspace}
                  disabled={phoneNumber.length === 0}
                  className="flex flex-col items-center gap-1 disabled:opacity-30 transition-opacity"
                >
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <Delete className="w-4 h-4" />
                  </div>
                </button>

                <button
                  onClick={() => { setMessageType('email'); setShowMessages(true); }}
                  disabled={!email && !selectedLead?.email}
                  className="flex flex-col items-center gap-1 disabled:opacity-30 transition-opacity"
                >
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <Mail className="w-4 h-4 text-orange-400" />
                  </div>
                  <span className="text-[9px] uppercase text-muted-foreground">Email</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Leads Tab */
          <div className="h-full flex flex-col">
            {/* Info Banner */}
            <div className="px-4 py-3 bg-muted/50 border-b border-border">
              <p className="text-xs text-muted-foreground text-center">
                Twenty CRM integration coming soon
              </p>
            </div>

            {/* Leads List */}
            <div className="flex-1 overflow-y-auto">
              {leads.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-8">
                  <Users className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">No Leads Assigned</h3>
                  <p className="text-sm text-muted-foreground">
                    Connect to Twenty CRM to see leads assigned to you.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {leads.map((lead) => (
                    <button
                      key={lead.id}
                      onClick={() => handleSelectLead(lead)}
                      className="w-full px-4 py-3 flex items-start gap-3 hover:bg-muted/50 transition-colors text-left"
                    >
                      <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0">
                        <User className="w-5 h-5 text-orange-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{lead.name}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {formatPhoneDisplay(lead.phone)}
                        </div>
                        {lead.company && (
                          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <Building className="w-3 h-3" />
                            {lead.company}
                          </div>
                        )}
                        {lead.address && (
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {lead.address}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleCall(lead.phone); }}
                          className="w-8 h-8 rounded-full bg-green-600 hover:bg-green-500 flex items-center justify-center"
                        >
                          <Phone className="w-4 h-4 text-white" fill="white" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleSms(lead.phone); }}
                          className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center"
                        >
                          <MessageSquare className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Messages Overlay */}
      <AnimatePresence>
        {showMessages && (
          <div className="fixed inset-0 bg-background z-50 flex flex-col">
            <div className="h-14 flex items-center border-b border-border px-2 shrink-0">
              <button
                onClick={() => setShowMessages(false)}
                className="p-2 rounded-full hover:bg-muted"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <span className="flex-1 text-center font-bold text-sm uppercase tracking-widest">
                {messageType === 'sms' ? 'Send SMS' : 'Send Email'}
              </span>
              <div className="w-10" />
            </div>

            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
              {messageType === 'sms' ? (
                <>
                  <div>
                    <label className="text-xs uppercase font-bold text-muted-foreground mb-1 block">To</label>
                    <input
                      value={formatPhoneDisplay(phoneNumber)}
                      readOnly
                      className="w-full p-3 bg-muted rounded-lg border border-border font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase font-bold text-muted-foreground mb-1 block">Message</label>
                    <textarea
                      value={messageBody}
                      onChange={(e) => setMessageBody(e.target.value)}
                      placeholder="Type your message..."
                      rows={4}
                      className="w-full p-3 bg-muted rounded-lg border border-border focus:border-orange-500/50 outline-none resize-none"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="text-xs uppercase font-bold text-muted-foreground mb-1 block">To (Email)</label>
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@example.com"
                      type="email"
                      className="w-full p-3 bg-muted rounded-lg border border-border focus:border-orange-500/50 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase font-bold text-muted-foreground mb-1 block">Subject</label>
                    <input
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Subject line"
                      className="w-full p-3 bg-muted rounded-lg border border-border focus:border-orange-500/50 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase font-bold text-muted-foreground mb-1 block">Message</label>
                    <textarea
                      value={messageBody}
                      onChange={(e) => setMessageBody(e.target.value)}
                      placeholder="Type your message..."
                      rows={4}
                      className="w-full p-3 bg-muted rounded-lg border border-border focus:border-orange-500/50 outline-none resize-none"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="p-4 border-t border-border shrink-0">
              <button
                onClick={() => messageType === 'sms' ? handleSms() : handleEmail()}
                disabled={messageType === 'sms' ? phoneNumber.length < 10 : !email}
                className="w-full p-4 bg-orange-500 hover:bg-orange-400 rounded-xl font-bold uppercase tracking-wider
                         disabled:bg-muted disabled:text-muted-foreground transition-all active:scale-[0.98]"
              >
                {messageType === 'sms' ? 'Open Messages' : 'Open Mail'}
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

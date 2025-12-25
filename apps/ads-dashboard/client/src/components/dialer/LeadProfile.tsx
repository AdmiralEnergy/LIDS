import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLiveQuery } from 'dexie-react-hooks';
import { useCreate, useList } from '@refinedev/core';
import {
  X, Phone, MessageSquare, Mail, MapPin, Star, AlertTriangle,
  User, Clock, Plus, Send, FileText, ChevronRight, Building2
} from 'lucide-react';
import { db, Activity } from '../../lib/db';
import type { Lead } from './LeadCard';

interface PhoneEntry {
  number: string;
  type: string;
  isCell: boolean;
}

interface TwentyNote {
  id: string;
  title?: string;
  body?: string;
  createdAt?: string;
}

interface LeadProfileProps {
  lead: Lead;
  visible: boolean;
  onClose: () => void;
  onDialPhone?: (phoneNumber: string) => void;
  onSmsPhone?: (phoneNumber: string) => void;
  onEmailLead?: (email: string) => void;
}

function getAvailablePhones(lead: Lead): PhoneEntry[] {
  const phones: PhoneEntry[] = [];

  if (lead.phone) {
    phones.push({ number: lead.phone, type: 'Primary', isCell: true });
  }

  if (lead.cell1 && lead.cell1 !== lead.phone) phones.push({ number: lead.cell1, type: 'Cell 1', isCell: true });
  if (lead.cell2) phones.push({ number: lead.cell2, type: 'Cell 2', isCell: true });
  if (lead.cell3) phones.push({ number: lead.cell3, type: 'Cell 3', isCell: true });
  if (lead.cell4) phones.push({ number: lead.cell4, type: 'Cell 4', isCell: true });

  if (lead.landline1) phones.push({ number: lead.landline1, type: 'Landline 1', isCell: false });
  if (lead.landline2) phones.push({ number: lead.landline2, type: 'Landline 2', isCell: false });
  if (lead.landline3) phones.push({ number: lead.landline3, type: 'Landline 3', isCell: false });
  if (lead.landline4) phones.push({ number: lead.landline4, type: 'Landline 4', isCell: false });

  if (lead.phone1) phones.push({ number: lead.phone1, type: 'Phone 1', isCell: true });
  if (lead.phone2) phones.push({ number: lead.phone2, type: 'Phone 2', isCell: true });

  return phones;
}

function getAvailableEmails(lead: Lead): string[] {
  const emails: string[] = [];
  if (lead.email) emails.push(lead.email);
  if (lead.email1 && lead.email1 !== lead.email) emails.push(lead.email1);
  if (lead.email2) emails.push(lead.email2);
  if (lead.email3) emails.push(lead.email3);
  return emails;
}

function formatPhone(phone: string | undefined): string {
  if (!phone) return 'No phone';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  if (cleaned.length === 11 && cleaned[0] === '1') {
    return `(${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function getIcpColor(score: number | undefined): string {
  if (!score) return 'rgba(255, 255, 255, 0.3)';
  if (score >= 80) return '#00ff88';
  if (score >= 60) return '#c9a648';
  if (score >= 40) return '#ff9900';
  return 'rgba(255, 255, 255, 0.5)';
}

function getDispositionColor(disposition: string): string {
  const lower = disposition.toLowerCase();
  if (lower.includes('contact') || lower.includes('callback')) return '#00ff88';
  if (lower.includes('no_answer') || lower.includes('voicemail')) return '#ff9900';
  if (lower.includes('not_interested') || lower.includes('dnc')) return '#ff4444';
  return 'rgba(255, 255, 255, 0.5)';
}

export function LeadProfile({
  lead,
  visible,
  onClose,
  onDialPhone,
  onSmsPhone,
  onEmailLead,
}: LeadProfileProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'notes' | 'history'>('info');
  const [newNote, setNewNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  const allPhones = getAvailablePhones(lead);
  const allEmails = getAvailableEmails(lead);

  // Fetch call history from Dexie
  const callHistory = useLiveQuery(
    async () => {
      if (!lead?.id) return [];
      return db.activities
        .where('leadId')
        .equals(lead.id)
        .reverse()
        .limit(20)
        .toArray();
    },
    [lead?.id],
    []
  );

  // Fetch notes from Twenty CRM
  const notesResult = useList<TwentyNote>({
    resource: 'notes',
    pagination: { pageSize: 100 },
  });
  const refetchNotes = notesResult.query?.refetch;

  // Filter notes for this lead
  const leadNotes = (notesResult.result?.data || []).filter((note: any) => {
    return note.person?.id === lead.id;
  });

  // Create note mutation
  const createNoteMutation = useCreate();
  const createNote = createNoteMutation.mutate;
  const isCreatingNote = createNoteMutation.mutation?.isPending ?? false;

  const handleAddNote = useCallback(async () => {
    if (!newNote.trim() || !lead?.id) return;

    setIsAddingNote(true);
    try {
      await createNote({
        resource: 'notes',
        values: {
          title: `Note - ${new Date().toLocaleDateString()}`,
          body: newNote.trim(),
          personId: lead.id,
        },
      });
      setNewNote('');
      refetchNotes();
    } catch (error) {
      console.error('Failed to add note:', error);
    } finally {
      setIsAddingNote(false);
    }
  }, [newNote, lead?.id, createNote, refetchNotes]);

  // Build address string
  const addressParts = [lead.address, lead.city, lead.state].filter(Boolean);
  const fullAddress = addressParts.join(', ');

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 400 }}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, #0c2f4a 0%, #061a2e 100%)',
            zIndex: 90,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #0c2f4a 0%, #1a4a6e 100%)',
                  border: '2px solid rgba(201, 166, 72, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <User size={24} color="#c9a648" />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#f7f5f2' }}>
                  {lead.name || 'Unknown Lead'}
                </h2>
                {lead.icpScore !== undefined && lead.icpScore > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                    <Star size={12} color={getIcpColor(lead.icpScore)} fill={lead.icpScore >= 80 ? getIcpColor(lead.icpScore) : 'none'} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: getIcpColor(lead.icpScore) }}>
                      ICP: {lead.icpScore}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'rgba(255, 255, 255, 0.6)',
              }}
            >
              <X size={22} />
            </button>
          </div>

          {/* TCPA Warning */}
          {lead.tcpaStatus && (lead.tcpaStatus === 'DANGEROUS' || lead.tcpaStatus === 'DNC') && (
            <div
              style={{
                margin: '12px 20px 0',
                padding: '10px 14px',
                background: 'rgba(255, 68, 68, 0.15)',
                border: '1px solid rgba(255, 68, 68, 0.4)',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <AlertTriangle size={18} color="#ff4444" />
              <span style={{ fontSize: 13, color: '#ff4444', fontWeight: 500 }}>
                {lead.tcpaStatus === 'DNC' ? 'Do Not Call - Lead is on DNC list' : 'TCPA Risk - Proceed with caution'}
              </span>
            </div>
          )}

          {/* Tab Navigation */}
          <div
            style={{
              display: 'flex',
              gap: 0,
              margin: '16px 20px 0',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            {(['info', 'notes', 'history'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: activeTab === tab ? '2px solid #c9a648' : '2px solid transparent',
                  cursor: 'pointer',
                  color: activeTab === tab ? '#c9a648' : 'rgba(255, 255, 255, 0.5)',
                  fontSize: 13,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  transition: 'all 0.2s ease',
                }}
              >
                {tab === 'info' && 'Info'}
                {tab === 'notes' && `Notes (${leadNotes.length})`}
                {tab === 'history' && `History (${callHistory?.length || 0})`}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
            {/* Info Tab */}
            {activeTab === 'info' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Phone Numbers */}
                {allPhones.length > 0 && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <Phone size={16} color="#0096ff" />
                      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#0096ff' }}>
                        Phone Numbers ({allPhones.length})
                      </h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {allPhones.map((phoneEntry, index) => (
                        <div
                          key={index}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px 14px',
                            background: 'rgba(0, 150, 255, 0.1)',
                            border: '1px solid rgba(0, 150, 255, 0.2)',
                            borderRadius: 10,
                          }}
                        >
                          <div>
                            <span
                              style={{
                                display: 'block',
                                fontSize: 10,
                                color: 'rgba(255, 255, 255, 0.5)',
                                textTransform: 'uppercase',
                                marginBottom: 2,
                              }}
                            >
                              {phoneEntry.type}
                            </span>
                            <span
                              style={{
                                fontSize: 15,
                                color: '#00ffff',
                                fontFamily: 'var(--font-mono)',
                              }}
                            >
                              {formatPhone(phoneEntry.number)}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              onClick={() => onDialPhone?.(phoneEntry.number)}
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)',
                                border: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                              }}
                            >
                              <Phone size={18} color="#0c2f4a" />
                            </button>
                            {phoneEntry.isCell && (
                              <button
                                onClick={() => onSmsPhone?.(phoneEntry.number)}
                                style={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: '50%',
                                  background: 'rgba(0, 150, 255, 0.2)',
                                  border: '1px solid rgba(0, 150, 255, 0.4)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                }}
                              >
                                <MessageSquare size={18} color="#0096ff" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Email Addresses */}
                {allEmails.length > 0 && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <Mail size={16} color="#c9a648" />
                      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#c9a648' }}>
                        Email Addresses
                      </h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {allEmails.map((email, index) => (
                        <div
                          key={index}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px 14px',
                            background: 'rgba(201, 166, 72, 0.1)',
                            border: '1px solid rgba(201, 166, 72, 0.2)',
                            borderRadius: 10,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 14,
                              color: '#f7f5f2',
                            }}
                          >
                            {email}
                          </span>
                          <button
                            onClick={() => onEmailLead?.(email)}
                            style={{
                              padding: '8px 14px',
                              background: 'rgba(201, 166, 72, 0.2)',
                              border: '1px solid rgba(201, 166, 72, 0.4)',
                              borderRadius: 20,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              cursor: 'pointer',
                              color: '#c9a648',
                              fontSize: 13,
                              fontWeight: 500,
                            }}
                          >
                            <Mail size={14} />
                            Compose
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Address */}
                {fullAddress && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <MapPin size={16} color="rgba(255, 255, 255, 0.5)" />
                      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'rgba(255, 255, 255, 0.5)' }}>
                        Location
                      </h3>
                    </div>
                    <div
                      style={{
                        padding: '12px 14px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: 10,
                      }}
                    >
                      <p style={{ margin: 0, fontSize: 14, color: '#f7f5f2' }}>
                        {fullAddress}
                      </p>
                    </div>
                  </div>
                )}

                {/* Company */}
                {lead.company && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <Building2 size={16} color="rgba(255, 255, 255, 0.5)" />
                      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'rgba(255, 255, 255, 0.5)' }}>
                        Company
                      </h3>
                    </div>
                    <div
                      style={{
                        padding: '12px 14px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: 10,
                      }}
                    >
                      <p style={{ margin: 0, fontSize: 14, color: '#f7f5f2' }}>
                        {lead.company}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Notes Tab */}
            {activeTab === 'notes' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Add Note Input */}
                <div
                  style={{
                    display: 'flex',
                    gap: 10,
                    padding: '12px',
                    background: 'rgba(201, 166, 72, 0.1)',
                    border: '1px solid rgba(201, 166, 72, 0.3)',
                    borderRadius: 12,
                  }}
                >
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add a note..."
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: 8,
                      color: '#f7f5f2',
                      fontSize: 14,
                      outline: 'none',
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newNote.trim()) {
                        handleAddNote();
                      }
                    }}
                  />
                  <button
                    onClick={handleAddNote}
                    disabled={!newNote.trim() || isCreatingNote || isAddingNote}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      background: newNote.trim()
                        ? 'linear-gradient(135deg, #c9a648 0%, #a68a3a 100%)'
                        : 'rgba(255, 255, 255, 0.1)',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: newNote.trim() ? 'pointer' : 'not-allowed',
                    }}
                  >
                    {isCreatingNote || isAddingNote ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      >
                        <Clock size={18} color="#0c2f4a" />
                      </motion.div>
                    ) : (
                      <Send size={18} color={newNote.trim() ? '#0c2f4a' : 'rgba(255,255,255,0.3)'} />
                    )}
                  </button>
                </div>

                {/* Notes List */}
                {leadNotes.length === 0 ? (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: 40,
                      color: 'rgba(255, 255, 255, 0.4)',
                    }}
                  >
                    <FileText size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
                    <p style={{ margin: 0 }}>No notes yet</p>
                    <p style={{ margin: '4px 0 0', fontSize: 12 }}>Add your first note above</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {leadNotes.map((note: TwentyNote) => (
                      <div
                        key={note.id}
                        style={{
                          padding: '14px 16px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: 12,
                        }}
                      >
                        <p style={{ margin: 0, fontSize: 14, color: '#f7f5f2', lineHeight: 1.5 }}>
                          {note.body || note.title}
                        </p>
                        <p
                          style={{
                            margin: '8px 0 0',
                            fontSize: 11,
                            color: 'rgba(255, 255, 255, 0.4)',
                          }}
                        >
                          {note.createdAt ? formatRelativeTime(new Date(note.createdAt)) : 'Unknown date'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {(!callHistory || callHistory.length === 0) ? (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: 40,
                      color: 'rgba(255, 255, 255, 0.4)',
                    }}
                  >
                    <Clock size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
                    <p style={{ margin: 0 }}>No call history</p>
                    <p style={{ margin: '4px 0 0', fontSize: 12 }}>Calls will appear here after you dial</p>
                  </div>
                ) : (
                  callHistory.map((activity: Activity) => (
                    <div
                      key={activity.id}
                      style={{
                        padding: '14px 16px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: 12,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            background: activity.type === 'call'
                              ? 'rgba(0, 255, 136, 0.15)'
                              : activity.type === 'sms'
                                ? 'rgba(0, 150, 255, 0.15)'
                                : 'rgba(255, 255, 255, 0.1)',
                            border: `1px solid ${activity.type === 'call'
                              ? 'rgba(0, 255, 136, 0.4)'
                              : activity.type === 'sms'
                                ? 'rgba(0, 150, 255, 0.4)'
                                : 'rgba(255, 255, 255, 0.2)'
                              }`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {activity.type === 'call' && <Phone size={16} color="#00ff88" />}
                          {activity.type === 'sms' && <MessageSquare size={16} color="#0096ff" />}
                          {activity.type === 'email' && <Mail size={16} color="#c9a648" />}
                          {activity.type === 'note' && <FileText size={16} color="rgba(255,255,255,0.5)" />}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span
                              style={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: '#f7f5f2',
                                textTransform: 'capitalize',
                              }}
                            >
                              {activity.type === 'call' ? (
                                activity.metadata?.disposition || 'Call'
                              ) : (
                                activity.type
                              )}
                            </span>
                            {activity.metadata?.disposition && (
                              <span
                                style={{
                                  fontSize: 10,
                                  padding: '2px 6px',
                                  borderRadius: 4,
                                  background: `${getDispositionColor(activity.metadata.disposition)}22`,
                                  color: getDispositionColor(activity.metadata.disposition),
                                  fontWeight: 600,
                                }}
                              >
                                {activity.metadata.disposition.replace(/_/g, ' ')}
                              </span>
                            )}
                          </div>
                          {activity.content && (
                            <p
                              style={{
                                margin: '4px 0 0',
                                fontSize: 12,
                                color: 'rgba(255, 255, 255, 0.5)',
                                maxWidth: 200,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {activity.content}
                            </p>
                          )}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        {activity.metadata?.duration !== undefined && (
                          <span
                            style={{
                              display: 'block',
                              fontSize: 13,
                              fontFamily: 'var(--font-mono)',
                              color: '#00ffff',
                            }}
                          >
                            {formatDuration(activity.metadata.duration)}
                          </span>
                        )}
                        <span
                          style={{
                            fontSize: 11,
                            color: 'rgba(255, 255, 255, 0.4)',
                          }}
                        >
                          {formatRelativeTime(new Date(activity.createdAt))}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Admiral Chat - New DM Modal
// Modal for starting a new direct message

import React, { useState, useMemo } from 'react';
import { Search, X, User } from 'lucide-react';
import type { WorkspaceMember } from '../types';

export interface NewDMModalProps {
  members: WorkspaceMember[];
  onSelect: (memberId: string) => void;
  onClose: () => void;
}

export function NewDMModal({ members, onSelect, onClose }: NewDMModalProps) {
  const [search, setSearch] = useState('');

  const filteredMembers = useMemo(() => {
    const query = search.toLowerCase();
    return members.filter(
      m =>
        m.name.toLowerCase().includes(query) ||
        m.email.toLowerCase().includes(query)
    );
  }, [members, search]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-gray-900 rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">New Message</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search team members..."
              className="w-full bg-gray-800 text-white rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#c9a648] placeholder-gray-500"
              autoFocus
            />
          </div>
        </div>

        {/* Member list */}
        <div className="max-h-64 overflow-y-auto px-2 pb-4">
          {filteredMembers.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No members found</p>
          ) : (
            filteredMembers.map(member => (
              <button
                key={member.id}
                onClick={() => onSelect(member.id)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-800 text-left transition-colors"
              >
                {member.avatarUrl ? (
                  <img
                    src={member.avatarUrl}
                    alt={member.name}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#c9a648]/20 flex items-center justify-center">
                    <User className="w-4 h-4 text-[#c9a648]" />
                  </div>
                )}
                <div>
                  <p className="text-white font-medium">{member.name}</p>
                  <p className="text-xs text-gray-400">{member.email}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default NewDMModal;

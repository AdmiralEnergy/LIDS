import { Shield } from 'lucide-react';
import { RANKS, RANK_COLORS } from '../config/ranks';
import type { Rank } from '../types';

interface RankBadgeProps {
  rank: Rank;
  showName?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function RankBadge({ rank, showName = true, size = 'md' }: RankBadgeProps) {
  const rankInfo = RANKS.find(r => r.id === rank) || RANKS[0];
  const colorClass = RANK_COLORS[rank] || RANK_COLORS.sdr_1;
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-3 py-1 text-sm gap-1.5',
    lg: 'px-4 py-1.5 text-base gap-2',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <div 
      className={`inline-flex items-center rounded-md font-semibold ${colorClass} ${sizeClasses[size]}`}
      data-testid={`badge-rank-${rank}`}
    >
      <Shield className={iconSizes[size]} />
      <span>{rankInfo.code}</span>
      {showName && <span className="hidden sm:inline">- {rankInfo.name}</span>}
    </div>
  );
}

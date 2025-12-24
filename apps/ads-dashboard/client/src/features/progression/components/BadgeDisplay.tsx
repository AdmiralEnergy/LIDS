import { Tooltip, Tag } from 'antd';
import { BADGES, BADGE_TIER_COLORS, BadgeTier, getBadgeById } from '../config/badges';
import { Phone, Users, Calendar, Trophy, Flame, Mail, Star, Sunrise } from 'lucide-react';

const ICON_MAP: Record<string, typeof Phone> = {
  Phone,
  Users,
  Calendar,
  Trophy,
  Flame,
  Mail,
  Star,
  Sunrise,
};

interface BadgeDisplayProps {
  badges: string[];
  compact?: boolean;
}

export function BadgeDisplay({ badges, compact = false }: BadgeDisplayProps) {
  if (badges.length === 0) {
    return (
      <div style={{ color: 'rgba(255,255,255,0.45)', padding: compact ? 0 : 16, textAlign: 'center' }}>
        No badges earned yet. Keep grinding!
      </div>
    );
  }

  const parsedBadges = badges.map((badgeStr) => {
    const [badgeId, tier] = badgeStr.split('.') as [string, BadgeTier];
    const definition = getBadgeById(badgeId);
    return { badgeId, tier, definition };
  }).filter((b) => b.definition);

  if (compact) {
    return (
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
        {parsedBadges.slice(0, 5).map(({ badgeId, tier, definition }) => {
          const IconComponent = ICON_MAP[definition!.icon] || Star;
          return (
            <Tooltip key={`${badgeId}.${tier}`} title={`${definition!.name} (${tier})`}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: `linear-gradient(135deg, ${BADGE_TIER_COLORS[tier]}33, ${BADGE_TIER_COLORS[tier]}66)`,
                  border: `2px solid ${BADGE_TIER_COLORS[tier]}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IconComponent size={16} color={BADGE_TIER_COLORS[tier]} />
              </div>
            </Tooltip>
          );
        })}
        {badges.length > 5 && (
          <Tag style={{ height: 32, lineHeight: '28px' }}>+{badges.length - 5}</Tag>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 12 }}>
      {parsedBadges.map(({ badgeId, tier, definition }) => {
        const IconComponent = ICON_MAP[definition!.icon] || Star;
        return (
          <Tooltip key={`${badgeId}.${tier}`} title={definition!.description}>
            <div
              style={{
                padding: 12,
                borderRadius: 8,
                background: `linear-gradient(135deg, ${BADGE_TIER_COLORS[tier]}22, ${BADGE_TIER_COLORS[tier]}44)`,
                border: `1px solid ${BADGE_TIER_COLORS[tier]}66`,
                textAlign: 'center',
              }}
            >
              <IconComponent size={24} color={BADGE_TIER_COLORS[tier]} style={{ marginBottom: 8 }} />
              <div style={{ color: '#fff', fontSize: 12, fontWeight: 500 }}>{definition!.name}</div>
              <Tag
                style={{
                  marginTop: 4,
                  background: BADGE_TIER_COLORS[tier],
                  border: 'none',
                  color: tier === 'gold' || tier === 'platinum' ? '#000' : '#fff',
                  textTransform: 'capitalize',
                }}
              >
                {tier}
              </Tag>
            </div>
          </Tooltip>
        );
      })}
    </div>
  );
}

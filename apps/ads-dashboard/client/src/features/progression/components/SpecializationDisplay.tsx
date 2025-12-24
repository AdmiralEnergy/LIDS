import { Card, message } from 'antd';
import { motion } from 'framer-motion';
import { Zap, Users, Target, Network, Lock } from 'lucide-react';
import { useProgression } from '../hooks/useProgression';
import { SPECIALIZATIONS } from '../config/specializations';
import { useMemo, useCallback, useState } from 'react';

const specIcons: Record<string, React.ReactNode> = {
  speed_dialer: <Zap size={24} />,
  relationship_builder: <Users size={24} />,
  closer: <Target size={24} />,
  referral_master: <Network size={24} />,
};

const hoverVariants = { scale: 1.02 };
const tapVariants = { scale: 0.98 };
const noAnimation = {};

export function SpecializationDisplay() {
  const { progression, level, setSpecialization } = useProgression();
  const [isUpdating, setIsUpdating] = useState(false);

  const isUnlocked = level >= 5;
  const currentSpec = progression?.specialization;

  const handleSelect = useCallback(async (specId: string) => {
    if (!isUnlocked || currentSpec === specId || isUpdating) return;
    setIsUpdating(true);
    try {
      await setSpecialization(specId);
      message.success('Specialization updated!');
    } catch (error) {
      message.error('Failed to update specialization');
    } finally {
      setIsUpdating(false);
    }
  }, [isUnlocked, currentSpec, isUpdating, setSpecialization]);

  return (
    <Card
      data-testid="card-specialization"
      style={{
        background: 'linear-gradient(145deg, #0a1929 0%, #0c2f4a 50%, #0a1929 100%)',
        borderRadius: 16,
        border: '1px solid rgba(201, 166, 72, 0.2)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
      }}
      styles={{ body: { padding: 20 } }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ 
            color: '#fff', 
            fontSize: 16, 
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <Zap size={18} color="#c9a648" />
            Specialization Path
          </div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 2 }}>
            {isUnlocked ? 'Choose your playstyle' : `Unlocks at Level 5 (You: ${level})`}
          </div>
        </div>
        {!isUnlocked && (
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            padding: '4px 10px',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            <Lock size={12} color="rgba(255,255,255,0.5)" />
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>Locked</span>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        {SPECIALIZATIONS.map((spec) => {
          const isSelected = currentSpec === spec.id;
          const isAvailable = isUnlocked;
          
          return (
            <motion.div
              key={spec.id}
              whileHover={isAvailable ? hoverVariants : noAnimation}
              whileTap={isAvailable ? tapVariants : noAnimation}
              onClick={() => handleSelect(spec.id)}
              style={{
                background: isSelected 
                  ? `linear-gradient(135deg, ${spec.color}30 0%, ${spec.color}15 100%)`
                  : 'rgba(0,0,0,0.3)',
                borderRadius: 12,
                padding: 14,
                border: isSelected 
                  ? `2px solid ${spec.color}`
                  : '1px solid rgba(255,255,255,0.08)',
                cursor: isAvailable ? 'pointer' : 'not-allowed',
                opacity: isAvailable ? 1 : 0.5,
                position: 'relative',
                overflow: 'hidden',
              }}
              data-testid={`spec-${spec.id}`}
            >
              {isSelected && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: spec.color,
                    boxShadow: `0 0 10px ${spec.color}`,
                  }}
                />
              )}
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: `${spec.color}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: spec.color,
                }}>
                  {specIcons[spec.id] || <Zap size={20} />}
                </div>
                <div>
                  <div style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>
                    {spec.name}
                  </div>
                  <div style={{ color: spec.color, fontSize: 11, fontWeight: 500 }}>
                    {spec.bonusLabel}
                  </div>
                </div>
              </div>
              
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, lineHeight: 1.4 }}>
                {spec.description}
              </div>
            </motion.div>
          );
        })}
      </div>

      {currentSpec && (
        <div style={{ 
          marginTop: 16, 
          padding: 12, 
          background: 'rgba(201, 166, 72, 0.1)',
          borderRadius: 10,
          border: '1px solid rgba(201, 166, 72, 0.2)',
        }}>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
            Active Bonus
          </div>
          <div style={{ color: '#c9a648', fontSize: 13, fontWeight: 600, marginTop: 4 }}>
            {SPECIALIZATIONS.find(s => s.id === currentSpec)?.bonusLabel || 'None'}
          </div>
        </div>
      )}
    </Card>
  );
}

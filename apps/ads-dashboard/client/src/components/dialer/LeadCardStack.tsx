import { useState, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { LeadCard, Lead } from './LeadCard';

interface LeadCardStackProps {
  leads: Lead[];
  currentIndex: number;
  onSwipe: (direction: 'left' | 'right') => void;
  onCardTap: () => void;
  isExpanded: boolean;
  callStatus?: 'idle' | 'connecting' | 'connected';
  callDuration?: string;
  disabled?: boolean;
}

const SWIPE_THRESHOLD = 100;
const SWIPE_VELOCITY_THRESHOLD = 500;

export function LeadCardStack({
  leads,
  currentIndex,
  onSwipe,
  onCardTap,
  isExpanded,
  callStatus = 'idle',
  callDuration,
  disabled = false,
}: LeadCardStackProps) {
  const [dragDirection, setDragDirection] = useState<number>(0);

  const currentLead = leads[currentIndex];
  const nextLeads = leads.slice(currentIndex + 1, currentIndex + 3);

  const handleDragEnd = useCallback(
    (_: any, info: PanInfo) => {
      if (disabled || callStatus !== 'idle') return;

      const { offset, velocity } = info;

      // Check if swipe meets threshold
      const swipedLeft =
        offset.x < -SWIPE_THRESHOLD || velocity.x < -SWIPE_VELOCITY_THRESHOLD;
      const swipedRight =
        offset.x > SWIPE_THRESHOLD || velocity.x > SWIPE_VELOCITY_THRESHOLD;

      if (swipedLeft) {
        onSwipe('left');
      } else if (swipedRight) {
        onSwipe('right');
      }

      setDragDirection(0);
    },
    [disabled, callStatus, onSwipe]
  );

  const handleDrag = useCallback(
    (_: any, info: PanInfo) => {
      setDragDirection(info.offset.x);
    },
    []
  );

  if (!currentLead) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <div
          style={{
            textAlign: 'center',
            color: 'rgba(255, 255, 255, 0.5)',
          }}
        >
          <p style={{ fontSize: 18, marginBottom: 8 }}>No more leads</p>
          <p style={{ fontSize: 14 }}>You've gone through all leads in the queue</p>
        </div>
      </div>
    );
  }

  const isOnCall = callStatus !== 'idle';

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px 20px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Peek cards (behind active card) */}
      {nextLeads.map((lead, index) => (
        <LeadCard
          key={lead.id}
          lead={lead}
          isPeek
          peekIndex={index + 1}
          isExpanded={false}
        />
      ))}

      {/* Active card with swipe */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={currentLead.id}
          drag={!isOnCall && !disabled ? 'x' : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.7}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{
            scale: 1,
            opacity: 1,
            rotate: dragDirection * 0.03,
            x: 0,
          }}
          exit={(direction: number) => ({
            x: direction > 0 ? 400 : -400,
            opacity: 0,
            rotate: direction > 0 ? 15 : -15,
            transition: { duration: 0.3 },
          })}
          transition={{
            type: 'spring',
            stiffness: 600,
            damping: 30,
          }}
          style={{
            width: '100%',
            zIndex: 10,
            touchAction: 'pan-y',
          }}
          custom={dragDirection}
        >
          <LeadCard
            lead={currentLead}
            isActive
            isExpanded={isExpanded}
            onTap={onCardTap}
            showSwipeHint={currentIndex < 3 && !isExpanded && !isOnCall}
            callStatus={callStatus}
            callDuration={callDuration}
          />
        </motion.div>
      </AnimatePresence>

      {/* Swipe indicators */}
      {!isOnCall && !disabled && (
        <>
          {/* Skip indicator (left) */}
          <motion.div
            animate={{
              opacity: dragDirection < -30 ? Math.min(Math.abs(dragDirection) / 100, 1) : 0,
            }}
            style={{
              position: 'absolute',
              left: 20,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(255, 77, 79, 0.2)',
              border: '2px solid rgba(255, 77, 79, 0.5)',
              borderRadius: 12,
              padding: '12px 20px',
              pointerEvents: 'none',
            }}
          >
            <span style={{ color: '#ff4d4f', fontWeight: 600, fontSize: 14 }}>
              SKIP
            </span>
          </motion.div>

          {/* Keep indicator (right) - for potential "save for later" feature */}
          <motion.div
            animate={{
              opacity: dragDirection > 30 ? Math.min(dragDirection / 100, 1) : 0,
            }}
            style={{
              position: 'absolute',
              right: 20,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(0, 255, 136, 0.2)',
              border: '2px solid rgba(0, 255, 136, 0.5)',
              borderRadius: 12,
              padding: '12px 20px',
              pointerEvents: 'none',
            }}
          >
            <span style={{ color: '#00ff88', fontWeight: 600, fontSize: 14 }}>
              SKIP
            </span>
          </motion.div>
        </>
      )}

      {/* Queue position indicator */}
      <div
        style={{
          marginTop: 16,
          fontSize: 12,
          color: 'rgba(255, 255, 255, 0.4)',
          fontFamily: 'var(--font-mono)',
        }}
      >
        {currentIndex + 1} of {leads.length}
      </div>
    </div>
  );
}

/**
 * AutoDispositionToast - Shows auto-detected call outcome with XP
 *
 * Features:
 * - 3-second countdown with progress bar
 * - "Change" button to override auto-detection
 * - Auto-dismisses and awards XP after countdown
 * - Matches LIDS brand design
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Typography } from 'antd';
import { CheckCircle, Clock, Voicemail, PhoneMissed, XCircle, AlertTriangle, Ban, Edit2 } from 'lucide-react';
import type { AutoDispositionResult } from '../lib/autoDisposition';
import { getDispositionLabel, getDispositionColor } from '../lib/autoDisposition';

const { Text } = Typography;

interface Props {
  visible: boolean;
  result: AutoDispositionResult | null;
  xpAmount: number;
  duration: string;
  onOverride: () => void;
  onConfirm: () => void;
  autoConfirmMs?: number;
}

const DISPOSITION_ICONS: Record<string, typeof CheckCircle> = {
  contact: CheckCircle,
  callback: Clock,
  voicemail: Voicemail,
  no_answer: PhoneMissed,
  not_interested: XCircle,
  wrong_number: AlertTriangle,
  dnc: Ban,
};

export function AutoDispositionToast({
  visible,
  result,
  xpAmount,
  duration,
  onOverride,
  onConfirm,
  autoConfirmMs = 3000,
}: Props) {
  const [progress, setProgress] = useState(100);
  const intervalRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (visible && result) {
      // Reset progress
      setProgress(100);

      // Start countdown
      const step = 100 / (autoConfirmMs / 50);
      intervalRef.current = window.setInterval(() => {
        setProgress(p => {
          const newProgress = Math.max(0, p - step);
          return newProgress;
        });
      }, 50);

      // Auto-confirm after timeout
      timeoutRef.current = window.setTimeout(() => {
        onConfirm();
      }, autoConfirmMs);

      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setProgress(100);
      };
    }
  }, [visible, result, autoConfirmMs, onConfirm]);

  // Handle override - cancel auto-confirm
  const handleOverride = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    onOverride();
  };

  if (!visible || !result) return null;

  const Icon = DISPOSITION_ICONS[result.disposition] || CheckCircle;
  const label = getDispositionLabel(result.disposition);
  const color = getDispositionColor(result.disposition);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: 'rgba(5, 5, 5, 0.95)',
          border: '1px solid rgba(201, 166, 72, 0.4)',
          borderRadius: 16,
          padding: 0,
          minWidth: 320,
          maxWidth: 400,
          zIndex: 9999,
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 40px rgba(201, 166, 72, 0.1)',
        }}
      >
        {/* Progress bar at top */}
        <div
          style={{
            height: 3,
            background: 'rgba(255,255,255,0.1)',
            overflow: 'hidden',
          }}
        >
          <motion.div
            initial={{ width: '100%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.05 }}
            style={{
              height: '100%',
              background: 'linear-gradient(90deg, #c9a648, #ffd700)',
            }}
          />
        </div>

        <div style={{ padding: 16 }}>
          {/* Main content */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.1 }}
              style={{
                background: `${color}20`,
                borderRadius: 12,
                padding: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon size={28} color={color} />
            </motion.div>

            {/* Text */}
            <div style={{ flex: 1 }}>
              <Text strong style={{ display: 'block', color: '#fff', fontSize: 16 }}>
                {label}
              </Text>
              <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                {duration} call
                {result.confidence !== 'high' && (
                  <span style={{ marginLeft: 8, color: '#faad14' }}>
                    (auto-detected)
                  </span>
                )}
              </Text>
            </div>

            {/* XP Badge */}
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', delay: 0.2 }}
              style={{
                background: 'linear-gradient(135deg, #c9a648, #ffd700)',
                borderRadius: 8,
                padding: '8px 12px',
                boxShadow: '0 4px 12px rgba(201, 166, 72, 0.4)',
              }}
            >
              <Text strong style={{ color: '#000', fontSize: 18, fontFamily: 'var(--font-mono)' }}>
                +{xpAmount}
              </Text>
              <Text style={{ color: '#000', fontSize: 10, display: 'block', marginTop: -2 }}>
                XP
              </Text>
            </motion.div>
          </div>

          {/* Reason */}
          <div
            style={{
              marginTop: 12,
              padding: '8px 12px',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: 8,
              borderLeft: `3px solid ${color}`,
            }}
          >
            <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>
              {result.reason}
            </Text>
          </div>

          {/* Change button */}
          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="text"
              size="small"
              icon={<Edit2 size={14} />}
              onClick={handleOverride}
              style={{
                color: 'rgba(255,255,255,0.5)',
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              Change disposition
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

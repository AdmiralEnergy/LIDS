import { motion } from 'framer-motion';
import { Phone, PhoneOff, Mic, MicOff, Pause, PhoneForwarded } from 'lucide-react';
import { Tooltip } from 'antd';

interface CallControlsProps {
  status: 'idle' | 'connecting' | 'connected' | 'error';
  muted: boolean;
  onDial: () => void;
  onHangup: () => void;
  onMute: () => void;
  canDial: boolean;
  isNativeMode?: boolean;
}

export function CallControls({
  status,
  muted,
  onDial,
  onHangup,
  onMute,
  canDial,
  isNativeMode = false,
}: CallControlsProps) {
  const isIdle = status === 'idle';
  const isConnecting = status === 'connecting';
  const isConnected = status === 'connected';
  const isOnCall = isConnecting || isConnected;

  return (
    <div
      style={{
        padding: '20px 24px',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'rgba(0, 0, 0, 0.3)',
      }}
    >
      {/* Main dial/hangup button */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
        {isOnCall ? (
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={onHangup}
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #ff4d4f 0%, #cf1322 100%)',
              border: '2px solid rgba(255, 77, 79, 0.5)',
              boxShadow: '0 4px 20px rgba(255, 77, 79, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <PhoneOff size={32} color="#fff" />
          </motion.button>
        ) : (
          <motion.button
            whileTap={canDial ? { scale: 0.92 } : undefined}
            onClick={canDial ? onDial : undefined}
            animate={
              canDial
                ? {
                    boxShadow: [
                      '0 4px 20px rgba(0, 255, 136, 0.3)',
                      '0 4px 40px rgba(0, 255, 136, 0.5)',
                      '0 4px 20px rgba(0, 255, 136, 0.3)',
                    ],
                  }
                : {}
            }
            transition={{ duration: 2, repeat: Infinity }}
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: canDial
                ? 'linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)'
                : 'linear-gradient(135deg, #3f4752 0%, #2a2f36 100%)',
              border: canDial
                ? '2px solid rgba(0, 255, 136, 0.5)'
                : '2px solid rgba(255, 255, 255, 0.1)',
              boxShadow: canDial
                ? '0 4px 20px rgba(0, 255, 136, 0.3)'
                : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: canDial ? 'pointer' : 'not-allowed',
              opacity: canDial ? 1 : 0.5,
            }}
          >
            <Phone size={32} color={canDial ? '#0c2f4a' : '#888'} />
          </motion.button>
        )}
      </div>

      {/* Secondary controls */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 24 }}>
        {/* Mute button */}
        <motion.button
          whileTap={isOnCall ? { scale: 0.92 } : undefined}
          onClick={isOnCall ? onMute : undefined}
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: muted
              ? 'rgba(255, 77, 79, 0.2)'
              : 'rgba(255, 255, 255, 0.1)',
            border: muted
              ? '1px solid rgba(255, 77, 79, 0.4)'
              : '1px solid rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: isOnCall ? 'pointer' : 'not-allowed',
            opacity: isOnCall ? 1 : 0.4,
          }}
        >
          {muted ? (
            <MicOff size={24} color="#ff4d4f" />
          ) : (
            <Mic size={24} color="rgba(255, 255, 255, 0.8)" />
          )}
        </motion.button>

        {/* Hold button (placeholder) */}
        <Tooltip title="Hold - Coming Soon" placement="top">
          <motion.button
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px dashed rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'not-allowed',
              opacity: 0.4,
            }}
          >
            <Pause size={24} color="rgba(255, 255, 255, 0.5)" />
          </motion.button>
        </Tooltip>

        {/* Transfer button (placeholder) */}
        <Tooltip title="Transfer - Coming Soon" placement="top">
          <motion.button
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px dashed rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'not-allowed',
              opacity: 0.4,
            }}
          >
            <PhoneForwarded size={24} color="rgba(255, 255, 255, 0.5)" />
          </motion.button>
        </Tooltip>
      </div>

      {/* Native mode indicator */}
      {isNativeMode && isIdle && (
        <div
          style={{
            textAlign: 'center',
            marginTop: 16,
            fontSize: 11,
            color: 'rgba(255, 255, 255, 0.4)',
          }}
        >
          Native Mode: Opens your phone app
        </div>
      )}

      {/* Connecting indicator */}
      {isConnecting && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            textAlign: 'center',
            marginTop: 16,
            fontSize: 13,
            color: '#0096ff',
            fontWeight: 500,
          }}
        >
          <motion.span
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            Connecting...
          </motion.span>
        </motion.div>
      )}
    </div>
  );
}

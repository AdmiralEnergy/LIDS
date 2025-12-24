import { useState } from 'react';
import { motion } from 'framer-motion';

const KEYS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["*", "0", "#"],
];

interface ApexKeypadProps {
  onPress: (digit: string) => void;
  disabled?: boolean;
}

export function ApexKeypad({ onPress, disabled }: ApexKeypadProps) {
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const handlePress = (digit: string) => {
    if (disabled) return;
    setActiveKey(digit);
    onPress(digit);
    setTimeout(() => setActiveKey(null), 150);
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 10,
        justifyItems: "center",
      }}
    >
      {KEYS.flat().map((digit) => (
        <motion.button
          key={digit}
          disabled={disabled}
          onClick={() => handlePress(digit)}
          whileTap={{ scale: 0.92, y: 2 }}
          transition={{ type: "spring", stiffness: 600, damping: 20 }}
          style={{
            width: 60,
            height: 60,
            fontSize: 22,
            fontFamily: 'var(--font-mono)',
            fontWeight: 500,
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: disabled ? "not-allowed" : "pointer",
            border: "none",
            position: "relative",
            background: activeKey === digit 
              ? "linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%)"
              : "linear-gradient(180deg, #1f1f1f 0%, #0d0d0d 100%)",
            color: activeKey === digit ? "#00ffff" : "rgba(255, 255, 255, 0.9)",
            boxShadow: activeKey === digit
              ? "inset 0 2px 4px rgba(0,0,0,0.8), 0 0 15px rgba(0, 255, 255, 0.3)"
              : "0 4px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
            opacity: disabled ? 0.5 : 1,
          }}
          data-testid={`keypad-${digit}`}
        >
          {activeKey === digit && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: [0, 1, 0], scale: [0.5, 1.5, 2] }}
              transition={{ duration: 0.3 }}
              style={{
                position: "absolute",
                width: "100%",
                height: "100%",
                borderRadius: 12,
                border: "1px solid rgba(0, 255, 255, 0.5)",
                pointerEvents: "none",
              }}
            />
          )}
          <span style={{ position: "relative", zIndex: 1 }}>{digit}</span>
        </motion.button>
      ))}
    </div>
  );
}

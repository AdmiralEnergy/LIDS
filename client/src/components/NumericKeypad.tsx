import { Button } from "antd";

const KEYS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["*", "0", "#"],
];

interface NumericKeypadProps {
  onPress: (digit: string) => void;
  disabled?: boolean;
}

export function NumericKeypad({ onPress, disabled }: NumericKeypadProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 12,
        justifyItems: "center",
      }}
    >
      {KEYS.flat().map((digit) => (
        <Button
          key={digit}
          size="large"
          disabled={disabled}
          onClick={() => onPress(digit)}
          style={{
            width: 64,
            height: 64,
            fontSize: 24,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          data-testid={`keypad-${digit}`}
        >
          {digit}
        </Button>
      ))}
    </div>
  );
}

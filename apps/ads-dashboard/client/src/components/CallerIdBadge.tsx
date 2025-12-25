import { Tag, Typography } from "antd";
import { PhoneOutlined, MobileOutlined } from "@ant-design/icons";

const { Text } = Typography;

interface CallerIdBadgeProps {
  smsPhoneNumber?: string;
  useNativePhone: boolean;
}

export function CallerIdBadge({ smsPhoneNumber, useNativePhone }: CallerIdBadgeProps) {
  const label = useNativePhone
    ? "Using Device"
    : smsPhoneNumber
      ? smsPhoneNumber
      : "Caller ID not set";

  const color = useNativePhone ? "gold" : smsPhoneNumber ? "cyan" : "default";
  const Icon = useNativePhone ? MobileOutlined : PhoneOutlined;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
      <Tag color={color} style={{ marginRight: 0 }}>
        <Icon style={{ marginRight: 6 }} />
        Caller ID
      </Tag>
      <Text type="secondary">{label}</Text>
    </div>
  );
}

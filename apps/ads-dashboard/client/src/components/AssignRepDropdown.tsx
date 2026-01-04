import { useState } from "react";
import { Select, Spin, Tag } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { useLeadAssignment } from "../hooks/useLeadAssignment";

interface Props {
  value?: string | null;
  onChange: (workspaceMemberId: string | null) => Promise<void>;
  disabled?: boolean;
  compact?: boolean;
}

export function AssignRepDropdown({ value, onChange, disabled, compact }: Props) {
  const { members, loading, getMemberName } = useLeadAssignment();
  const [updating, setUpdating] = useState(false);

  const handleChange = async (memberId: string | undefined) => {
    setUpdating(true);
    try {
      await onChange(memberId === "unassigned" ? null : (memberId || null));
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <Spin size="small" />;
  }

  const options = [
    { value: "unassigned", label: "Unassigned" },
    ...members.map((member) => ({
      value: member.id,
      label: `${member.name.firstName} ${member.name.lastName}`,
    })),
  ];

  const displayValue = value || "unassigned";

  return (
    <Select
      value={displayValue}
      onChange={handleChange}
      disabled={disabled || updating}
      loading={updating}
      style={{ minWidth: compact ? 120 : 160 }}
      size={compact ? "small" : "middle"}
      options={options}
      suffixIcon={<UserOutlined />}
    />
  );
}

// Simple display component for read-only views
export function AssignedRepTag({ workspaceMemberId }: { workspaceMemberId?: string | null }) {
  const { getMemberName, loading } = useLeadAssignment();

  if (loading) {
    return <Spin size="small" />;
  }

  const name = getMemberName(workspaceMemberId);

  if (!workspaceMemberId) {
    return (
      <Tag style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "rgba(255,255,255,0.5)" }}>
        Unassigned
      </Tag>
    );
  }

  return (
    <Tag
      icon={<UserOutlined />}
      style={{ background: "rgba(0,150,255,0.15)", border: "1px solid rgba(0,150,255,0.3)", color: "#0096ff" }}
    >
      {name}
    </Tag>
  );
}

export default AssignRepDropdown;

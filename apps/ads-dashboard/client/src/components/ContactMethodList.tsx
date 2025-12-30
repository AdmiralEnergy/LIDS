/**
 * ContactMethodList.tsx - Display ALL populated contact methods
 *
 * Philosophy: Show every phone/email with data. Each is a sales opportunity.
 * Compact mode for table rows, expanded mode for detail views.
 */

import { Space, Tag, Tooltip, Button } from 'antd';
import { PhoneOutlined, MailOutlined } from '@ant-design/icons';
import type { ContactMethod, PopulatedPhone, PopulatedEmail } from '../lib/fieldUtils';
import { formatPhoneNumber } from '../lib/fieldUtils';

interface ContactMethodListProps {
  phones?: PopulatedPhone[];
  emails?: PopulatedEmail[];
  methods?: ContactMethod[];
  compact?: boolean;
  maxDisplay?: number;
  onCallPhone?: (phone: string) => void;
  onSendEmail?: (email: string) => void;
}

/**
 * Display a list of contact methods with click actions.
 * - Compact mode: Shows inline tags suitable for table cells
 * - Expanded mode: Shows full details with labels
 */
export function ContactMethodList({
  phones = [],
  emails = [],
  methods,
  compact = false,
  maxDisplay = compact ? 2 : undefined,
  onCallPhone,
  onSendEmail,
}: ContactMethodListProps) {
  // If methods array is provided, use it; otherwise combine phones and emails
  const allMethods: ContactMethod[] = methods || [
    ...phones.map(p => ({ type: 'phone' as const, label: p.label, value: p.number, isPrimary: p.isPrimary })),
    ...emails.map(e => ({ type: 'email' as const, label: e.label, value: e.email, isPrimary: e.isPrimary })),
  ];

  if (allMethods.length === 0) {
    return <span style={{ color: 'rgba(255,255,255,0.35)' }}>No contact info</span>;
  }

  // Limit display if maxDisplay is set
  const displayMethods = maxDisplay ? allMethods.slice(0, maxDisplay) : allMethods;
  const hiddenCount = maxDisplay ? Math.max(0, allMethods.length - maxDisplay) : 0;

  if (compact) {
    return (
      <Space size={4} wrap>
        {displayMethods.map((method, index) => {
          const isPhone = method.type === 'phone';
          const displayValue = isPhone ? formatPhoneNumber(method.value) : method.value;

          return (
            <Tooltip
              key={`${method.type}-${index}`}
              title={`${method.label}: ${displayValue}`}
            >
              <Tag
                style={{
                  cursor: 'pointer',
                  background: isPhone ? 'rgba(0, 255, 136, 0.1)' : 'rgba(0, 150, 255, 0.1)',
                  border: `1px solid ${isPhone ? 'rgba(0, 255, 136, 0.3)' : 'rgba(0, 150, 255, 0.3)'}`,
                  color: isPhone ? '#00ff88' : '#0096ff',
                  borderRadius: 4,
                  fontSize: 11,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isPhone && onCallPhone) {
                    onCallPhone(method.value);
                  } else if (!isPhone && onSendEmail) {
                    onSendEmail(method.value);
                  } else if (isPhone) {
                    window.location.href = `tel:${method.value}`;
                  } else {
                    window.location.href = `mailto:${method.value}`;
                  }
                }}
              >
                {isPhone ? <PhoneOutlined /> : <MailOutlined />}
                <span style={{ marginLeft: 4 }}>
                  {method.isPrimary ? displayValue : method.label}
                </span>
              </Tag>
            </Tooltip>
          );
        })}
        {hiddenCount > 0 && (
          <Tooltip title={`${hiddenCount} more contact method${hiddenCount > 1 ? 's' : ''}`}>
            <Tag
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'rgba(255, 255, 255, 0.5)',
                borderRadius: 4,
                fontSize: 11,
              }}
            >
              +{hiddenCount}
            </Tag>
          </Tooltip>
        )}
      </Space>
    );
  }

  // Expanded mode - full details
  return (
    <Space direction="vertical" size={8} style={{ width: '100%' }}>
      {displayMethods.map((method, index) => {
        const isPhone = method.type === 'phone';
        const displayValue = isPhone ? formatPhoneNumber(method.value) : method.value;

        return (
          <div
            key={`${method.type}-${index}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: 6,
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {isPhone ? (
                <PhoneOutlined style={{ color: '#00ff88' }} />
              ) : (
                <MailOutlined style={{ color: '#0096ff' }} />
              )}
              <div>
                <div style={{ color: 'rgba(255, 255, 255, 0.45)', fontSize: 10 }}>
                  {method.label}
                  {method.isPrimary && (
                    <span style={{ marginLeft: 4, color: '#c9a648' }}>(Primary)</span>
                  )}
                </div>
                <div style={{ color: '#fff', fontSize: 13 }}>{displayValue}</div>
              </div>
            </div>
            <Button
              type="text"
              size="small"
              icon={isPhone ? <PhoneOutlined /> : <MailOutlined />}
              onClick={() => {
                if (isPhone && onCallPhone) {
                  onCallPhone(method.value);
                } else if (!isPhone && onSendEmail) {
                  onSendEmail(method.value);
                } else if (isPhone) {
                  window.location.href = `tel:${method.value}`;
                } else {
                  window.location.href = `mailto:${method.value}`;
                }
              }}
              style={{
                color: isPhone ? '#00ff88' : '#0096ff',
              }}
            >
              {isPhone ? 'Call' : 'Email'}
            </Button>
          </div>
        );
      })}
      {hiddenCount > 0 && (
        <div style={{
          textAlign: 'center',
          color: 'rgba(255, 255, 255, 0.45)',
          fontSize: 12,
        }}>
          +{hiddenCount} more contact method{hiddenCount > 1 ? 's' : ''}
        </div>
      )}
    </Space>
  );
}

/**
 * Compact inline display for table cells.
 * Shows primary phone + count of others.
 */
export function ContactMethodBadge({
  phones,
  emails,
  onCallPhone,
}: {
  phones: PopulatedPhone[];
  emails: PopulatedEmail[];
  onCallPhone?: (phone: string) => void;
}) {
  const totalMethods = phones.length + emails.length;

  if (totalMethods === 0) {
    return <span style={{ color: 'rgba(255,255,255,0.35)' }}>-</span>;
  }

  const primary = phones.find(p => p.isPrimary) || phones[0];

  return (
    <Space size={4}>
      {primary && (
        <Tag
          style={{
            cursor: 'pointer',
            background: 'rgba(0, 255, 136, 0.1)',
            border: '1px solid rgba(0, 255, 136, 0.3)',
            color: '#00ff88',
            borderRadius: 4,
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (onCallPhone) {
              onCallPhone(primary.number);
            } else {
              window.location.href = `tel:${primary.number}`;
            }
          }}
        >
          <PhoneOutlined style={{ marginRight: 4 }} />
          {formatPhoneNumber(primary.number)}
        </Tag>
      )}
      {totalMethods > 1 && (
        <Tooltip
          title={`${phones.length} phone${phones.length !== 1 ? 's' : ''}, ${emails.length} email${emails.length !== 1 ? 's' : ''}`}
        >
          <Tag
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'rgba(255, 255, 255, 0.6)',
              borderRadius: 4,
            }}
          >
            +{totalMethods - 1}
          </Tag>
        </Tooltip>
      )}
    </Space>
  );
}

export default ContactMethodList;

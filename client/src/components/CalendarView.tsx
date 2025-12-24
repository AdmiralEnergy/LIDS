import { useState } from 'react';
import { Card, Badge, Spin, Empty } from 'antd';
import dayjs from 'dayjs';

interface CalendarEvent {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  description?: string;
}

interface CalendarViewProps {
  events: CalendarEvent[];
  loading: boolean;
  onDateClick?: (date: string) => void;
}

export function CalendarView({ events, loading, onDateClick }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(dayjs());

  const daysInMonth = currentMonth.daysInMonth();
  const firstDayOfMonth = currentMonth.startOf('month').day();
  const today = dayjs();

  const eventsByDate: Record<string, CalendarEvent[]> = {};
  events.forEach(event => {
    const date = dayjs(event.startsAt).format('YYYY-MM-DD');
    if (!eventsByDate[date]) eventsByDate[date] = [];
    eventsByDate[date].push(event);
  });

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="calendar-day empty" style={{ minHeight: 60 }} />);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const date = currentMonth.date(day).format('YYYY-MM-DD');
    const dayEvents = eventsByDate[date] || [];
    const isToday = currentMonth.date(day).isSame(today, 'day');

    days.push(
      <div
        key={day}
        className={`calendar-day ${isToday ? 'today' : ''} ${dayEvents.length > 0 ? 'has-events' : ''}`}
        onClick={() => onDateClick?.(date)}
        style={{
          padding: 8,
          minHeight: 60,
          border: '0.5px solid rgba(0, 255, 255, 0.15)',
          borderRadius: 4,
          background: isToday ? 'rgba(0, 255, 255, 0.1)' : '#050505',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background = 'rgba(0, 255, 255, 0.15)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = isToday ? 'rgba(0, 255, 255, 0.1)' : '#050505';
        }}
      >
        <div style={{
          fontWeight: isToday ? 'bold' : 'normal',
          color: isToday ? '#00ffff' : '#fff',
          marginBottom: 4,
          fontFamily: 'var(--font-mono)',
        }}>
          {day}
        </div>
        {dayEvents.length > 0 && (
          <Badge
            count={dayEvents.length}
            style={{ backgroundColor: '#00ffff', color: '#000' }}
            size="small"
          />
        )}
      </div>
    );
  }

  const upcoming = events
    .filter(e => dayjs(e.startsAt).isAfter(today) && dayjs(e.startsAt).isBefore(today.add(7, 'day')))
    .sort((a, b) => dayjs(a.startsAt).valueOf() - dayjs(b.startsAt).valueOf())
    .slice(0, 5);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 40 }}><Spin size="large" /></div>;
  }

  return (
    <div style={{ display: 'flex', gap: 24 }}>
      <Card
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button 
              onClick={() => setCurrentMonth(m => m.subtract(1, 'month'))} 
              style={{ 
                background: 'none', 
                border: 'none', 
                color: '#00ffff', 
                cursor: 'pointer', 
                fontSize: 18,
                padding: '4px 8px',
              }}
            >
              ◄
            </button>
            <span style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
              {currentMonth.format('MMMM YYYY')}
            </span>
            <button 
              onClick={() => setCurrentMonth(m => m.add(1, 'month'))} 
              style={{ 
                background: 'none', 
                border: 'none', 
                color: '#00ffff', 
                cursor: 'pointer', 
                fontSize: 18,
                padding: '4px 8px',
              }}
            >
              ►
            </button>
          </div>
        }
        style={{ 
          flex: 2,
          background: '#050505',
          border: '0.5px solid rgba(0, 255, 255, 0.2)',
        }}
        styles={{ body: { padding: 16 } }}
      >
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 4,
          marginBottom: 8
        }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} style={{ 
              textAlign: 'center', 
              color: 'rgba(255, 255, 255, 0.5)', 
              fontSize: 11, 
              padding: 4,
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}>
              {d}
            </div>
          ))}
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 4
        }}>
          {days}
        </div>
      </Card>

      <Card 
        title={
          <span style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
            Upcoming Appointments
          </span>
        } 
        style={{ 
          flex: 1,
          background: '#050505',
          border: '0.5px solid rgba(0, 255, 255, 0.2)',
        }} 
        styles={{ body: { padding: 16 } }}
      >
        {upcoming.length === 0 ? (
          <Empty description="No upcoming appointments" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {upcoming.map(event => (
              <div
                key={event.id}
                style={{
                  padding: 12,
                  background: '#0a0a0a',
                  borderRadius: 8,
                  borderLeft: '3px solid #00ffff'
                }}
              >
                <div style={{ fontWeight: 'bold', marginBottom: 4 }}>{event.title}</div>
                <div style={{ color: '#888', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                  {dayjs(event.startsAt).format('ddd, MMM D @ h:mm A')}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

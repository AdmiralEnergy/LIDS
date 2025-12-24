import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, Bot } from 'lucide-react';
import type { Turn } from '../types';
import { useEffect, useRef } from 'react';

interface BattleChatProps {
  turns: Turn[];
  personaName: string;
}

export function BattleChat({ turns, personaName }: BattleChatProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [turns]);

  return (
    <ScrollArea className="h-[400px] pr-4" ref={scrollRef} data-testid="chat-battle">
      <div className="space-y-4">
        {turns.map((turn, index) => (
          <div
            key={index}
            className={`flex gap-3 ${turn.speaker === 'rep' ? 'flex-row-reverse' : ''}`}
          >
            <Avatar className="w-8 h-8 shrink-0">
              <AvatarFallback className={turn.speaker === 'rep' ? 'bg-primary text-primary-foreground' : 'bg-muted'}>
                {turn.speaker === 'rep' ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </AvatarFallback>
            </Avatar>
            <div className={`flex flex-col gap-1 max-w-[80%] ${turn.speaker === 'rep' ? 'items-end' : ''}`}>
              <span className="text-xs text-muted-foreground">
                {turn.speaker === 'rep' ? 'You' : personaName}
              </span>
              <div
                className={`rounded-lg px-4 py-2 ${
                  turn.speaker === 'rep'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{turn.text}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

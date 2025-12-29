import { useCallback } from 'react';
import type { Command } from '../types';

export function useCommands(commands: Command[]) {
  const parseCommand = useCallback((input: string): { command: Command; args: string } | null => {
    if (!input.startsWith('/')) return null;

    const [commandName, ...argParts] = input.slice(1).split(' ');
    const command = commands.find(c => c.name.toLowerCase() === commandName.toLowerCase());

    if (!command) return null;

    return { command, args: argParts.join(' ') };
  }, [commands]);

  const executeCommand = useCallback(async (input: string): Promise<string | null> => {
    const parsed = parseCommand(input);
    if (!parsed) return null;

    try {
      return await parsed.command.handler(parsed.args);
    } catch (error) {
      console.error('[COMPASS] Command error:', error);
      return `Error executing /${parsed.command.name}`;
    }
  }, [parseCommand]);

  const isCommand = useCallback((input: string): boolean => {
    return input.startsWith('/');
  }, []);

  return { parseCommand, executeCommand, isCommand, commands };
}

import type { Command } from '@lids/compass-core';
import { lookupCommand } from './lookup';
import { objectionCommand } from './objection';

export const salesCommands: Command[] = [
  lookupCommand,
  objectionCommand,
];

import type { Command } from '@lids/compass-core';
import { generateCommand } from './generate';
import { campaignCommand } from './campaign';

export const studioCommands: Command[] = [
  generateCommand,
  campaignCommand,
];

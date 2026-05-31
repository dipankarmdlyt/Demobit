/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type CompletionStatus = 'completed' | 'failed' | 'none';

export interface Habit {
  id: string;
  name: string;
  createdAt: string;
  order: number;
  reminderEnabled?: boolean;
  reminderTime?: string;
  category?: string;
}

export type CompletionLogs = Record<string, CompletionStatus>; // key represents "habitId_dateString" e.g. "habit1_2026-05-31"

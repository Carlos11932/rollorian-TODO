/**
 * ItemCardDto — clean UI transport type for item lists and cards.
 *
 * Produced by view-actions mappers, consumed by feature components.
 * Replaces MockItem as the data contract between server actions and UI.
 *
 * Intentionally flat and serialization-safe (no Date objects, no branded types).
 */
import type { Priority } from '@/domain/shared/priority';
import type { ItemType } from '@/domain/shared/item-type';

export interface ItemCardAssignee {
  id: string;
  name: string;
  initials: string;
  avatarColor?: string;
}

export interface ItemCardDto {
  id: string;
  title: string;
  notes?: string;
  itemType: ItemType;
  /** Raw status string — 'pending' | 'in_progress' | 'blocked' | 'done' | etc. */
  status: string;
  priority: Priority;
  spaceType: 'personal' | 'group';
  groupId?: string;
  assignee?: ItemCardAssignee;
  /** Formatted date string for display — e.g. "15 abr 2026". Present if item has a due/start date. */
  dueDate?: string;
  /** Raw ISO date string (YYYY-MM-DD) for semantic date logic. */
  dueDateRaw?: string;
  createdAt: string;
  tags: string[];
  overdueByDays?: number;
}

export interface WeekCardDto {
  item: ItemCardDto;
  dayLabel: string;
}

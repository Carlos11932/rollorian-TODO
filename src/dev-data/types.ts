import type { ItemType } from '@/domain/shared/item-type';
import type { Priority } from '@/domain/shared/priority';

export type ItemStatus =
  | 'pending'
  | 'in_progress'
  | 'blocked'
  | 'postponed'
  | 'done'
  | 'canceled'
  | 'scheduled'
  | 'completed';
export type SpaceType = 'personal' | 'group';

export interface MockUser {
  id: string;
  name: string;
  initials: string;
  avatarColor?: string;
}

export interface MockItem {
  id: string;
  title: string;
  notes?: string;
  itemType: ItemType;
  status: ItemStatus;
  priority: Priority;
  spaceType: SpaceType;
  groupId?: string;
  assignee?: MockUser;
  dueDate?: string;
  createdAt: string;
  location?: string;
  time?: string;
  tags?: string[];
  blockedReason?: string;
  overdueByDays?: number;
}

export interface MockGroup {
  id: string;
  name: string;
  members: MockUser[];
}

export interface MockHistoryEntry {
  id: string;
  actor: MockUser;
  action: string;
  detail?: string;
  comment?: string;
  timestamp: string;
  icon: string;
  iconColor: 'primary' | 'secondary' | 'muted';
}

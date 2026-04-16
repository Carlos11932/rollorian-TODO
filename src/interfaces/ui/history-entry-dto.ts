/**
 * UI DTO for a single history/audit entry.
 * Replaces MockHistoryEntry for production use.
 */
export interface HistoryEntryDto {
  id: string;
  actor: { id: string; name: string; initials: string };
  action: string;
  detail?: string;
  comment?: string;
  timestamp: string;
  icon: string;
  iconColor: 'primary' | 'secondary' | 'muted';
}

export interface GroupMemberDto {
  id: string;
  name: string;
  initials: string;
  image?: string | null;
}

export interface GroupDto {
  id: string;
  name: string;
}

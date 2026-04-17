import type { GroupItemAuditEntry } from '@/domain/history';
import { GROUP_ITEM_AUDIT_CHANGE_KIND } from '@/domain/history';
import type { HistoryEntryDto } from './history-entry-dto';

function initials(name: string | undefined): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatTimestamp(date: Date): string {
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function describeChange(change: GroupItemAuditEntry['changes'][number]): {
  action: string;
  detail?: string;
  icon: string;
  iconColor: 'primary' | 'secondary' | 'muted';
} {
  switch (change.kind) {
    case GROUP_ITEM_AUDIT_CHANGE_KIND.STATUS:
      return {
        action: 'cambió el estado a',
        detail: change.after,
        icon: 'swap_horiz',
        iconColor: 'primary',
      };
    case GROUP_ITEM_AUDIT_CHANGE_KIND.PRIORITY:
      return {
        action: 'cambió la prioridad a',
        detail: change.after,
        icon: 'flag',
        iconColor: 'secondary',
      };
    case GROUP_ITEM_AUDIT_CHANGE_KIND.TITLE:
      return {
        action: 'renombró la tarea a',
        detail: change.after,
        icon: 'edit',
        iconColor: 'muted',
      };
    case GROUP_ITEM_AUDIT_CHANGE_KIND.ASSIGNEES:
      return {
        action: 'actualizó los asignados',
        icon: 'person',
        iconColor: 'secondary',
      };
    case GROUP_ITEM_AUDIT_CHANGE_KIND.LABELS:
      return {
        action: 'actualizó las etiquetas',
        icon: 'label',
        iconColor: 'muted',
      };
    case GROUP_ITEM_AUDIT_CHANGE_KIND.DATES:
      return {
        action: 'actualizó las fechas',
        icon: 'calendar_today',
        iconColor: 'secondary',
      };
    case GROUP_ITEM_AUDIT_CHANGE_KIND.COMPLETION:
      return {
        action: change.after.isCompleted ? 'completó la tarea' : 'reabrió la tarea',
        icon: 'check_circle',
        iconColor: 'primary',
      };
    case GROUP_ITEM_AUDIT_CHANGE_KIND.CANCELLATION:
      return {
        action: change.after.isCanceled ? 'canceló la tarea' : 'reactivó la tarea',
        icon: 'cancel',
        iconColor: 'muted',
      };
    default:
      return { action: 'realizó un cambio', icon: 'edit', iconColor: 'muted' };
  }
}

export function auditEntryToHistoryDto(entry: GroupItemAuditEntry): HistoryEntryDto[] {
  const actorName = entry.actor.displayName ?? entry.actor.email ?? 'Desconocido';
  const timestamp = formatTimestamp(entry.changedAt);
  const actor = {
    id: entry.actor.actorId as string,
    name: actorName,
    initials: initials(actorName),
  };

  return entry.changes.map((change, i) => {
    const { action, detail, icon, iconColor } = describeChange(change);
    return {
      id: `${entry.versionToken}-${i}`,
      actor,
      action,
      detail,
      timestamp,
      icon,
      iconColor,
    };
  });
}

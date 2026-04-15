/**
 * Date arithmetic utilities shared across seed, view-actions, and components.
 * Single source of truth — eliminates the duplicated date helpers scattered
 * across seed.ts, view-actions.ts, and mi-vista-page.tsx.
 */

const WEEKDAY_SHORT: Record<number, string> = {
  0: 'Dom', 1: 'Lun', 2: 'Mar', 3: 'Mié', 4: 'Jue', 5: 'Vie', 6: 'Sáb',
};

export class DateUtils {
  /** Returns today at midnight (00:00:00.000), optionally offset by days. */
  static today(offsetDays = 0): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    if (offsetDays !== 0) d.setDate(d.getDate() + offsetDays);
    return d;
  }

  static startOfToday(): Date {
    return DateUtils.today(0);
  }

  /** Returns end of day (23:59:59.999) for today + offsetDays. */
  static endOfDay(offsetDays = 0): Date {
    const d = DateUtils.today(offsetDays);
    d.setHours(23, 59, 59, 999);
    return d;
  }

  /** Returns the Sunday of the current week at midnight. */
  static startOfWeek(): Date {
    const d = DateUtils.today();
    d.setDate(d.getDate() - d.getDay());
    return d;
  }

  /** Returns the Saturday of the current week at 23:59:59.999. */
  static endOfWeek(): Date {
    const d = DateUtils.startOfWeek();
    d.setDate(d.getDate() + 6);
    d.setHours(23, 59, 59, 999);
    return d;
  }

  /**
   * Returns a short day label: "Lun 14 abr"
   */
  static formatShortDayLabel(date: Date): string {
    const dayNum = date.getDate();
    const weekday = WEEKDAY_SHORT[date.getDay()] ?? '';
    const month = date.toLocaleDateString('es-ES', { month: 'short' });
    return `${weekday} ${dayNum} ${month}`;
  }

  /**
   * Returns a long date label for page headers: "martes, 15 de abril"
   */
  static formatLongDateLabel(date: Date): string {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  }

  /**
   * Returns a compact date string: "15 abr 2026"
   */
  static formatCompactDate(date: Date): string {
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  /**
   * Returns semantic label for a due date relative to today:
   * 'today' | 'tomorrow' | 'overdue' | 'future'
   */
  static dueSemantic(date: Date): 'today' | 'tomorrow' | 'overdue' | 'future' {
    const now = DateUtils.today();
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const diffMs = d.getTime() - now.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'overdue';
    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'tomorrow';
    return 'future';
  }
}

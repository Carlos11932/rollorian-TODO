import { CalendarioPage } from '@/features/calendario/ui/calendario-page';
import { getCalendarMonthAction } from '@/features/calendario/actions/calendar-month-action';

export default async function CalendarioRoute() {
  const calendarData = await getCalendarMonthAction();

  return (
    <CalendarioPage
      days={calendarData.days}
      monthLabel={calendarData.monthLabel}
      todayDate={calendarData.todayDate}
      agendaItemsByDay={calendarData.agendaItemsByDay}
    />
  );
}

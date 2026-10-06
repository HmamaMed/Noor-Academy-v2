import { SessionSlot } from '../../core/models/session.model';

export interface ScheduledGroup { startDate: string; endDate: string; sessions: SessionSlot[]; }
export interface ScheduledSession<T> { group: T; session: SessionSlot; date: Date; }
const weekdays = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

// Group dates/times are wall-clock values. Until the academy supplies a timezone,
// dashboards explicitly label their device-local date and upcoming-session ordering.
export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
function sessionDate(day: Date, session: SessionSlot): Date {
  const result = new Date(day);
  const [hours, minutes, seconds = 0] = session.startTime.split(':').map(Number);
  result.setHours(hours, minutes, seconds, 0);
  return result;
}
export function nextSession<T extends ScheduledGroup>(groups: T[], now = new Date()): ScheduledSession<T> | null {
  const candidates = groups.flatMap((group) => {
    const firstDay = new Date(`${group.startDate}T00:00:00`);
    const from = firstDay > now ? firstDay : now;
    return group.sessions.flatMap((session) => {
      const day = new Date(from);
      day.setDate(day.getDate() + (weekdays.indexOf(session.dayOfWeek) - day.getDay() + 7) % 7);
      let date = sessionDate(day, session);
      if (date < now) { day.setDate(day.getDate() + 7); date = sessionDate(day, session); }
      return dateKey(date) <= group.endDate && dateKey(date) >= group.startDate ? [{ group, session, date }] : [];
    });
  });
  return candidates.sort((a, b) => a.date.getTime() - b.date.getTime())[0] ?? null;
}
export function weeklySessions<T extends ScheduledGroup>(groups: T[], now = new Date()): ScheduledSession<T>[] {
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(monday); day.setDate(monday.getDate() + index);
    const key = dateKey(day);
    return groups.filter((group) => group.startDate <= key && group.endDate >= key)
      .flatMap((group) => group.sessions.filter((session) => session.dayOfWeek === weekdays[day.getDay()])
        .map((session) => ({ group, session, date: sessionDate(day, session) })));
  }).flat().sort((a, b) => a.date.getTime() - b.date.getTime());
}

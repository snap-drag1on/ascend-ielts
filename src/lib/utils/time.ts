import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  differenceInMinutes,
  subDays,
  startOfWeek,
  endOfWeek,
  addDays,
} from "date-fns";

export function todayKey(d: Date = new Date()): string {
  return format(d, "yyyy-MM-dd");
}

export function fmtTime(hhmm: string): string {
  return hhmm;
}

export function minutesBetween(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return eh * 60 + em - (sh * 60 + sm);
}

export function nowHHMM(d: Date = new Date()): string {
  return format(d, "HH:mm");
}

export function hhmmToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function formatLongDate(d: Date = new Date()): string {
  return format(d, "EEEE, MMM d");
}

export function formatShortDay(d: Date = new Date()): string {
  return format(d, "EEE");
}

export function monthLabel(d: Date = new Date()): string {
  return format(d, "MMMM yyyy");
}

export function isToday(date: string): boolean {
  return isSameDay(parseISO(date), new Date());
}

export function daysInMonth(d: Date = new Date()): Date[] {
  return eachDayOfInterval({ start: startOfMonth(d), end: endOfMonth(d) });
}

export function lastNDays(n: number, from: Date = new Date()): Date[] {
  return Array.from({ length: n }, (_, i) => subDays(from, n - 1 - i));
}

export function thisWeekDays(d: Date = new Date()): Date[] {
  return eachDayOfInterval({
    start: startOfWeek(d, { weekStartsOn: 1 }),
    end: endOfWeek(d, { weekStartsOn: 1 }),
  });
}

export {
  format,
  parseISO,
  isSameDay,
  differenceInMinutes,
  subDays,
  addDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
};

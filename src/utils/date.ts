/** ローカルタイムゾーン基準の YYYY-MM-DD キー */
export function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayKey(now: Date = new Date()): string {
  return dateKey(now);
}

/** YYYY-MM-DD をローカル 0 時の Date に */
export function keyToDate(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export function addDaysKey(key: string, n: number): string {
  return dateKey(addDays(keyToDate(key), n));
}

/** b - a の日数(a, b は YYYY-MM-DD) */
export function daysBetweenKeys(a: string, b: string): number {
  const ms = keyToDate(b).getTime() - keyToDate(a).getTime();
  return Math.round(ms / 86400000);
}

export function minutesUntilMidnight(now: Date): number {
  const end = new Date(now);
  end.setHours(24, 0, 0, 0);
  return Math.max(0, Math.floor((end.getTime() - now.getTime()) / 60000));
}

export function formatHM(hour: number, minute: number): string {
  return `${hour}:${String(minute).padStart(2, '0')}`;
}

export function formatCountdown(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}時間${String(m).padStart(2, '0')}分`;
}

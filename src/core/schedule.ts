export type ScheduleKind = "daily" | "weekly";

export interface ScheduleConfig {
  daily: { hour: number };
  weekly: { weekday: number; hour: number };
}

export const DEFAULT_SCHEDULE: ScheduleConfig = {
  daily: { hour: 18 },
  weekly: { weekday: 6, hour: 9 },
};

// Start of the current period: calendar day for daily, week starting Sunday for weekly.
// Schedule math is UTC-based for determinism; per-user timezone is deferred until
// `users.timezone` is wired in (see index.aps.md open question on PL-002).
export function periodStart(kind: ScheduleKind, now: Date): Date {
  const start = new Date(now);
  start.setUTCHours(0, 0, 0, 0);
  if (kind === "weekly") {
    start.setUTCDate(start.getUTCDate() - start.getUTCDay());
  }
  return start;
}

// The scheduled moment within the current period.
export function scheduledTime(
  kind: ScheduleKind,
  now: Date,
  config: ScheduleConfig,
): Date {
  const time = new Date(now);
  if (kind === "daily") {
    time.setUTCHours(config.daily.hour, 0, 0, 0);
  } else {
    time.setUTCHours(config.weekly.hour, 0, 0, 0);
    time.setUTCDate(
      time.getUTCDate() + (config.weekly.weekday - time.getUTCDay()),
    );
  }
  return time;
}

export function isDue(
  kind: ScheduleKind,
  now: Date,
  lastCompletedAt: Date | null,
  config: ScheduleConfig,
): boolean {
  if (
    lastCompletedAt !== null &&
    lastCompletedAt.getTime() >= periodStart(kind, now).getTime()
  ) {
    return false;
  }
  return now.getTime() >= scheduledTime(kind, now, config).getTime();
}

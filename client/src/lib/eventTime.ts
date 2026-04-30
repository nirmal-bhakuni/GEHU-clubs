export function formatDuration(minutes?: number): string {
  const safeMinutes = Number(minutes);
  const totalMinutes = Number.isFinite(safeMinutes) && safeMinutes > 0 ? safeMinutes : 120;
  const hours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  if (hours > 0 && remainingMinutes > 0) return `${hours}h ${remainingMinutes}m`;
  if (hours > 0) return `${hours}h`;
  return `${totalMinutes}m`;
}

export function parseTimeToMinutes(value?: string): number | null {
  const input = String(value || "").trim().toLowerCase();
  if (!input) return null;
  const normalized = input.replace(/\./g, "").replace(/\s+/g, " ").replace(/(\d)(am|pm)$/, "$1 $2");
  const match = normalized.match(/^(\d{1,2})(?::(\d{1,2}))?\s*(am|pm)?$/);
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = Number(match[2] || 0);
  const meridiem = match[3];
  if (!Number.isInteger(hours) || !Number.isInteger(minutes) || minutes < 0 || minutes > 59) return null;

  if (meridiem) {
    if (hours < 1 || hours > 12) return null;
    if (hours === 12) hours = 0;
    if (meridiem === "pm") hours += 12;
  } else if (hours < 0 || hours > 23) {
    return null;
  }

  return hours * 60 + minutes;
}

export function formatMinutesAsTime(minutes: number): string {
  const normalized = ((minutes % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const mins = normalized % 60;
  const hour12 = hours % 12 || 12;
  const suffix = hours >= 12 ? "PM" : "AM";
  return `${hour12}:${String(mins).padStart(2, "0")} ${suffix}`;
}

export function formatEventTimeRange(time?: string, durationMinutes?: number): string {
  const start = parseTimeToMinutes(time);
  if (start === null) return time || "TBA";
  const duration = Math.max(1, Number(durationMinutes) || 120);
  return `${formatMinutesAsTime(start)} - ${formatMinutesAsTime(start + duration)}`;
}

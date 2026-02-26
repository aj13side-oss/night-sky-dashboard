export function utcToLocal(utcTime: string, date: Date, timezone: string): string {
  if (!utcTime || !timezone) return utcTime || "—";

  const [h, m] = utcTime.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return utcTime;

  const utcDate = new Date(Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    h, m, 0
  ));

  const formatted = utcDate.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
    hour12: false,
  });

  return formatted;
}

export function getTimezoneAbbr(date: Date, timezone: string): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "short",
    }).formatToParts(date);
    const tzPart = parts.find((p) => p.type === "timeZoneName");
    return tzPart?.value || timezone;
  } catch {
    return timezone;
  }
}

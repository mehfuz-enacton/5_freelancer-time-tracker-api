// Helper function to validate date format: DD-MM-YYYY HH:MM AM/PM
export const dateTimeFormatRegex = /^(\d{2})-(\d{2})-(\d{4})\s+(\d{1,2}):(\d{2})\s+(AM|PM)$/i;
export const dateRangeFormatRegex = /^(\d{2})-(\d{2})-(\d{4})$/;

// Helper function to parse user's datetime format to UTC Date
// Input: "10-02-2026 1:19 PM" (IST timezone assumed)
// Output: Date object in UTC
export function parseUserDateTime(dateString: string): Date | null {
  const match = dateString.match(dateTimeFormatRegex);
  if (!match) return null;

  const [, day, month, year, hourStr, minute, period] = match;

   if (!day || !month || !year || !hourStr || !minute || !period) {
    return null;
  }

  const d = parseInt(day, 10);
  const m = parseInt(month, 10) - 1;
  const y = parseInt(year, 10);
  let h = parseInt(hourStr, 10);
  const min = parseInt(minute, 10);

  if (period.toUpperCase() === "PM" && h !== 12) {
    h += 12;
  } else if (period.toUpperCase() === "AM" && h === 12) {
    h = 0;
  }

  const istOffsetMinutes = 5 * 60 + 30;
  const utcDate = new Date(Date.UTC(y, m, d, h, min) - (istOffsetMinutes * 60 * 1000));
  
  return utcDate;
}

// Helper function to format UTC Date to user's timezone format
// Input: Date object in UTC
// Output: "10-02-2026 1:19 PM" (in IST timezone)
export function formatToUserTimezone(utcDate: Date): string {
  const istOffsetMs = (5 * 60 + 30) * 60 * 1000;
  const istTimestamp = utcDate.getTime() + istOffsetMs;
  const istDate = new Date(istTimestamp);

  const day = String(istDate.getUTCDate()).padStart(2, '0');
  const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
  const year = istDate.getUTCFullYear();

  let hours = istDate.getUTCHours();
  const minutes = String(istDate.getUTCMinutes()).padStart(2, '0');
  const period = hours >= 12 ? 'PM' : 'AM';

  hours = hours % 12;
  hours = hours ? hours : 12;

  return `${day}-${month}-${year} ${hours}:${minutes} ${period}`;
}

// Helper function to parse date string DD-MM-YYYY to UTC Date objects
export function parseDateRange(dateStr: string): { start: Date; end: Date } | null {
  const match = dateStr.match(dateRangeFormatRegex);
  if (!match) return null;

  const [, day, month, year] = match;

   if (!day || !month || !year) {
    return null;
  }
  const d = parseInt(day, 10);
  const m = parseInt(month, 10) - 1;
  const y = parseInt(year, 10);
  
  // Create start of day (00:00:00 IST) → convert to UTC
  const istOffsetMs = (5 * 60 + 30) * 60 * 1000;
  const startUTC = new Date(Date.UTC(y, m, d, 0, 0, 0) - istOffsetMs);
  const endUTC = new Date(Date.UTC(y, m, d, 23, 59, 59) - istOffsetMs);
  
  return { start: startUTC, end: endUTC };
}
export const getStartOfWeek = (date: Date): Date => {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);

  return new Date(date.setDate(diff));
};

export const getEndOfWeek = (date: Date): Date => {
  const endOfWeek = new Date(date);
  endOfWeek.setDate(date.getDate() + (6 - date.getDay()));

  return endOfWeek;
};

export const getStartOfDay = (date: Date = new Date()): Date => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  return startOfDay;
};

export const getEndOfDay = (date: Date = new Date()): Date => {
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay;
};

export function calculatePreviousWeek() {
  const now = new Date();

  const startOfCurrentWeek = new Date(now.setDate(now.getDate() - now.getDay()));
  const endOfPreviousWeek = new Date(startOfCurrentWeek.setSeconds(-1));
  const startOfPreviousWeek = new Date(startOfCurrentWeek.setDate(startOfCurrentWeek.getDate() - 6));

  return {
    start: startOfPreviousWeek,
    end: endOfPreviousWeek,
  };
}

export const calculateStartAndEndOfWeek = (date: Date = new Date()): { start: Date; end: Date } => {
  const currentDate = new Date(date);

  const startOfWeek = new Date(currentDate);
  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

  const endOfWeek = new Date(currentDate);
  endOfWeek.setHours(23, 59, 59, 999);
  endOfWeek.setDate(endOfWeek.getDate() + (6 - endOfWeek.getDay()));

  return { start: startOfWeek, end: endOfWeek };
};

export const calculateStartAndEndOfMonth = (date: Date = new Date()): { start: Date; end: Date } => {
  const currentDate = new Date(date);

  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  startOfMonth.setHours(0, 0, 0, 0);

  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  endOfMonth.setHours(23, 59, 59, 999);

  return { start: startOfMonth, end: endOfMonth };
};

export const calculateStartAndEndOfDay = (startDate = new Date(), endDate = new Date()): { start: Date; end: Date } => {
  const currentDate = new Date(startDate);

  const startOfDay = new Date(currentDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(endDate);
  endOfDay.setHours(23, 59, 59, 999);

  return { start: startOfDay, end: endOfDay };
};

export const calculateValidityDate = (days = 90): Date => {
  const currentDate = new Date();
  const date = new Date(currentDate.setDate(currentDate.getDate() + days));

  return date;
};

/**
 * Create a UTC midnight date from year, month (0-based), day.
 */
export function utcMidnight(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
}

/**
 * Convert any Date to UTC midnight (strips time, no timezone shift).
 * Uses getUTC* so the server's local timezone has zero effect.
 */
export function toUTCMidnight(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/**
 * Today as UTC midnight. Same calendar date everywhere in the world
 * (within ~1 hour tolerance for WAT vs UTC — acceptable for daily operations).
 */
export function today(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/**
 * Add days to a date, returning UTC midnight.
 */
export function addDaysUTC(date: Date, days: number): Date {
  const ms = date.getTime() + days * 24 * 60 * 60 * 1000;
  const d = new Date(ms);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/**
 * daysFromDue: date + offset days → UTC midnight.
 */
export function daysFromDue(dueDate: Date, offsetDays: number): Date {
  return addDaysUTC(dueDate, offsetDays);
}

/**
 * Number of whole days between today (UTC) and dueDate (UTC).
 * Positive = overdue. Negative = before due.
 */
export function daysSinceDue(dueDate: Date): number {
  const todayMs = today().getTime();
  const dueMs = toUTCMidnight(dueDate).getTime();
  return Math.floor((todayMs - dueMs) / (24 * 60 * 60 * 1000));
}

// ─── Excel Date Parsing ─────────────────────────────────────
// With cellDates:false, xlsx gives dates as serial numbers (e.g. 46066).
// We convert them here with pure UTC integer math — no timezone traps.

export function parseExcelDate(value: string | Date | number): Date | null {
  if (value == null) return null;

  // ── Serial number (most common path with cellDates:false) ──
  // Excel serial: 1 = Jan 1, 1900. Has phantom Feb 29, 1900 (serial 60).
  if (typeof value === 'number' && value > 0) {
    // Correct for Excel's phantom Feb 29, 1900
    let serial = value;
    if (serial > 60) serial = serial - 1;
    // Serial 1 = Jan 1, 1900, so serial 0 = Dec 31, 1899
    const EPOCH = Date.UTC(1899, 11, 31); // Dec 31, 1899 00:00:00 UTC
    const ms = EPOCH + Math.round(serial) * 86400000;
    const d = new Date(ms);
    if (isNaN(d.getTime())) return null;
    // Snap to UTC midnight (in case of fractional serial)
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  }

  // ── Date object (fallback if cellDates:true is ever used) ──
  // xlsx with cellDates:true creates local-timezone Dates,
  // so use LOCAL getters to read the intended calendar date.
  if (value instanceof Date) {
    if (isNaN(value.getTime())) return null;
    return new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()));
  }

  // ── String ──
  const str = String(value).trim();
  if (!str || str.startsWith('=')) return null;

  // ISO: 2026-02-13 or 2026-02-13T...
  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    return new Date(Date.UTC(parseInt(y), parseInt(m) - 1, parseInt(d)));
  }

  // DD/MM/YYYY or DD-MM-YYYY (Nigerian/UK format)
  const ddmmyyyy = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (ddmmyyyy) {
    const [, dd, mm, yyyy] = ddmmyyyy;
    return new Date(Date.UTC(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd)));
  }

  return null;
}

// ─── Date Formatting ────────────────────────────────────────

export function formatDate(date: Date | null): string {
  if (!date) return '—';
  // Format in UTC to avoid timezone shift on display
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

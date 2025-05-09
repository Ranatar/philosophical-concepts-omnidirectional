/**
 * Utilities for formatting and handling dates
 * Provides consistent date formatting across the application
 */

// Date format constants
const DATE_FORMATS = {
  ISO: 'iso',
  SIMPLE: 'simple',
  READABLE: 'readable',
  SHORT: 'short',
  LONG: 'long',
  TIME: 'time',
  DATETIME: 'datetime',
  UNIX: 'unix',
  UNIX_MS: 'unix_ms'
};

/**
 * Format a date to ISO 8601 string (e.g., "2023-04-15T14:32:17.123Z")
 * @param {Date|string|number} date - Date to format
 * @returns {string} Formatted date string
 */
function toISOString(date) {
  return new Date(date).toISOString();
}

/**
 * Format a date to a simple date string (e.g., "2023-04-15")
 * @param {Date|string|number} date - Date to format
 * @returns {string} Formatted date string
 */
function toSimpleDate(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Format a date to a readable string (e.g., "April 15, 2023")
 * @param {Date|string|number} date - Date to format
 * @returns {string} Formatted date string
 */
function toReadableDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Format a date to a short string (e.g., "04/15/2023")
 * @param {Date|string|number} date - Date to format
 * @returns {string} Formatted date string
 */
function toShortDate(date) {
  return new Date(date).toLocaleDateString('en-US');
}

/**
 * Format a date to a long string (e.g., "Saturday, April 15, 2023")
 * @param {Date|string|number} date - Date to format
 * @returns {string} Formatted date string
 */
function toLongDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Format a date to a time string (e.g., "2:32 PM")
 * @param {Date|string|number} date - Date to format
 * @returns {string} Formatted time string
 */
function toTimeString(date) {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Format a date to a date and time string (e.g., "April 15, 2023, 2:32 PM")
 * @param {Date|string|number} date - Date to format
 * @returns {string} Formatted date and time string
 */
function toDateTimeString(date) {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Convert a date to Unix timestamp (seconds since epoch)
 * @param {Date|string|number} date - Date to convert
 * @returns {number} Unix timestamp in seconds
 */
function toUnixTimestamp(date) {
  return Math.floor(new Date(date).getTime() / 1000);
}

/**
 * Convert a date to Unix timestamp in milliseconds
 * @param {Date|string|number} date - Date to convert
 * @returns {number} Unix timestamp in milliseconds
 */
function toUnixTimestampMs(date) {
  return new Date(date).getTime();
}

/**
 * Format a date according to the specified format
 * @param {Date|string|number} date - Date to format
 * @param {string} format - Format to use (from DATE_FORMATS)
 * @returns {string|number} Formatted date
 */
function formatDate(date, format = DATE_FORMATS.ISO) {
  switch (format) {
    case DATE_FORMATS.ISO:
      return toISOString(date);
    case DATE_FORMATS.SIMPLE:
      return toSimpleDate(date);
    case DATE_FORMATS.READABLE:
      return toReadableDate(date);
    case DATE_FORMATS.SHORT:
      return toShortDate(date);
    case DATE_FORMATS.LONG:
      return toLongDate(date);
    case DATE_FORMATS.TIME:
      return toTimeString(date);
    case DATE_FORMATS.DATETIME:
      return toDateTimeString(date);
    case DATE_FORMATS.UNIX:
      return toUnixTimestamp(date);
    case DATE_FORMATS.UNIX_MS:
      return toUnixTimestampMs(date);
    default:
      return toISOString(date);
  }
}

/**
 * Get the current date and time formatted according to the specified format
 * @param {string} format - Format to use (from DATE_FORMATS)
 * @returns {string|number} Formatted current date and time
 */
function now(format = DATE_FORMATS.ISO) {
  return formatDate(new Date(), format);
}

/**
 * Check if a date is valid
 * @param {Date|string|number} date - Date to check
 * @returns {boolean} Whether the date is valid
 */
function isValidDate(date) {
  const d = new Date(date);
  return !isNaN(d.getTime());
}

/**
 * Add days to a date
 * @param {Date|string|number} date - Base date
 * @param {number} days - Number of days to add (can be negative)
 * @returns {Date} New date with days added
 */
function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Add months to a date
 * @param {Date|string|number} date - Base date
 * @param {number} months - Number of months to add (can be negative)
 * @returns {Date} New date with months added
 */
function addMonths(date, months) {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

/**
 * Add years to a date
 * @param {Date|string|number} date - Base date
 * @param {number} years - Number of years to add (can be negative)
 * @returns {Date} New date with years added
 */
function addYears(date, years) {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + years);
  return result;
}

/**
 * Calculate the difference between two dates in days
 * @param {Date|string|number} dateA - First date
 * @param {Date|string|number} dateB - Second date
 * @returns {number} Difference in days
 */
function diffInDays(dateA, dateB) {
  const a = new Date(dateA);
  const b = new Date(dateB);
  const diff = a.getTime() - b.getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

/**
 * Calculate the difference between two dates in months
 * @param {Date|string|number} dateA - First date
 * @param {Date|string|number} dateB - Second date
 * @returns {number} Difference in months
 */
function diffInMonths(dateA, dateB) {
  const a = new Date(dateA);
  const b = new Date(dateB);
  return (a.getFullYear() - b.getFullYear()) * 12 + (a.getMonth() - b.getMonth());
}

/**
 * Calculate the difference between two dates in years
 * @param {Date|string|number} dateA - First date
 * @param {Date|string|number} dateB - Second date
 * @returns {number} Difference in years
 */
function diffInYears(dateA, dateB) {
  const a = new Date(dateA);
  const b = new Date(dateB);
  return a.getFullYear() - b.getFullYear();
}

module.exports = {
  DATE_FORMATS,
  formatDate,
  now,
  isValidDate,
  addDays,
  addMonths,
  addYears,
  diffInDays,
  diffInMonths,
  diffInYears,
  toISOString,
  toSimpleDate,
  toReadableDate,
  toShortDate,
  toLongDate,
  toTimeString,
  toDateTimeString,
  toUnixTimestamp,
  toUnixTimestampMs
};

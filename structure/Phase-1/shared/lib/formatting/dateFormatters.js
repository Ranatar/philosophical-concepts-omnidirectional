/**
 * Date formatting utilities for the Philosophy Service
 * Provides consistent date formatting across all services
 */

const moment = require('moment');
const momentTimezone = require('moment-timezone');

// Default timezone for the application
const DEFAULT_TIMEZONE = process.env.TZ || 'UTC';

// Common date formats
const DATE_FORMATS = {
  ISO: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
  ISO_DATE: 'YYYY-MM-DD',
  ISO_TIME: 'HH:mm:ss',
  DISPLAY: 'MMMM D, YYYY',
  DISPLAY_WITH_TIME: 'MMMM D, YYYY h:mm A',
  SHORT: 'MM/DD/YYYY',
  SHORT_WITH_TIME: 'MM/DD/YYYY h:mm A',
  RELATIVE: 'relative', // Special format for relative time
  TIMESTAMP: 'x', // Unix timestamp in milliseconds
  UNIX: 'X', // Unix timestamp in seconds
  SQL: 'YYYY-MM-DD HH:mm:ss',
  FILENAME: 'YYYY-MM-DD_HH-mm-ss',
  LOG: 'YYYY-MM-DD HH:mm:ss.SSS',
  HUMAN: 'dddd, MMMM Do YYYY, h:mm:ss a'
};

// Philosophical era date ranges
const PHILOSOPHICAL_ERAS = {
  ANCIENT: { start: -800, end: 500, name: 'Ancient Philosophy' },
  MEDIEVAL: { start: 500, end: 1400, name: 'Medieval Philosophy' },
  RENAISSANCE: { start: 1400, end: 1600, name: 'Renaissance Philosophy' },
  MODERN: { start: 1600, end: 1900, name: 'Modern Philosophy' },
  CONTEMPORARY: { start: 1900, end: new Date().getFullYear(), name: 'Contemporary Philosophy' }
};

/**
 * Format a date to a specified format
 * @param {Date|string|number} date - The date to format
 * @param {string} format - The format to use (from DATE_FORMATS or custom)
 * @param {string} timezone - Timezone to use (optional)
 * @returns {string} Formatted date string
 */
function formatDate(date, format = DATE_FORMATS.ISO, timezone = DEFAULT_TIMEZONE) {
  if (!date) return '';
  
  const m = moment(date);
  
  if (!m.isValid()) {
    console.warn('Invalid date provided to formatDate:', date);
    return '';
  }
  
  // Handle timezone conversion
  const mtz = timezone ? m.tz(timezone) : m;
  
  // Handle relative format
  if (format === DATE_FORMATS.RELATIVE) {
    return mtz.fromNow();
  }
  
  // Use predefined format or custom format
  const formatString = DATE_FORMATS[format] || format;
  return mtz.format(formatString);
}

/**
 * Parse a date string with various formats
 * @param {string} dateString - The date string to parse
 * @param {string|array} format - Expected format(s) (optional)
 * @param {boolean} strict - Use strict parsing
 * @returns {Date|null} Parsed date or null if invalid
 */
function parseDate(dateString, format = null, strict = false) {
  if (!dateString) return null;
  
  let m;
  
  if (format) {
    m = moment(dateString, format, strict);
  } else {
    // Try multiple formats
    const formats = [
      moment.ISO_8601,
      DATE_FORMATS.SQL,
      DATE_FORMATS.SHORT,
      DATE_FORMATS.SHORT_WITH_TIME,
      'YYYY-MM-DD',
      'MM/DD/YYYY',
      'DD/MM/YYYY'
    ];
    m = moment(dateString, formats, strict);
  }
  
  return m.isValid() ? m.toDate() : null;
}

/**
 * Get the philosophical era for a given year
 * @param {number} year - The year to check
 * @returns {Object|null} Era object with name and period
 */
function getPhilosophicalEra(year) {
  for (const [key, era] of Object.entries(PHILOSOPHICAL_ERAS)) {
    if (year >= era.start && year <= era.end) {
      return {
        key,
        name: era.name,
        period: `${era.start} - ${era.end} CE`
      };
    }
  }
  
  // Handle BCE dates
  if (year < -800) {
    return {
      key: 'PRE_ANCIENT',
      name: 'Pre-Ancient Philosophy',
      period: `Before 800 BCE`
    };
  }
  
  return null;
}

/**
 * Format a date range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {string} format - Format to use
 * @param {Object} options - Additional options
 * @returns {string} Formatted date range
 */
function formatDateRange(startDate, endDate, format = DATE_FORMATS.DISPLAY, options = {}) {
  const {
    separator = ' - ',
    sameFormat = true,
    timezone = DEFAULT_TIMEZONE
  } = options;
  
  if (!startDate || !endDate) return '';
  
  const start = formatDate(startDate, format, timezone);
  const end = formatDate(endDate, format, timezone);
  
  // If dates are the same, return single date
  if (start === end && sameFormat) {
    return start;
  }
  
  // If same month and year, can abbreviate
  if (format === DATE_FORMATS.DISPLAY || format === DATE_FORMATS.SHORT) {
    const startM = moment(startDate).tz(timezone);
    const endM = moment(endDate).tz(timezone);
    
    if (startM.year() === endM.year() && startM.month() === endM.month()) {
      return `${startM.format('MMMM D')}${separator}${endM.format('D, YYYY')}`;
    }
  }
  
  return `${start}${separator}${end}`;
}

/**
 * Get time ago in human readable format
 * @param {Date} date - The date to compare
 * @param {boolean} withoutSuffix - Remove 'ago' suffix
 * @returns {string} Human readable time difference
 */
function timeAgo(date, withoutSuffix = false) {
  if (!date) return '';
  return moment(date).fromNow(withoutSuffix);
}

/**
 * Get time from now in human readable format
 * @param {Date} date - The date to compare
 * @param {boolean} withoutPrefix - Remove 'in' prefix
 * @returns {string} Human readable time difference
 */
function timeFromNow(date, withoutPrefix = false) {
  if (!date) return '';
  return moment(date).toNow(withoutPrefix);
}

/**
 * Get duration between two dates in human readable format
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {boolean} precise - Show precise duration
 * @returns {string} Human readable duration
 */
function getDuration(startDate, endDate, precise = false) {
  if (!startDate || !endDate) return '';
  
  const start = moment(startDate);
  const end = moment(endDate);
  const duration = moment.duration(end.diff(start));
  
  if (precise) {
    return duration.humanize(true);
  }
  
  const parts = [];
  const years = duration.years();
  const months = duration.months();
  const days = duration.days();
  const hours = duration.hours();
  const minutes = duration.minutes();
  
  if (years > 0) parts.push(`${years} year${years !== 1 ? 's' : ''}`);
  if (months > 0) parts.push(`${months} month${months !== 1 ? 's' : ''}`);
  if (days > 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`);
  if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
  if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
  
  return parts.join(', ') || 'less than a minute';
}

/**
 * Check if a date is within a range
 * @param {Date} date - Date to check
 * @param {Date} startDate - Start of range
 * @param {Date} endDate - End of range
 * @param {string} inclusivity - '()', '[)', '(]', or '[]'
 * @returns {boolean} Whether date is in range
 */
function isDateInRange(date, startDate, endDate, inclusivity = '[]') {
  if (!date || !startDate || !endDate) return false;
  return moment(date).isBetween(startDate, endDate, null, inclusivity);
}

/**
 * Add time to a date
 * @param {Date} date - Base date
 * @param {number} amount - Amount to add
 * @param {string} unit - Unit ('days', 'hours', 'minutes', etc.)
 * @returns {Date} New date
 */
function addToDate(date, amount, unit) {
  if (!date) return null;
  return moment(date).add(amount, unit).toDate();
}

/**
 * Subtract time from a date
 * @param {Date} date - Base date
 * @param {number} amount - Amount to subtract
 * @param {string} unit - Unit ('days', 'hours', 'minutes', etc.)
 * @returns {Date} New date
 */
function subtractFromDate(date, amount, unit) {
  if (!date) return null;
  return moment(date).subtract(amount, unit).toDate();
}

/**
 * Get start of a period
 * @param {Date} date - Base date
 * @param {string} unit - Unit ('day', 'week', 'month', 'year')
 * @returns {Date} Start of period
 */
function startOf(date, unit) {
  if (!date) return null;
  return moment(date).startOf(unit).toDate();
}

/**
 * Get end of a period
 * @param {Date} date - Base date
 * @param {string} unit - Unit ('day', 'week', 'month', 'year')
 * @returns {Date} End of period
 */
function endOf(date, unit) {
  if (!date) return null;
  return moment(date).endOf(unit).toDate();
}

/**
 * Format a philosopher's life span
 * @param {number} birthYear - Birth year (can be negative for BCE)
 * @param {number} deathYear - Death year (can be negative for BCE)
 * @returns {string} Formatted life span
 */
function formatPhilosopherLifespan(birthYear, deathYear) {
  if (!birthYear) return 'Unknown';
  
  const formatYear = (year) => {
    if (year < 0) {
      return `${Math.abs(year)} BCE`;
    }
    return `${year} CE`;
  };
  
  if (!deathYear) {
    return `Born ${formatYear(birthYear)}`;
  }
  
  const lifespan = Math.abs(deathYear - birthYear);
  return `${formatYear(birthYear)} - ${formatYear(deathYear)} (${lifespan} years)`;
}

/**
 * Get age from birth date
 * @param {Date} birthDate - Birth date
 * @param {Date} referenceDate - Reference date (defaults to now)
 * @returns {number} Age in years
 */
function getAge(birthDate, referenceDate = new Date()) {
  if (!birthDate) return null;
  return moment(referenceDate).diff(moment(birthDate), 'years');
}

/**
 * Convert date to different timezone
 * @param {Date} date - Date to convert
 * @param {string} fromTimezone - Source timezone
 * @param {string} toTimezone - Target timezone
 * @returns {Date} Converted date
 */
function convertTimezone(date, fromTimezone, toTimezone) {
  if (!date) return null;
  return moment.tz(date, fromTimezone).tz(toTimezone).toDate();
}

/**
 * Validate if a string is a valid date
 * @param {string} dateString - String to validate
 * @param {string} format - Expected format (optional)
 * @returns {boolean} Whether the string is a valid date
 */
function isValidDate(dateString, format = null) {
  if (!dateString) return false;
  const parsed = parseDate(dateString, format, true);
  return parsed !== null;
}

module.exports = {
  // Format constants
  DATE_FORMATS,
  PHILOSOPHICAL_ERAS,
  DEFAULT_TIMEZONE,
  
  // Core functions
  formatDate,
  parseDate,
  formatDateRange,
  
  // Relative time functions
  timeAgo,
  timeFromNow,
  getDuration,
  
  // Date manipulation
  addToDate,
  subtractFromDate,
  startOf,
  endOf,
  
  // Validation and comparison
  isDateInRange,
  isValidDate,
  
  // Specialized functions
  getPhilosophicalEra,
  formatPhilosopherLifespan,
  getAge,
  convertTimezone,
  
  // Convenience methods
  now: () => new Date(),
  today: () => startOf(new Date(), 'day'),
  yesterday: () => subtractFromDate(startOf(new Date(), 'day'), 1, 'day'),
  tomorrow: () => addToDate(startOf(new Date(), 'day'), 1, 'day'),
  
  // Moment.js instance for advanced usage
  moment,
  momentTimezone
};
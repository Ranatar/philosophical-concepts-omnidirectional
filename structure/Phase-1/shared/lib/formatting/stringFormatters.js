/**
 * Utilities for formatting and handling strings
 * Provides consistent string formatting across the application
 */

/**
 * Capitalize the first letter of a string
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
function capitalize(str) {
  if (!str || typeof str !== 'string') return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Capitalize the first letter of each word in a string
 * @param {string} str - String to convert
 * @returns {string} Title case string
 */
function toTitleCase(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Convert a string to camelCase
 * @param {string} str - String to convert
 * @returns {string} camelCase string
 */
function toCamelCase(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase());
}

/**
 * Convert a string to snake_case
 * @param {string} str - String to convert
 * @returns {string} snake_case string
 */
function toSnakeCase(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toLowerCase();
}

/**
 * Convert a string to kebab-case
 * @param {string} str - String to convert
 * @returns {string} kebab-case string
 */
function toKebabCase(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

/**
 * Convert a string to PascalCase
 * @param {string} str - String to convert
 * @returns {string} PascalCase string
 */
function toPascalCase(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .toLowerCase()
    .replace(new RegExp(/[-_]+/, 'g'), ' ')
    .replace(new RegExp(/[^\w\s]/, 'g'), '')
    .replace(
      new RegExp(/\s+(.)(\w*)/, 'g'),
      ($1, $2, $3) => `${$2.toUpperCase() + $3}`
    )
    .replace(new RegExp(/\w/), s => s.toUpperCase());
}

/**
 * Truncate a string to a specified length and add an ellipsis if truncated
 * @param {string} str - String to truncate
 * @param {number} length - Maximum length
 * @param {string} [ellipsis='...'] - String to append if truncated
 * @returns {string} Truncated string
 */
function truncate(str, length, ellipsis = '...') {
  if (!str || typeof str !== 'string') return '';
  if (str.length <= length) return str;
  return str.slice(0, length) + ellipsis;
}

/**
 * Strip HTML tags from a string
 * @param {string} str - String to strip
 * @returns {string} String without HTML tags
 */
function stripHtml(str) {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/<\/?[^>]+(>|$)/g, '');
}

/**
 * Escape HTML special characters in a string
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeHtml(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Remove extra whitespace from a string
 * @param {string} str - String to normalize
 * @returns {string} Normalized string
 */
function normalizeWhitespace(str) {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/\s+/g, ' ').trim();
}

/**
 * Generate a slug from a string (for URLs)
 * @param {string} str - String to convert
 * @returns {string} URL-friendly slug
 */
function slugify(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove non-word chars
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Generate an excerpt from a longer text
 * @param {string} text - Full text
 * @param {number} [length=150] - Excerpt length
 * @param {string} [ellipsis='...'] - String to append
 * @returns {string} Excerpt
 */
function excerpt(text, length = 150, ellipsis = '...') {
  if (!text || typeof text !== 'string') return '';
  
  // Strip HTML tags first
  const stripped = stripHtml(text);
  
  if (stripped.length <= length) return stripped;
  
  // Try to break at a space to avoid cutting words
  let excerpt = stripped.slice(0, length);
  const lastSpace = excerpt.lastIndexOf(' ');
  
  if (lastSpace > 0) {
    excerpt = excerpt.slice(0, lastSpace);
  }
  
  return excerpt + ellipsis;
}

/**
 * Pluralize a word based on count
 * @param {string} singular - Singular form
 * @param {string} plural - Plural form
 * @param {number} count - Count to base pluralization on
 * @returns {string} Appropriate form based on count
 */
function pluralize(singular, plural, count) {
  return count === 1 ? singular : plural;
}

/**
 * Format a number as a string with thousands separators
 * @param {number} num - Number to format
 * @param {string} [separator=','] - Thousands separator
 * @returns {string} Formatted number
 */
function formatNumber(num, separator = ',') {
  if (typeof num !== 'number') return '';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, separator);
}

/**
 * Convert a string to a number, returning NaN if conversion fails
 * @param {string} str - String to convert
 * @returns {number} Converted number or NaN
 */
function toNumber(str) {
  if (!str) return NaN;
  return Number(str);
}

/**
 * Check if a string is a valid UUID
 * @param {string} str - String to check
 * @returns {boolean} Whether the string is a valid UUID
 */
function isUuid(str) {
  if (!str || typeof str !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Check if a string is a valid email address
 * @param {string} str - String to check
 * @returns {boolean} Whether the string is a valid email
 */
function isEmail(str) {
  if (!str || typeof str !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(str);
}

/**
 * Check if a string contains only alphanumeric characters
 * @param {string} str - String to check
 * @returns {boolean} Whether the string is alphanumeric
 */
function isAlphanumeric(str) {
  if (!str || typeof str !== 'string') return false;
  return /^[a-z0-9]+$/i.test(str);
}

/**
 * Mask a sensitive string (e.g., credit card number, password)
 * @param {string} str - String to mask
 * @param {Object} options - Masking options
 * @param {number} [options.visibleStart=0] - Number of characters to show at start
 * @param {number} [options.visibleEnd=0] - Number of characters to show at end
 * @param {string} [options.mask='*'] - Character to use for masking
 * @returns {string} Masked string
 */
function maskString(str, { visibleStart = 0, visibleEnd = 0, mask = '*' } = {}) {
  if (!str || typeof str !== 'string') return '';
  
  if (str.length <= visibleStart + visibleEnd) {
    return str;
  }
  
  const start = str.slice(0, visibleStart);
  const end = str.slice(-visibleEnd);
  const masked = mask.repeat(str.length - visibleStart - visibleEnd);
  
  return start + masked + end;
}

module.exports = {
  capitalize,
  toTitleCase,
  toCamelCase,
  toSnakeCase,
  toKebabCase,
  toPascalCase,
  truncate,
  stripHtml,
  escapeHtml,
  normalizeWhitespace,
  slugify,
  excerpt,
  pluralize,
  formatNumber,
  toNumber,
  isUuid,
  isEmail,
  isAlphanumeric,
  maskString
};

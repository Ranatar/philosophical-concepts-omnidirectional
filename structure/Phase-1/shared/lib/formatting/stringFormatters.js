/**
 * String formatting utilities for the Philosophy Service
 * Provides consistent string formatting and manipulation
 */

const crypto = require('crypto');

/**
 * Capitalize first letter of a string
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
function capitalize(str) {
  if (!str || typeof str !== 'string') return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Capitalize first letter of each word
 * @param {string} str - String to title case
 * @param {string[]} exceptions - Words to keep lowercase
 * @returns {string} Title cased string
 */
function titleCase(str, exceptions = ['a', 'an', 'and', 'as', 'at', 'by', 'for', 'in', 'of', 'on', 'or', 'the', 'to', 'with']) {
  if (!str || typeof str !== 'string') return '';
  
  return str
    .toLowerCase()
    .split(' ')
    .map((word, index) => {
      // Always capitalize first and last word
      if (index === 0 || index === str.split(' ').length - 1) {
        return capitalize(word);
      }
      // Check if word is in exceptions
      if (exceptions.includes(word)) {
        return word;
      }
      return capitalize(word);
    })
    .join(' ');
}

/**
 * Convert string to camelCase
 * @param {string} str - String to convert
 * @returns {string} camelCase string
 */
function camelCase(str) {
  if (!str || typeof str !== 'string') return '';
  
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
      return index === 0 ? word.toLowerCase() : word.toUpperCase();
    })
    .replace(/\s+/g, '');
}

/**
 * Convert string to snake_case
 * @param {string} str - String to convert
 * @returns {string} snake_case string
 */
function snakeCase(str) {
  if (!str || typeof str !== 'string') return '';
  
  return str
    .replace(/\W+/g, ' ')
    .split(/ |\B(?=[A-Z])/)
    .map(word => word.toLowerCase())
    .join('_');
}

/**
 * Convert string to kebab-case
 * @param {string} str - String to convert
 * @returns {string} kebab-case string
 */
function kebabCase(str) {
  if (!str || typeof str !== 'string') return '';
  
  return str
    .replace(/\W+/g, ' ')
    .split(/ |\B(?=[A-Z])/)
    .map(word => word.toLowerCase())
    .join('-');
}

/**
 * Truncate string to specified length
 * @param {string} str - String to truncate
 * @param {number} length - Maximum length
 * @param {string} suffix - Suffix to add (default: '...')
 * @returns {string} Truncated string
 */
function truncate(str, length, suffix = '...') {
  if (!str || typeof str !== 'string') return '';
  if (str.length <= length) return str;
  
  return str.substring(0, length - suffix.length) + suffix;
}

/**
 * Truncate string at word boundary
 * @param {string} str - String to truncate
 * @param {number} length - Maximum length
 * @param {string} suffix - Suffix to add
 * @returns {string} Truncated string
 */
function truncateWords(str, length, suffix = '...') {
  if (!str || typeof str !== 'string') return '';
  if (str.length <= length) return str;
  
  const truncated = str.substring(0, length - suffix.length);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > 0) {
    return truncated.substring(0, lastSpace) + suffix;
  }
  
  return truncated + suffix;
}

/**
 * Generate slug from string
 * @param {string} str - String to slugify
 * @param {Object} options - Slugify options
 * @returns {string} Slugified string
 */
function slugify(str, options = {}) {
  const {
    separator = '-',
    lowercase = true,
    strict = false,
    trim = true
  } = options;
  
  if (!str || typeof str !== 'string') return '';
  
  let slug = str;
  
  if (trim) {
    slug = slug.trim();
  }
  
  // Replace special characters
  slug = slug
    .normalize('NFD') // Normalize unicode
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^\w\s-]/g, separator) // Replace non-word chars
    .replace(/[\s_-]+/g, separator) // Replace spaces, underscores, hyphens
    .replace(new RegExp(`^${separator}+|${separator}+$`, 'g'), ''); // Remove leading/trailing separators
  
  if (lowercase) {
    slug = slug.toLowerCase();
  }
  
  if (strict) {
    slug = slug.replace(new RegExp(`[^a-z0-9${separator}]`, 'g'), '');
  }
  
  return slug;
}

/**
 * Remove HTML tags from string
 * @param {string} str - String with HTML
 * @returns {string} String without HTML tags
 */
function stripHtml(str) {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '');
}

/**
 * Escape HTML special characters
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeHtml(str) {
  if (!str || typeof str !== 'string') return '';
  
  const htmlEscapes = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  };
  
  return str.replace(/[&<>"'/]/g, char => htmlEscapes[char]);
}

/**
 * Unescape HTML special characters
 * @param {string} str - String to unescape
 * @returns {string} Unescaped string
 */
function unescapeHtml(str) {
  if (!str || typeof str !== 'string') return '';
  
  const htmlUnescapes = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#x27;': "'",
    '&#x2F;': '/'
  };
  
  return str.replace(/&(?:amp|lt|gt|quot|#x27|#x2F);/g, entity => htmlUnescapes[entity]);
}

/**
 * Generate random string
 * @param {number} length - Length of string
 * @param {string} charset - Character set to use
 * @returns {string} Random string
 */
function randomString(length = 8, charset = 'alphanumeric') {
  const charsets = {
    alphanumeric: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
    alphabetic: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
    numeric: '0123456789',
    hex: '0123456789abcdef',
    custom: charset
  };
  
  const chars = charsets[charset] || charsets.alphanumeric;
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

/**
 * Generate hash from string
 * @param {string} str - String to hash
 * @param {string} algorithm - Hash algorithm (default: sha256)
 * @returns {string} Hex hash
 */
function hash(str, algorithm = 'sha256') {
  if (!str || typeof str !== 'string') return '';
  return crypto.createHash(algorithm).update(str).digest('hex');
}

/**
 * Format bytes to human readable string
 * @param {number} bytes - Number of bytes
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted string
 */
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Format number with thousands separator
 * @param {number} num - Number to format
 * @param {string} separator - Separator character
 * @returns {string} Formatted number
 */
function formatNumber(num, separator = ',') {
  if (num === null || num === undefined) return '';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, separator);
}

/**
 * Pluralize a word
 * @param {number} count - Count
 * @param {string} singular - Singular form
 * @param {string} plural - Plural form (optional)
 * @returns {string} Pluralized string
 */
function pluralize(count, singular, plural = null) {
  if (count === 1) return `${count} ${singular}`;
  return `${count} ${plural || singular + 's'}`;
}

/**
 * Extract initials from name
 * @param {string} name - Full name
 * @param {number} limit - Maximum initials
 * @returns {string} Initials
 */
function getInitials(name, limit = 2) {
  if (!name || typeof name !== 'string') return '';
  
  const parts = name.trim().split(/\s+/);
  const initials = parts
    .map(part => part.charAt(0).toUpperCase())
    .slice(0, limit)
    .join('');
  
  return initials;
}

/**
 * Mask sensitive string
 * @param {string} str - String to mask
 * @param {number} showStart - Characters to show at start
 * @param {number} showEnd - Characters to show at end
 * @param {string} maskChar - Character to use for masking
 * @returns {string} Masked string
 */
function mask(str, showStart = 4, showEnd = 4, maskChar = '*') {
  if (!str || typeof str !== 'string') return '';
  if (str.length <= showStart + showEnd) return str;
  
  const start = str.substring(0, showStart);
  const end = str.substring(str.length - showEnd);
  const middle = maskChar.repeat(str.length - showStart - showEnd);
  
  return start + middle + end;
}

/**
 * Parse query string into object
 * @param {string} queryString - Query string
 * @returns {Object} Parsed query object
 */
function parseQueryString(queryString) {
  if (!queryString || typeof queryString !== 'string') return {};
  
  const query = queryString.startsWith('?') ? queryString.slice(1) : queryString;
  const params = new URLSearchParams(query);
  const result = {};
  
  for (const [key, value] of params) {
    if (result[key]) {
      if (Array.isArray(result[key])) {
        result[key].push(value);
      } else {
        result[key] = [result[key], value];
      }
    } else {
      result[key] = value;
    }
  }
  
  return result;
}

/**
 * Build query string from object
 * @param {Object} params - Parameters object
 * @returns {string} Query string
 */
function buildQueryString(params) {
  if (!params || typeof params !== 'object') return '';
  
  const searchParams = new URLSearchParams();
  
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) continue;
    
    if (Array.isArray(value)) {
      value.forEach(v => searchParams.append(key, v));
    } else {
      searchParams.append(key, value);
    }
  }
  
  const query = searchParams.toString();
  return query ? '?' + query : '';
}

/**
 * Format philosophical concept name
 * @param {string} name - Concept name
 * @returns {string} Formatted name
 */
function formatConceptName(name) {
  if (!name || typeof name !== 'string') return '';
  
  // Handle special philosophical terms
  const specialTerms = {
    'a priori': 'A Priori',
    'a posteriori': 'A Posteriori',
    'ex nihilo': 'Ex Nihilo',
    'in itself': 'In Itself',
    'for itself': 'For Itself'
  };
  
  const lower = name.toLowerCase();
  if (specialTerms[lower]) {
    return specialTerms[lower];
  }
  
  // Otherwise use title case
  return titleCase(name);
}

/**
 * Remove extra whitespace from string
 * @param {string} str - String to clean
 * @returns {string} Cleaned string
 */
function cleanWhitespace(str) {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/\s+/g, ' ').trim();
}

module.exports = {
  // Case conversion
  capitalize,
  titleCase,
  camelCase,
  snakeCase,
  kebabCase,
  
  // Truncation
  truncate,
  truncateWords,
  
  // URL and slug
  slugify,
  parseQueryString,
  buildQueryString,
  
  // HTML
  stripHtml,
  escapeHtml,
  unescapeHtml,
  
  // Generation
  randomString,
  hash,
  
  // Formatting
  formatBytes,
  formatNumber,
  pluralize,
  getInitials,
  mask,
  formatConceptName,
  
  // Utilities
  cleanWhitespace
};
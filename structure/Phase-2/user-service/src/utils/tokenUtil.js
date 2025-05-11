/**
 * Token Utility Functions
 */

const crypto = require('crypto');

/**
 * Generate a secure random token
 * @param {number} length - Length of the token in bytes
 * @returns {string} Hex encoded token
 */
function generateToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate a secure API key
 * @param {string} prefix - Prefix for the API key
 * @returns {string} API key
 */
function generateApiKey(prefix = 'pk') {
  const token = crypto.randomBytes(32).toString('hex');
  return `${prefix}_${token}`;
}

/**
 * Generate a session ID
 * @returns {string} Session ID
 */
function generateSessionId() {
  return crypto.randomBytes(32).toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Hash a token using SHA-256
 * @param {string} token - Token to hash
 * @returns {string} Hashed token
 */
function hashToken(token) {
  return crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
}

/**
 * Extract token from authorization header
 * @param {string} authHeader - Authorization header
 * @returns {string|null} Extracted token or null
 */
function extractBearerToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.substring(7);
}

/**
 * Extract token from cookie
 * @param {Object} cookies - Cookie object
 * @param {string} cookieName - Name of the cookie
 * @returns {string|null} Extracted token or null
 */
function extractTokenFromCookie(cookies, cookieName) {
  return cookies && cookies[cookieName] ? cookies[cookieName] : null;
}

/**
 * Parse JWT without verifying (for getting metadata)
 * @param {string} token - JWT token
 * @returns {Object|null} Parsed payload or null
 */
function parseJWT(token) {
  try {
    const parts = token.split('.');
    
    if (parts.length !== 3) {
      return null;
    }
    
    const payload = parts[1];
    const decoded = Buffer.from(payload, 'base64').toString('utf8');
    
    return JSON.parse(decoded);
  } catch (error) {
    return null;
  }
}

/**
 * Check if JWT is expired (without verifying signature)
 * @param {string} token - JWT token
 * @returns {boolean} Whether token is expired
 */
function isJWTExpired(token) {
  const payload = parseJWT(token);
  
  if (!payload || !payload.exp) {
    return true;
  }
  
  // exp is in seconds, Date.now() is in milliseconds
  return payload.exp * 1000 < Date.now();
}

/**
 * Get remaining time for token expiration
 * @param {string} token - JWT token
 * @returns {number} Seconds until expiration (negative if expired)
 */
function getTokenTimeRemaining(token) {
  const payload = parseJWT(token);
  
  if (!payload || !payload.exp) {
    return -1;
  }
  
  // exp is in seconds, Date.now() is in milliseconds
  return Math.floor(payload.exp - Date.now() / 1000);
}

/**
 * Generate CSRF token
 * @returns {Object} CSRF token and its hash
 */
function generateCSRFToken() {
  const token = generateToken(32);
  const hash = hashToken(token);
  
  return { token, hash };
}

/**
 * Verify CSRF token
 * @param {string} token - CSRF token
 * @param {string} hash - CSRF hash
 * @returns {boolean} Whether token is valid
 */
function verifyCSRFToken(token, hash) {
  if (!token || !hash) {
    return false;
  }
  
  const expectedHash = hashToken(token);
  
  // Use constant time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(expectedHash),
    Buffer.from(hash)
  );
}

/**
 * Generate a short-lived OTP (One-Time Password)
 * @param {number} length - Length of the OTP
 * @param {number} validitySeconds - How long the OTP is valid
 * @returns {Object} OTP and expiration time
 */
function generateOTP(length = 6, validitySeconds = 300) {
  const digits = '0123456789';
  let otp = '';
  
  for (let i = 0; i < length; i++) {
    otp += digits[crypto.randomInt(0, digits.length)];
  }
  
  const expiresAt = new Date(Date.now() + validitySeconds * 1000);
  
  return { otp, expiresAt };
}

/**
 * Generate a device token for device identification
 * @returns {string} Device token
 */
function generateDeviceToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate OAuth state parameter
 * @returns {string} State parameter
 */
function generateOAuthState() {
  return crypto.randomBytes(32).toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Create an expiration date
 * @param {number} seconds - Seconds from now
 * @returns {Date} Expiration date
 */
function createExpirationDate(seconds) {
  return new Date(Date.now() + seconds * 1000);
}

/**
 * Check if a date has passed
 * @param {Date|string} date - Date to check
 * @returns {boolean} Whether the date has passed
 */
function hasExpired(date) {
  const expirationDate = date instanceof Date ? date : new Date(date);
  return expirationDate < new Date();
}

/**
 * Generate a signed token with HMAC
 * @param {string} data - Data to sign
 * @param {string} secret - Secret key
 * @returns {string} Signed token
 */
function generateSignedToken(data, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(data);
  const signature = hmac.digest('hex');
  
  return `${data}.${signature}`;
}

/**
 * Verify a signed token
 * @param {string} token - Signed token
 * @param {string} secret - Secret key
 * @returns {string|null} Original data if valid, null otherwise
 */
function verifySignedToken(token, secret) {
  const parts = token.split('.');
  
  if (parts.length !== 2) {
    return null;
  }
  
  const [data, signature] = parts;
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(data);
  const expectedSignature = hmac.digest('hex');
  
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return null;
  }
  
  return data;
}

module.exports = {
  generateToken,
  generateApiKey,
  generateSessionId,
  hashToken,
  extractBearerToken,
  extractTokenFromCookie,
  parseJWT,
  isJWTExpired,
  getTokenTimeRemaining,
  generateCSRFToken,
  verifyCSRFToken,
  generateOTP,
  generateDeviceToken,
  generateOAuthState,
  createExpirationDate,
  hasExpired,
  generateSignedToken,
  verifySignedToken
};

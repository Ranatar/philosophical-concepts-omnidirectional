/**
 * Password Utility Functions
 */

const crypto = require('crypto');

/**
 * Generate a secure random password reset token
 * @returns {string} Password reset token
 */
function generateResetToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate a secure verification code
 * @param {number} length - Length of the code
 * @returns {string} Verification code
 */
function generateVerificationCode(length = 6) {
  const characters = '0123456789';
  let code = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, characters.length);
    code += characters[randomIndex];
  }
  
  return code;
}

/**
 * Generate a secure random salt
 * @param {number} length - Length of the salt in bytes
 * @returns {string} Hex encoded salt
 */
function generateSalt(length = 16) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Hash a token or code with SHA-256
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
 * Generate a secure temporary password
 * @param {number} length - Length of the password
 * @returns {string} Temporary password
 */
function generateTemporaryPassword(length = 12) {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*';
  
  const allChars = uppercase + lowercase + numbers + special;
  let password = '';
  
  // Ensure at least one character from each set
  password += uppercase[crypto.randomInt(0, uppercase.length)];
  password += lowercase[crypto.randomInt(0, lowercase.length)];
  password += numbers[crypto.randomInt(0, numbers.length)];
  password += special[crypto.randomInt(0, special.length)];
  
  // Fill the rest
  for (let i = password.length; i < length; i++) {
    password += allChars[crypto.randomInt(0, allChars.length)];
  }
  
  // Shuffle the password
  const passwordArray = password.split('');
  for (let i = passwordArray.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [passwordArray[i], passwordArray[j]] = [passwordArray[j], passwordArray[i]];
  }
  
  return passwordArray.join('');
}

/**
 * Compare two strings in constant time
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {boolean} Whether strings are equal
 */
function constantTimeCompare(a, b) {
  if (!a || !b || a.length !== b.length) {
    return false;
  }
  
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/**
 * Mask email address for security
 * @param {string} email - Email address
 * @returns {string} Masked email
 */
function maskEmail(email) {
  if (!email || !email.includes('@')) {
    return email;
  }
  
  const [localPart, domain] = email.split('@');
  
  if (localPart.length <= 3) {
    return localPart.charAt(0) + '*'.repeat(localPart.length - 1) + '@' + domain;
  }
  
  return localPart.substring(0, 2) + '*'.repeat(localPart.length - 3) + localPart.charAt(localPart.length - 1) + '@' + domain;
}

/**
 * Calculate password entropy
 * @param {string} password - Password to calculate entropy for
 * @returns {number} Entropy in bits
 */
function calculatePasswordEntropy(password) {
  if (!password) return 0;
  
  // Count character types
  let charsetSize = 0;
  
  if (/[a-z]/.test(password)) charsetSize += 26;
  if (/[A-Z]/.test(password)) charsetSize += 26;
  if (/[0-9]/.test(password)) charsetSize += 10;
  if (/[^a-zA-Z0-9]/.test(password)) charsetSize += 32; // Assuming common special characters
  
  // Calculate entropy: log2(charsetSize^passwordLength)
  const entropy = password.length * Math.log2(charsetSize);
  
  return Math.round(entropy * 100) / 100;
}

/**
 * Check if password is in common password list
 * @param {string} password - Password to check
 * @returns {boolean} Whether password is common
 */
function isCommonPassword(password) {
  // This is a very basic implementation
  // In production, you'd want to check against a more comprehensive list
  const commonPasswords = [
    'password', '123456', '12345678', 'qwerty', 'abc123',
    'password1', '12345', '1234567', '123456789', '1234',
    'qwerty123', '1q2w3e', 'admin', 'welcome', 'letmein',
    'monkey', 'dragon', '111111', 'baseball', 'iloveyou',
    'trustno1', '1234567', 'sunshine', 'master', 'hello',
    'freedom', 'whatever', 'qazwsx', 'ninja', 'mustang',
    'password123', 'letmein123', 'admin123', 'welcome123', 'abc123'
  ];
  
  return commonPasswords.includes(password.toLowerCase());
}

/**
 * Validate password requirements
 * @param {string} password - Password to validate
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
function validatePassword(password, options = {}) {
  const {
    minLength = 8,
    maxLength = 128,
    requireUppercase = true,
    requireLowercase = true,
    requireNumbers = true,
    requireSpecial = true,
    checkCommon = true,
    checkEntropy = true,
    minEntropy = 40
  } = options;
  
  const result = {
    isValid: true,
    errors: [],
    score: 0,
    feedback: []
  };
  
  // Check length
  if (password.length < minLength) {
    result.isValid = false;
    result.errors.push(`Password must be at least ${minLength} characters long`);
  } else {
    result.score += 1;
  }
  
  if (password.length > maxLength) {
    result.isValid = false;
    result.errors.push(`Password must not exceed ${maxLength} characters`);
  }
  
  // Check character requirements
  if (requireUppercase && !/[A-Z]/.test(password)) {
    result.isValid = false;
    result.errors.push('Password must contain at least one uppercase letter');
  } else if (requireUppercase) {
    result.score += 1;
  }
  
  if (requireLowercase && !/[a-z]/.test(password)) {
    result.isValid = false;
    result.errors.push('Password must contain at least one lowercase letter');
  } else if (requireLowercase) {
    result.score += 1;
  }
  
  if (requireNumbers && !/[0-9]/.test(password)) {
    result.isValid = false;
    result.errors.push('Password must contain at least one number');
  } else if (requireNumbers) {
    result.score += 1;
  }
  
  if (requireSpecial && !/[^a-zA-Z0-9]/.test(password)) {
    result.isValid = false;
    result.errors.push('Password must contain at least one special character');
  } else if (requireSpecial) {
    result.score += 1;
  }
  
  // Check common passwords
  if (checkCommon && isCommonPassword(password)) {
    result.isValid = false;
    result.errors.push('This password is too common');
    result.feedback.push('Use a more unique password');
  }
  
  // Check entropy
  if (checkEntropy) {
    const entropy = calculatePasswordEntropy(password);
    result.entropy = entropy;
    
    if (entropy < minEntropy) {
      result.isValid = false;
      result.errors.push('Password is not complex enough');
      result.feedback.push('Use a mix of different character types and make it longer');
    } else {
      result.score += Math.floor(entropy / 20); // Bonus points for high entropy
    }
  }
  
  // Additional feedback
  if (password.length >= 12) {
    result.score += 1;
    result.feedback.push('Good password length');
  }
  
  if (password.length >= 16) {
    result.score += 1;
    result.feedback.push('Excellent password length');
  }
  
  // Calculate strength level
  if (result.score >= 8) {
    result.strength = 'Very Strong';
  } else if (result.score >= 6) {
    result.strength = 'Strong';
  } else if (result.score >= 4) {
    result.strength = 'Moderate';
  } else if (result.score >= 2) {
    result.strength = 'Weak';
  } else {
    result.strength = 'Very Weak';
  }
  
  return result;
}

module.exports = {
  generateResetToken,
  generateVerificationCode,
  generateSalt,
  hashToken,
  generateTemporaryPassword,
  constantTimeCompare,
  maskEmail,
  calculatePasswordEntropy,
  isCommonPassword,
  validatePassword
};

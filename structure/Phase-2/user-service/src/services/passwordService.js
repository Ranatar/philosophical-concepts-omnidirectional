/**
 * Password Service
 * Business logic for password management
 */

const bcrypt = require('bcrypt');
const { defaultLogger } = require('../../../shared/lib/logging/logger');
const config = require('../config');

class PasswordService {
  constructor(logger = defaultLogger) {
    this.logger = logger;
    this.saltRounds = config.bcrypt.saltRounds;
    this.minLength = 8;
    this.maxLength = 128;
  }

  /**
   * Hash a password
   * @param {string} password - Plain text password
   * @returns {Promise<string>} Hashed password
   */
  async hashPassword(password) {
    try {
      const salt = await bcrypt.genSalt(this.saltRounds);
      const hash = await bcrypt.hash(password, salt);
      return hash;
    } catch (error) {
      this.logger.error('Error hashing password:', error);
      throw error;
    }
  }

  /**
   * Verify a password against a hash
   * @param {string} password - Plain text password
   * @param {string} hash - Hashed password
   * @returns {Promise<boolean>} Whether password matches hash
   */
  async verifyPassword(password, hash) {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      this.logger.error('Error verifying password:', error);
      throw error;
    }
  }

  /**
   * Validate password strength
   * @param {string} password - Password to validate
   * @returns {boolean} Whether password meets requirements
   */
  validatePasswordStrength(password) {
    if (!password || typeof password !== 'string') {
      return false;
    }

    // Check length
    if (password.length < this.minLength || password.length > this.maxLength) {
      return false;
    }

    // Check for required character types
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasDigit = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    return hasUpperCase && hasLowerCase && hasDigit && hasSpecial;
  }

  /**
   * Get password strength score
   * @param {string} password - Password to score
   * @returns {Object} Password strength score and feedback
   */
  getPasswordStrength(password) {
    const feedback = {
      score: 0,
      strength: 'Very Weak',
      feedback: [],
      requirements: {
        length: false,
        uppercase: false,
        lowercase: false,
        digit: false,
        special: false
      }
    };

    if (!password || typeof password !== 'string') {
      feedback.feedback.push('Password is required');
      return feedback;
    }

    // Check length
    if (password.length >= this.minLength) {
      feedback.score += 1;
      feedback.requirements.length = true;
    } else {
      feedback.feedback.push(`Password must be at least ${this.minLength} characters long`);
    }

    // Check for uppercase
    if (/[A-Z]/.test(password)) {
      feedback.score += 1;
      feedback.requirements.uppercase = true;
    } else {
      feedback.feedback.push('Password must contain at least one uppercase letter');
    }

    // Check for lowercase
    if (/[a-z]/.test(password)) {
      feedback.score += 1;
      feedback.requirements.lowercase = true;
    } else {
      feedback.feedback.push('Password must contain at least one lowercase letter');
    }

    // Check for digit
    if (/\d/.test(password)) {
      feedback.score += 1;
      feedback.requirements.digit = true;
    } else {
      feedback.feedback.push('Password must contain at least one number');
    }

    // Check for special character
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      feedback.score += 1;
      feedback.requirements.special = true;
    } else {
      feedback.feedback.push('Password must contain at least one special character');
    }

    // Bonus points for length
    if (password.length >= 12) {
      feedback.score += 1;
    }
    if (password.length >= 16) {
      feedback.score += 1;
    }

    // Determine strength level
    if (feedback.score <= 2) {
      feedback.strength = 'Very Weak';
    } else if (feedback.score === 3) {
      feedback.strength = 'Weak';
    } else if (feedback.score === 4) {
      feedback.strength = 'Moderate';
    } else if (feedback.score === 5) {
      feedback.strength = 'Strong';
    } else {
      feedback.strength = 'Very Strong';
    }

    return feedback;
  }

  /**
   * Generate a random password
   * @param {Object} options - Password generation options
   * @returns {string} Generated password
   */
  generatePassword(options = {}) {
    const {
      length = 16,
      includeUppercase = true,
      includeLowercase = true,
      includeNumbers = true,
      includeSpecial = true,
      excludeSimilar = true,
      excludeAmbiguous = true
    } = options;

    let charset = '';
    let password = '';

    // Character sets
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    // Similar characters that can be confused
    const similar = 'il1Lo0O';
    // Ambiguous characters
    const ambiguous = '{}[]()/\\\'"`~,;:.<>';

    // Build character set
    if (includeLowercase) {
      charset += lowercase;
    }
    if (includeUppercase) {
      charset += uppercase;
    }
    if (includeNumbers) {
      charset += numbers;
    }
    if (includeSpecial) {
      charset += special;
    }

    // Remove similar characters if requested
    if (excludeSimilar) {
      charset = charset.split('').filter(char => !similar.includes(char)).join('');
    }

    // Remove ambiguous characters if requested
    if (excludeAmbiguous && includeSpecial) {
      charset = charset.split('').filter(char => !ambiguous.includes(char)).join('');
    }

    // Generate password
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }

    // Ensure at least one character from each requested type
    const requiredChars = [];
    if (includeLowercase) {
      const filtered = lowercase.split('').filter(char => 
        (!excludeSimilar || !similar.includes(char))
      );
      requiredChars.push(filtered[Math.floor(Math.random() * filtered.length)]);
    }
    if (includeUppercase) {
      const filtered = uppercase.split('').filter(char => 
        (!excludeSimilar || !similar.includes(char))
      );
      requiredChars.push(filtered[Math.floor(Math.random() * filtered.length)]);
    }
    if (includeNumbers) {
      const filtered = numbers.split('').filter(char => 
        (!excludeSimilar || !similar.includes(char))
      );
      requiredChars.push(filtered[Math.floor(Math.random() * filtered.length)]);
    }
    if (includeSpecial) {
      const filtered = special.split('').filter(char => 
        (!excludeAmbiguous || !ambiguous.includes(char))
      );
      requiredChars.push(filtered[Math.floor(Math.random() * filtered.length)]);
    }

    // Replace random characters with required ones
    const passwordArray = password.split('');
    requiredChars.forEach((char, index) => {
      const position = Math.floor(Math.random() * passwordArray.length);
      passwordArray[position] = char;
    });

    // Shuffle the password
    for (let i = passwordArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [passwordArray[i], passwordArray[j]] = [passwordArray[j], passwordArray[i]];
    }

    return passwordArray.join('');
  }

  /**
   * Check if password has been compromised
   * @param {string} password - Password to check
   * @returns {Promise<boolean>} Whether password has been compromised
   */
  async isPasswordCompromised(password) {
    // This is a placeholder. In a real implementation, you might:
    // 1. Check against a local database of known compromised passwords
    // 2. Use the HaveIBeenPwned API to check if the password has been exposed
    // 3. Implement k-anonymity to safely check without sending the full password
    
    // For now, just check against a few common passwords
    const commonPasswords = [
      'password123',
      '123456',
      'qwerty',
      'admin',
      'password',
      '12345678',
      'welcome',
      'letmein'
    ];

    return commonPasswords.includes(password.toLowerCase());
  }

  /**
   * Calculate password entropy
   * @param {string} password - Password to calculate entropy for
   * @returns {number} Entropy in bits
   */
  calculateEntropy(password) {
    if (!password) return 0;

    // Count unique characters
    const uniqueChars = new Set(password.split(''));
    const charsetSize = uniqueChars.size;

    // Calculate entropy: log2(charsetSize^passwordLength)
    const entropy = password.length * Math.log2(charsetSize);

    return Math.round(entropy * 100) / 100;
  }

  /**
   * Estimate time to crack password
   * @param {string} password - Password to estimate
   * @returns {Object} Estimated time to crack with different methods
   */
  estimateCrackTime(password) {
    const entropy = this.calculateEntropy(password);
    
    // Assumptions:
    // - Offline attack: 10 billion guesses per second
    // - Online attack: 1000 guesses per second
    // - Slow hashing: 10,000 guesses per second
    
    const combinationCount = Math.pow(2, entropy);
    
    const offlineSeconds = combinationCount / 10e9;
    const onlineSeconds = combinationCount / 1000;
    const hashingSeconds = combinationCount / 10000;
    
    return {
      entropy,
      combinations: combinationCount,
      offline: this.formatTime(offlineSeconds),
      online: this.formatTime(onlineSeconds),
      hashing: this.formatTime(hashingSeconds)
    };
  }

  /**
   * Format time in seconds to human readable format
   * @param {number} seconds - Time in seconds
   * @returns {string} Human readable time
   */
  formatTime(seconds) {
    if (seconds < 1) return 'Less than a second';
    if (seconds < 60) return `${Math.round(seconds)} seconds`;
    if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
    if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`;
    if (seconds < 31536000) return `${Math.round(seconds / 86400)} days`;
    if (seconds < 3153600000) return `${Math.round(seconds / 31536000)} years`;
    
    const years = seconds / 31536000;
    if (years > 1e9) return `${(years / 1e9).toExponential(2)} billion years`;
    if (years > 1e6) return `${(years / 1e6).toExponential(2)} million years`;
    if (years > 1e3) return `${(years / 1e3).toExponential(2)} thousand years`;
    
    return `${years.toExponential(2)} years`;
  }
}

module.exports = PasswordService;

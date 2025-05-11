/**
 * Profile validation schemas
 */

const Joi = require('joi');

// Schema for updating profile
const updateProfileSchema = Joi.object({
  first_name: Joi.string()
    .max(100)
    .allow('')
    .messages({
      'string.max': 'First name cannot exceed 100 characters'
    }),
    
  last_name: Joi.string()
    .max(100)
    .allow('')
    .messages({
      'string.max': 'Last name cannot exceed 100 characters'
    }),
    
  settings: Joi.object({
    emailNotifications: Joi.boolean(),
    theme: Joi.string().valid('light', 'dark', 'system'),
    language: Joi.string().valid('en', 'ru', 'es', 'fr', 'de'),
    timezone: Joi.string(),
    dateFormat: Joi.string().valid('MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'),
    timeFormat: Joi.string().valid('12h', '24h'),
    defaultConceptView: Joi.string().valid('graph', 'theses', 'both'),
    autoSave: Joi.boolean(),
    publicProfile: Joi.boolean()
  }).default({})
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

// Schema for profile settings
const profileSettingsSchema = Joi.object({
  emailNotifications: Joi.boolean().default(true),
  theme: Joi.string().valid('light', 'dark', 'system').default('system'),
  language: Joi.string().valid('en', 'ru', 'es', 'fr', 'de').default('en'),
  timezone: Joi.string().default('UTC'),
  dateFormat: Joi.string().valid('MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD').default('YYYY-MM-DD'),
  timeFormat: Joi.string().valid('12h', '24h').default('24h'),
  defaultConceptView: Joi.string().valid('graph', 'theses', 'both').default('both'),
  autoSave: Joi.boolean().default(true),
  publicProfile: Joi.boolean().default(false)
});

module.exports = {
  updateProfileSchema,
  profileSettingsSchema
};

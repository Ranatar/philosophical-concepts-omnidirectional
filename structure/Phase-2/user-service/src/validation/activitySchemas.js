/**
 * Activity validation schemas
 */

const Joi = require('joi');

// Schema for getting activities with filters
const getActivitiesSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(20),
  
  sortBy: Joi.string()
    .valid('activity_date', 'activity_type')
    .default('activity_date'),
    
  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .default('desc'),
    
  activity_type: Joi.string()
    .valid(
      'login',
      'logout',
      'create_concept',
      'update_concept',
      'delete_concept',
      'view_concept',
      'create_graph',
      'update_graph',
      'delete_graph',
      'create_thesis',
      'update_thesis',
      'delete_thesis',
      'create_synthesis',
      'update_synthesis',
      'delete_synthesis',
      'claude_interaction',
      'analyze_name',
      'detect_origin',
      'create_historical_context',
      'create_practical_application',
      'create_dialogue',
      'analyze_evolution',
      'user_created',
      'profile_update',
      'password_change',
      'password_reset_requested',
      'failed_login'
    ),
    
  target_id: Joi.string().uuid(),
  
  fromDate: Joi.date().iso(),
  toDate: Joi.date().iso().min(Joi.ref('fromDate'))
});

// Schema for activity stats
const activityStatsSchema = Joi.object({
  fromDate: Joi.date().iso(),
  toDate: Joi.date().iso().min(Joi.ref('fromDate')),
  groupBy: Joi.string().valid('hour', 'day', 'week', 'month').default('day')
});

module.exports = {
  getActivitiesSchema,
  activityStatsSchema
};

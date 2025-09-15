/**
 * Role and permission constants for the Philosophy Service
 * Implements RBAC (Role-Based Access Control)
 */

const ROLES = {
  // System roles
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  USER: 'user',
  GUEST: 'guest'
};

const PERMISSIONS = {
  // User management
  USER_CREATE: 'user:create',
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  USER_LIST: 'user:list',
  USER_MANAGE_ROLES: 'user:manage_roles',
  USER_SUSPEND: 'user:suspend',

  // API Key management
  API_KEY_CREATE: 'api_key:create',
  API_KEY_READ: 'api_key:read',
  API_KEY_UPDATE: 'api_key:update',
  API_KEY_DELETE: 'api_key:delete',
  API_KEY_SHARE: 'api_key:share',
  API_KEY_MANAGE_SHARED: 'api_key:manage_shared',

  // Concept management
  CONCEPT_CREATE: 'concept:create',
  CONCEPT_READ: 'concept:read',
  CONCEPT_UPDATE: 'concept:update',
  CONCEPT_DELETE: 'concept:delete',
  CONCEPT_LIST: 'concept:list',
  CONCEPT_PUBLISH: 'concept:publish',
  CONCEPT_MODERATE: 'concept:moderate',
  CONCEPT_ARCHIVE: 'concept:archive',

  // Graph management
  GRAPH_CREATE: 'graph:create',
  GRAPH_READ: 'graph:read',
  GRAPH_UPDATE: 'graph:update',
  GRAPH_DELETE: 'graph:delete',
  GRAPH_VALIDATE: 'graph:validate',
  GRAPH_ENRICH: 'graph:enrich',
  GRAPH_APPROVE_ELEMENTS: 'graph:approve_elements',

  // Thesis management
  THESIS_CREATE: 'thesis:create',
  THESIS_READ: 'thesis:read',
  THESIS_UPDATE: 'thesis:update',
  THESIS_DELETE: 'thesis:delete',
  THESIS_GENERATE: 'thesis:generate',
  THESIS_ELABORATE: 'thesis:elaborate',
  THESIS_COMPARE: 'thesis:compare',

  // Synthesis operations
  SYNTHESIS_CREATE: 'synthesis:create',
  SYNTHESIS_READ: 'synthesis:read',
  SYNTHESIS_UPDATE: 'synthesis:update',
  SYNTHESIS_DELETE: 'synthesis:delete',
  SYNTHESIS_ANALYZE: 'synthesis:analyze',
  SYNTHESIS_CRITIQUE: 'synthesis:critique',

  // Claude interactions
  CLAUDE_QUERY: 'claude:query',
  CLAUDE_ADMIN: 'claude:admin',
  CLAUDE_VIEW_USAGE: 'claude:view_usage',
  CLAUDE_MANAGE_TEMPLATES: 'claude:manage_templates',
  CLAUDE_USE_OWN_KEY: 'claude:use_own_key',
  CLAUDE_USE_SYSTEM_KEY: 'claude:use_system_key',

  // Analysis services
  NAME_ANALYZE: 'name:analyze',
  ORIGIN_DETECT: 'origin:detect',
  HISTORICAL_ANALYZE: 'historical:analyze',
  PRACTICAL_ANALYZE: 'practical:analyze',
  DIALOGUE_CREATE: 'dialogue:create',
  EVOLUTION_ANALYZE: 'evolution:analyze',

  // System operations
  SYSTEM_ADMIN: 'system:admin',
  SYSTEM_MONITOR: 'system:monitor',
  SYSTEM_BACKUP: 'system:backup',
  SYSTEM_RESTORE: 'system:restore',
  SYSTEM_CONFIG: 'system:config',

  // Moderation
  MODERATE_CONTENT: 'moderate:content',
  MODERATE_USERS: 'moderate:users',
  MODERATE_FLAGS: 'moderate:flags',

  // Analytics
  ANALYTICS_VIEW: 'analytics:view',
  ANALYTICS_EXPORT: 'analytics:export',
  ANALYTICS_ADMIN: 'analytics:admin'
};

// Role-Permission mapping
const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS), // All permissions

  [ROLES.ADMIN]: [
    // User management (except super admin operations)
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.USER_DELETE,
    PERMISSIONS.USER_LIST,
    PERMISSIONS.USER_SUSPEND,
    
    // API Key management
    PERMISSIONS.API_KEY_CREATE,
    PERMISSIONS.API_KEY_READ,
    PERMISSIONS.API_KEY_UPDATE,
    PERMISSIONS.API_KEY_DELETE,
    PERMISSIONS.API_KEY_MANAGE_SHARED,
    
    // All content operations
    PERMISSIONS.CONCEPT_CREATE,
    PERMISSIONS.CONCEPT_READ,
    PERMISSIONS.CONCEPT_UPDATE,
    PERMISSIONS.CONCEPT_DELETE,
    PERMISSIONS.CONCEPT_LIST,
    PERMISSIONS.CONCEPT_PUBLISH,
    PERMISSIONS.CONCEPT_MODERATE,
    PERMISSIONS.CONCEPT_ARCHIVE,
    
    PERMISSIONS.GRAPH_CREATE,
    PERMISSIONS.GRAPH_READ,
    PERMISSIONS.GRAPH_UPDATE,
    PERMISSIONS.GRAPH_DELETE,
    PERMISSIONS.GRAPH_VALIDATE,
    PERMISSIONS.GRAPH_ENRICH,
    PERMISSIONS.GRAPH_APPROVE_ELEMENTS,
    
    PERMISSIONS.THESIS_CREATE,
    PERMISSIONS.THESIS_READ,
    PERMISSIONS.THESIS_UPDATE,
    PERMISSIONS.THESIS_DELETE,
    PERMISSIONS.THESIS_GENERATE,
    PERMISSIONS.THESIS_ELABORATE,
    PERMISSIONS.THESIS_COMPARE,
    
    PERMISSIONS.SYNTHESIS_CREATE,
    PERMISSIONS.SYNTHESIS_READ,
    PERMISSIONS.SYNTHESIS_UPDATE,
    PERMISSIONS.SYNTHESIS_DELETE,
    PERMISSIONS.SYNTHESIS_ANALYZE,
    PERMISSIONS.SYNTHESIS_CRITIQUE,
    
    // Claude operations
    PERMISSIONS.CLAUDE_QUERY,
    PERMISSIONS.CLAUDE_VIEW_USAGE,
    PERMISSIONS.CLAUDE_MANAGE_TEMPLATES,
    PERMISSIONS.CLAUDE_USE_SYSTEM_KEY,
    
    // All analysis services
    PERMISSIONS.NAME_ANALYZE,
    PERMISSIONS.ORIGIN_DETECT,
    PERMISSIONS.HISTORICAL_ANALYZE,
    PERMISSIONS.PRACTICAL_ANALYZE,
    PERMISSIONS.DIALOGUE_CREATE,
    PERMISSIONS.EVOLUTION_ANALYZE,
    
    // Moderation
    PERMISSIONS.MODERATE_CONTENT,
    PERMISSIONS.MODERATE_USERS,
    PERMISSIONS.MODERATE_FLAGS,
    
    // Analytics
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.ANALYTICS_EXPORT,
    PERMISSIONS.ANALYTICS_ADMIN,
    
    // Limited system operations
    PERMISSIONS.SYSTEM_MONITOR,
    PERMISSIONS.SYSTEM_BACKUP
  ],

  [ROLES.MODERATOR]: [
    // Read operations
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_LIST,
    PERMISSIONS.CONCEPT_READ,
    PERMISSIONS.CONCEPT_LIST,
    PERMISSIONS.GRAPH_READ,
    PERMISSIONS.THESIS_READ,
    PERMISSIONS.SYNTHESIS_READ,
    
    // Moderation operations
    PERMISSIONS.CONCEPT_MODERATE,
    PERMISSIONS.GRAPH_VALIDATE,
    PERMISSIONS.GRAPH_APPROVE_ELEMENTS,
    PERMISSIONS.MODERATE_CONTENT,
    PERMISSIONS.MODERATE_FLAGS,
    
    // Limited update operations
    PERMISSIONS.CONCEPT_UPDATE,
    PERMISSIONS.THESIS_UPDATE,
    
    // Claude operations
    PERMISSIONS.CLAUDE_QUERY,
    PERMISSIONS.CLAUDE_VIEW_USAGE,
    
    // Analysis services
    PERMISSIONS.NAME_ANALYZE,
    PERMISSIONS.ORIGIN_DETECT,
    PERMISSIONS.HISTORICAL_ANALYZE,
    PERMISSIONS.PRACTICAL_ANALYZE,
    PERMISSIONS.DIALOGUE_CREATE,
    PERMISSIONS.EVOLUTION_ANALYZE,
    
    // Analytics
    PERMISSIONS.ANALYTICS_VIEW
  ],

  [ROLES.USER]: [
    // Own profile management
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_UPDATE,
    
    // API Key management for own keys
    PERMISSIONS.API_KEY_CREATE,
    PERMISSIONS.API_KEY_READ,
    PERMISSIONS.API_KEY_UPDATE,
    PERMISSIONS.API_KEY_DELETE,
    PERMISSIONS.API_KEY_SHARE,
    
    // Content operations (own content)
    PERMISSIONS.CONCEPT_CREATE,
    PERMISSIONS.CONCEPT_READ,
    PERMISSIONS.CONCEPT_UPDATE,
    PERMISSIONS.CONCEPT_DELETE,
    PERMISSIONS.CONCEPT_LIST,
    
    PERMISSIONS.GRAPH_CREATE,
    PERMISSIONS.GRAPH_READ,
    PERMISSIONS.GRAPH_UPDATE,
    PERMISSIONS.GRAPH_DELETE,
    PERMISSIONS.GRAPH_VALIDATE,
    PERMISSIONS.GRAPH_ENRICH,
    
    PERMISSIONS.THESIS_CREATE,
    PERMISSIONS.THESIS_READ,
    PERMISSIONS.THESIS_UPDATE,
    PERMISSIONS.THESIS_DELETE,
    PERMISSIONS.THESIS_GENERATE,
    PERMISSIONS.THESIS_ELABORATE,
    PERMISSIONS.THESIS_COMPARE,
    
    PERMISSIONS.SYNTHESIS_CREATE,
    PERMISSIONS.SYNTHESIS_READ,
    PERMISSIONS.SYNTHESIS_UPDATE,
    PERMISSIONS.SYNTHESIS_DELETE,
    PERMISSIONS.SYNTHESIS_ANALYZE,
    PERMISSIONS.SYNTHESIS_CRITIQUE,
    
    // Claude operations
    PERMISSIONS.CLAUDE_QUERY,
    PERMISSIONS.CLAUDE_USE_OWN_KEY,
    
    // Analysis services
    PERMISSIONS.NAME_ANALYZE,
    PERMISSIONS.ORIGIN_DETECT,
    PERMISSIONS.HISTORICAL_ANALYZE,
    PERMISSIONS.PRACTICAL_ANALYZE,
    PERMISSIONS.DIALOGUE_CREATE,
    PERMISSIONS.EVOLUTION_ANALYZE
  ],

  [ROLES.GUEST]: [
    // Read-only operations
    PERMISSIONS.CONCEPT_READ,
    PERMISSIONS.CONCEPT_LIST,
    PERMISSIONS.GRAPH_READ,
    PERMISSIONS.THESIS_READ,
    PERMISSIONS.SYNTHESIS_READ
  ]
};

// Helper functions

/**
 * Check if a role has a specific permission
 * @param {string} role - The role to check
 * @param {string} permission - The permission to check
 * @returns {boolean} - Whether the role has the permission
 */
function hasPermission(role, permission) {
  if (!ROLE_PERMISSIONS[role]) {
    return false;
  }
  return ROLE_PERMISSIONS[role].includes(permission);
}

/**
 * Get all permissions for a role
 * @param {string} role - The role
 * @returns {string[]} - Array of permissions
 */
function getRolePermissions(role) {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Check if a user can perform an action on a resource
 * @param {Object} user - The user object
 * @param {string} permission - The required permission
 * @param {Object} resource - The resource being accessed
 * @returns {boolean} - Whether the user can perform the action
 */
function canAccess(user, permission, resource = null) {
  // Super admin can do anything
  if (user.role === ROLES.SUPER_ADMIN) {
    return true;
  }

  // Check basic role permission
  if (!hasPermission(user.role, permission)) {
    return false;
  }

  // Additional checks for resource ownership
  if (resource && resource.creator_id) {
    // Users can only modify their own resources (unless admin/moderator)
    if (user.role === ROLES.USER && 
        ['UPDATE', 'DELETE'].some(action => permission.includes(action.toLowerCase()))) {
      return resource.creator_id === user.user_id;
    }
  }

  return true;
}

/**
 * Get all available roles
 * @returns {string[]} - Array of role names
 */
function getAllRoles() {
  return Object.values(ROLES);
}

/**
 * Check if a role is valid
 * @param {string} role - The role to check
 * @returns {boolean} - Whether the role is valid
 */
function isValidRole(role) {
  return Object.values(ROLES).includes(role);
}

/**
 * Get role hierarchy level (higher number = more privileges)
 * @param {string} role - The role
 * @returns {number} - Hierarchy level
 */
function getRoleLevel(role) {
  const levels = {
    [ROLES.GUEST]: 0,
    [ROLES.USER]: 1,
    [ROLES.MODERATOR]: 2,
    [ROLES.ADMIN]: 3,
    [ROLES.SUPER_ADMIN]: 4
  };
  return levels[role] || 0;
}

/**
 * Check if one role is superior to another
 * @param {string} role1 - First role
 * @param {string} role2 - Second role
 * @returns {boolean} - Whether role1 is superior to role2
 */
function isRoleSuperior(role1, role2) {
  return getRoleLevel(role1) > getRoleLevel(role2);
}

module.exports = {
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  hasPermission,
  getRolePermissions,
  canAccess,
  getAllRoles,
  isValidRole,
  getRoleLevel,
  isRoleSuperior
};
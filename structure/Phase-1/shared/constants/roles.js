/**
 * Standardized roles for the philosophy service application
 * These roles are used for authorization and permission management
 */

module.exports = {
  // User roles
  ROLE_ADMIN: 'admin',
  ROLE_MODERATOR: 'moderator',
  ROLE_USER: 'user',
  ROLE_GUEST: 'guest',
  
  // Permission groups
  PERMISSION_GROUP_READ: 'read',
  PERMISSION_GROUP_WRITE: 'write',
  PERMISSION_GROUP_DELETE: 'delete',
  PERMISSION_GROUP_ADMIN: 'admin',
  
  // Specific permissions
  PERMISSION_USER_CREATE: 'user:create',
  PERMISSION_USER_READ: 'user:read',
  PERMISSION_USER_UPDATE: 'user:update',
  PERMISSION_USER_DELETE: 'user:delete',
  
  PERMISSION_CONCEPT_CREATE: 'concept:create',
  PERMISSION_CONCEPT_READ: 'concept:read',
  PERMISSION_CONCEPT_UPDATE: 'concept:update',
  PERMISSION_CONCEPT_DELETE: 'concept:delete',
  
  PERMISSION_GRAPH_CREATE: 'graph:create',
  PERMISSION_GRAPH_READ: 'graph:read',
  PERMISSION_GRAPH_UPDATE: 'graph:update',
  PERMISSION_GRAPH_DELETE: 'graph:delete',
  
  PERMISSION_THESIS_CREATE: 'thesis:create',
  PERMISSION_THESIS_READ: 'thesis:read',
  PERMISSION_THESIS_UPDATE: 'thesis:update',
  PERMISSION_THESIS_DELETE: 'thesis:delete',
  
  PERMISSION_SYNTHESIS_CREATE: 'synthesis:create',
  PERMISSION_SYNTHESIS_READ: 'synthesis:read',
  PERMISSION_SYNTHESIS_UPDATE: 'synthesis:update',
  PERMISSION_SYNTHESIS_DELETE: 'synthesis:delete',
  
  PERMISSION_CLAUDE_INTERACT: 'claude:interact',
  PERMISSION_CLAUDE_ADMIN: 'claude:admin',
  
  // Role to permissions mapping
  ROLE_PERMISSIONS: {
    admin: [
      'user:create', 'user:read', 'user:update', 'user:delete',
      'concept:create', 'concept:read', 'concept:update', 'concept:delete',
      'graph:create', 'graph:read', 'graph:update', 'graph:delete',
      'thesis:create', 'thesis:read', 'thesis:update', 'thesis:delete',
      'synthesis:create', 'synthesis:read', 'synthesis:update', 'synthesis:delete',
      'claude:interact', 'claude:admin'
    ],
    moderator: [
      'user:read',
      'concept:read', 'concept:update',
      'graph:read', 'graph:update',
      'thesis:read', 'thesis:update',
      'synthesis:read', 'synthesis:update',
      'claude:interact'
    ],
    user: [
      'concept:create', 'concept:read', 'concept:update', 'concept:delete',
      'graph:create', 'graph:read', 'graph:update', 'graph:delete',
      'thesis:create', 'thesis:read', 'thesis:update', 'thesis:delete',
      'synthesis:create', 'synthesis:read', 'synthesis:update', 'synthesis:delete',
      'claude:interact'
    ],
    guest: [
      'concept:read',
      'graph:read',
      'thesis:read',
      'synthesis:read'
    ]
  }
};

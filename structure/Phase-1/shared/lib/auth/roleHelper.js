/**
 * Role helper utilities for authentication and authorization
 * Provides utilities for role-based access control
 */

const { ROLE_PERMISSIONS, ROLE_ADMIN, ROLE_MODERATOR, ROLE_USER, ROLE_GUEST } = require('../../constants/roles');
const { UnauthorizedError, ForbiddenError } = require('../errors/HttpErrors');
const { defaultLogger } = require('../logging/logger');

/**
 * Role helper class
 */
class RoleHelper {
  /**
   * Create a new role helper
   * @param {Object} [logger=defaultLogger] - Logger instance
   */
  constructor(logger = defaultLogger) {
    this.logger = logger;
  }
  
  /**
   * Check if a role has permission
   * @param {string} role - User role
   * @param {string} permission - Permission to check
   * @returns {boolean} Whether the role has the permission
   */
  hasPermission(role, permission) {
    // Admin role has all permissions
    if (role === ROLE_ADMIN) {
      return true;
    }
    
    // Check if the role exists in the permission mapping
    if (!ROLE_PERMISSIONS[role]) {
      this.logger.warn(`Role ${role} not found in permission mapping`);
      return false;
    }
    
    // Check if the role has the specific permission
    return ROLE_PERMISSIONS[role].includes(permission);
  }
  
  /**
   * Get all permissions for a role
   * @param {string} role - User role
   * @returns {Array<string>} Array of permissions for the role
   */
  getPermissionsForRole(role) {
    // Admin role has all permissions (collect all unique permissions)
    if (role === ROLE_ADMIN) {
      const allPermissions = new Set();
      
      Object.values(ROLE_PERMISSIONS).forEach(permissions => {
        permissions.forEach(permission => {
          allPermissions.add(permission);
        });
      });
      
      return Array.from(allPermissions);
    }
    
    // Return permissions for the specific role
    return ROLE_PERMISSIONS[role] || [];
  }
  
  /**
   * Get all roles that have a specific permission
   * @param {string} permission - Permission to check
   * @returns {Array<string>} Array of roles with the permission
   */
  getRolesWithPermission(permission) {
    const roles = [];
    
    // Admin always has all permissions
    roles.push(ROLE_ADMIN);
    
    // Check other roles
    Object.entries(ROLE_PERMISSIONS).forEach(([role, permissions]) => {
      if (role !== ROLE_ADMIN && permissions.includes(permission)) {
        roles.push(role);
      }
    });
    
    return roles;
  }
  
  /**
   * Compare roles to check if one is higher than another
   * Hierarchy: ADMIN > MODERATOR > USER > GUEST
   * @param {string} role1 - First role
   * @param {string} role2 - Second role
   * @returns {number} 1 if role1 > role2, -1 if role1 < role2, 0 if equal
   */
  compareRoles(role1, role2) {
    const roleHierarchy = {
      [ROLE_ADMIN]: 4,
      [ROLE_MODERATOR]: 3,
      [ROLE_USER]: 2,
      [ROLE_GUEST]: 1
    };
    
    const role1Level = roleHierarchy[role1] || 0;
    const role2Level = roleHierarchy[role2] || 0;
    
    if (role1Level > role2Level) {
      return 1;
    } else if (role1Level < role2Level) {
      return -1;
    }
    
    return 0;
  }
  
  /**
   * Create a middleware for permission checking
   * @param {string|Array<string>} requiredPermissions - Required permission(s)
   * @param {Object} [options] - Middleware options
   * @param {boolean} [options.requireAll=false] - Whether to require all permissions
   * @returns {function} Express middleware function
   */
  createPermissionMiddleware(requiredPermissions, options = {}) {
    const {
      requireAll = false
    } = options;
    
    // Convert single permission to array
    const permissions = Array.isArray(requiredPermissions) 
      ? requiredPermissions 
      : [requiredPermissions];
    
    // Return the middleware function
    return (req, res, next) => {
      // Check if user exists in request (should be added by JWT middleware)
      if (!req.user) {
        return next(new UnauthorizedError('Authentication required'));
      }
      
      const { role } = req.user;
      
      // Check if user has the required permissions
      if (requireAll) {
        // User must have all permissions
        const hasAllPermissions = permissions.every(permission => 
          this.hasPermission(role, permission)
        );
        
        if (!hasAllPermissions) {
          return next(new ForbiddenError('Insufficient permissions'));
        }
      } else {
        // User must have at least one permission
        const hasAnyPermission = permissions.some(permission => 
          this.hasPermission(role, permission)
        );
        
        if (!hasAnyPermission) {
          return next(new ForbiddenError('Insufficient permissions'));
        }
      }
      
      // User has required permissions, continue
      next();
    };
  }
  
  /**
   * Create a middleware for role checking
   * @param {string|Array<string>} requiredRoles - Required role(s)
   * @param {Object} [options] - Middleware options
   * @param {boolean} [options.allowHigher=true] - Whether to allow higher roles
   * @returns {function} Express middleware function
   */
  createRoleMiddleware(requiredRoles, options = {}) {
    const {
      allowHigher = true
    } = options;
    
    // Convert single role to array
    const roles = Array.isArray(requiredRoles) 
      ? requiredRoles 
      : [requiredRoles];
    
    // Return the middleware function
    return (req, res, next) => {
      // Check if user exists in request (should be added by JWT middleware)
      if (!req.user) {
        return next(new UnauthorizedError('Authentication required'));
      }
      
      const { role } = req.user;
      
      // Admin always has access if allowHigher is true
      if (allowHigher && role === ROLE_ADMIN) {
        return next();
      }
      
      // Check if user has the required role
      const hasRequiredRole = roles.some(requiredRole => {
        if (allowHigher) {
          // Allow higher roles
          return this.compareRoles(role, requiredRole) >= 0;
        } else {
          // Exact role match only
          return role === requiredRole;
        }
      });
      
      if (!hasRequiredRole) {
        return next(new ForbiddenError('Insufficient role'));
      }
      
      // User has required role, continue
      next();
    };
  }
}

// Create and export a default instance
const defaultRoleHelper = new RoleHelper();

module.exports = {
  RoleHelper,
  defaultRoleHelper
};

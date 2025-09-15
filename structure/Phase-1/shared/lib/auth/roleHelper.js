/**
 * Role Helper
 * Утилиты для работы с ролями и правами доступа
 */

const { ForbiddenError } = require('../errors/HttpErrors');
const logger = require('../logging/logger');

// Определение ролей
const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  MODERATOR: 'moderator',
  GUEST: 'guest'
};

// Иерархия ролей (более высокая роль включает права более низких)
const ROLE_HIERARCHY = {
  [ROLES.ADMIN]: 3,
  [ROLES.MODERATOR]: 2,
  [ROLES.USER]: 1,
  [ROLES.GUEST]: 0
};

// Определение прав доступа
const PERMISSIONS = {
  // Управление пользователями
  USER_VIEW: 'user:view',
  USER_CREATE: 'user:create',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  USER_MANAGE_ROLES: 'user:manage_roles',
  
  // Управление концепциями
  CONCEPT_VIEW: 'concept:view',
  CONCEPT_CREATE: 'concept:create',
  CONCEPT_UPDATE: 'concept:update',
  CONCEPT_DELETE: 'concept:delete',
  CONCEPT_PUBLISH: 'concept:publish',
  CONCEPT_MODERATE: 'concept:moderate',
  
  // Управление графами
  GRAPH_VIEW: 'graph:view',
  GRAPH_CREATE: 'graph:create',
  GRAPH_UPDATE: 'graph:update',
  GRAPH_DELETE: 'graph:delete',
  GRAPH_VALIDATE: 'graph:validate',
  
  // Управление тезисами
  THESIS_VIEW: 'thesis:view',
  THESIS_CREATE: 'thesis:create',
  THESIS_UPDATE: 'thesis:update',
  THESIS_DELETE: 'thesis:delete',
  THESIS_GENERATE: 'thesis:generate',
  
  // Синтез
  SYNTHESIS_CREATE: 'synthesis:create',
  SYNTHESIS_VIEW: 'synthesis:view',
  
  // Взаимодействие с Claude
  CLAUDE_USE: 'claude:use',
  CLAUDE_UNLIMITED: 'claude:unlimited',
  
  // Административные функции
  ADMIN_DASHBOARD: 'admin:dashboard',
  ADMIN_SETTINGS: 'admin:settings',
  ADMIN_LOGS: 'admin:logs',
  ADMIN_METRICS: 'admin:metrics',
  
  // API ключи
  API_KEY_MANAGE: 'api_key:manage',
  API_KEY_SHARE: 'api_key:share'
};

// Маппинг ролей на права доступа
const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: Object.values(PERMISSIONS), // Админ имеет все права
  
  [ROLES.MODERATOR]: [
    PERMISSIONS.USER_VIEW,
    PERMISSIONS.CONCEPT_VIEW,
    PERMISSIONS.CONCEPT_CREATE,
    PERMISSIONS.CONCEPT_UPDATE,
    PERMISSIONS.CONCEPT_DELETE,
    PERMISSIONS.CONCEPT_PUBLISH,
    PERMISSIONS.CONCEPT_MODERATE,
    PERMISSIONS.GRAPH_VIEW,
    PERMISSIONS.GRAPH_CREATE,
    PERMISSIONS.GRAPH_UPDATE,
    PERMISSIONS.GRAPH_DELETE,
    PERMISSIONS.GRAPH_VALIDATE,
    PERMISSIONS.THESIS_VIEW,
    PERMISSIONS.THESIS_CREATE,
    PERMISSIONS.THESIS_UPDATE,
    PERMISSIONS.THESIS_DELETE,
    PERMISSIONS.THESIS_GENERATE,
    PERMISSIONS.SYNTHESIS_CREATE,
    PERMISSIONS.SYNTHESIS_VIEW,
    PERMISSIONS.CLAUDE_USE,
    PERMISSIONS.API_KEY_MANAGE
  ],
  
  [ROLES.USER]: [
    PERMISSIONS.USER_VIEW,
    PERMISSIONS.CONCEPT_VIEW,
    PERMISSIONS.CONCEPT_CREATE,
    PERMISSIONS.CONCEPT_UPDATE,
    PERMISSIONS.GRAPH_VIEW,
    PERMISSIONS.GRAPH_CREATE,
    PERMISSIONS.GRAPH_UPDATE,
    PERMISSIONS.THESIS_VIEW,
    PERMISSIONS.THESIS_CREATE,
    PERMISSIONS.THESIS_UPDATE,
    PERMISSIONS.THESIS_GENERATE,
    PERMISSIONS.SYNTHESIS_CREATE,
    PERMISSIONS.SYNTHESIS_VIEW,
    PERMISSIONS.CLAUDE_USE,
    PERMISSIONS.API_KEY_MANAGE,
    PERMISSIONS.API_KEY_SHARE
  ],
  
  [ROLES.GUEST]: [
    PERMISSIONS.CONCEPT_VIEW,
    PERMISSIONS.GRAPH_VIEW,
    PERMISSIONS.THESIS_VIEW,
    PERMISSIONS.SYNTHESIS_VIEW
  ]
};

class RoleHelper {
  /**
   * Проверка, имеет ли роль определенное право
   */
  static hasPermission(role, permission) {
    if (!role || !permission) {
      return false;
    }

    const permissions = ROLE_PERMISSIONS[role] || [];
    return permissions.includes(permission);
  }

  /**
   * Проверка, имеет ли роль все указанные права
   */
  static hasAllPermissions(role, permissions) {
    return permissions.every(permission => this.hasPermission(role, permission));
  }

  /**
   * Проверка, имеет ли роль хотя бы одно из указанных прав
   */
  static hasAnyPermission(role, permissions) {
    return permissions.some(permission => this.hasPermission(role, permission));
  }

  /**
   * Получение всех прав для роли
   */
  static getPermissions(role) {
    return ROLE_PERMISSIONS[role] || [];
  }

  /**
   * Проверка, является ли роль валидной
   */
  static isValidRole(role) {
    return Object.values(ROLES).includes(role);
  }

  /**
   * Проверка, является ли право валидным
   */
  static isValidPermission(permission) {
    return Object.values(PERMISSIONS).includes(permission);
  }

  /**
   * Сравнение ролей по иерархии
   */
  static compareRoles(role1, role2) {
    const level1 = ROLE_HIERARCHY[role1] || 0;
    const level2 = ROLE_HIERARCHY[role2] || 0;
    return level1 - level2;
  }

  /**
   * Проверка, является ли роль выше или равна другой
   */
  static isRoleHigherOrEqual(role1, role2) {
    return this.compareRoles(role1, role2) >= 0;
  }

  /**
   * Проверка, может ли пользователь с ролью выполнить действие
   */
  static canPerformAction(userRole, action, resource = null) {
    // Определяем необходимое право на основе действия
    const permission = this._getPermissionForAction(action, resource);
    
    if (!permission) {
      logger.warn('Unknown action requested', { action, resource });
      return false;
    }

    return this.hasPermission(userRole, permission);
  }

  /**
   * Проверка прав на ресурс с учетом владельца
   */
  static canAccessResource(user, resource, action) {
    // Владелец ресурса имеет полные права
    if (resource.creatorId === user.userId || resource.userId === user.userId) {
      return true;
    }

    // Коллаборатор имеет ограниченные права
    if (resource.collaborators && resource.collaborators.includes(user.userId)) {
      const allowedActions = ['view', 'update'];
      return allowedActions.includes(action);
    }

    // Проверка общих прав доступа
    return this.canPerformAction(user.role, action, resource.type || 'resource');
  }

  /**
   * Создание middleware для проверки прав
   */
  static requirePermission(...permissions) {
    return (req, res, next) => {
      try {
        if (!req.user) {
          throw new ForbiddenError('Authentication required');
        }

        const hasPermission = permissions.length === 1
          ? this.hasPermission(req.user.role, permissions[0])
          : this.hasAnyPermission(req.user.role, permissions);

        if (!hasPermission) {
          logger.warn('Permission denied', {
            userId: req.user.userId,
            role: req.user.role,
            requiredPermissions: permissions
          });
          
          throw new ForbiddenError('Insufficient permissions');
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * Создание middleware для проверки роли
   */
  static requireRole(...roles) {
    return (req, res, next) => {
      try {
        if (!req.user) {
          throw new ForbiddenError('Authentication required');
        }

        if (!roles.includes(req.user.role)) {
          logger.warn('Role check failed', {
            userId: req.user.userId,
            userRole: req.user.role,
            requiredRoles: roles
          });
          
          throw new ForbiddenError('Insufficient role privileges');
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * Создание middleware для проверки минимальной роли
   */
  static requireMinimumRole(minimumRole) {
    return (req, res, next) => {
      try {
        if (!req.user) {
          throw new ForbiddenError('Authentication required');
        }

        if (!this.isRoleHigherOrEqual(req.user.role, minimumRole)) {
          logger.warn('Minimum role check failed', {
            userId: req.user.userId,
            userRole: req.user.role,
            minimumRole
          });
          
          throw new ForbiddenError('Insufficient role privileges');
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * Создание middleware для проверки владельца ресурса
   */
  static requireOwnership(getResourceFunc) {
    return async (req, res, next) => {
      try {
        if (!req.user) {
          throw new ForbiddenError('Authentication required');
        }

        const resource = await getResourceFunc(req);
        
        if (!resource) {
          return next();
        }

        const isOwner = resource.creatorId === req.user.userId || 
                       resource.userId === req.user.userId;
        
        const isCollaborator = resource.collaborators && 
                              resource.collaborators.includes(req.user.userId);

        const isAdmin = req.user.role === ROLES.ADMIN;

        if (!isOwner && !isCollaborator && !isAdmin) {
          logger.warn('Ownership check failed', {
            userId: req.user.userId,
            resourceId: resource.id || resource._id,
            ownerId: resource.creatorId || resource.userId
          });
          
          throw new ForbiddenError('Access denied to this resource');
        }

        // Добавляем информацию о правах в запрос
        req.resourceAccess = {
          isOwner,
          isCollaborator,
          canEdit: isOwner || isAdmin,
          canDelete: isOwner || isAdmin
        };

        next();
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * Фильтрация данных на основе прав доступа
   */
  static filterDataByPermissions(data, userRole, permissions) {
    if (!data || !Array.isArray(permissions)) {
      return data;
    }

    const allowedFields = {};
    
    permissions.forEach(({ field, permission }) => {
      if (this.hasPermission(userRole, permission)) {
        allowedFields[field] = true;
      }
    });

    if (Array.isArray(data)) {
      return data.map(item => this._filterObject(item, allowedFields));
    }

    return this._filterObject(data, allowedFields);
  }

  /**
   * Вспомогательные методы
   */
  
  static _getPermissionForAction(action, resource) {
    const actionMap = {
      view: 'VIEW',
      create: 'CREATE',
      update: 'UPDATE',
      delete: 'DELETE',
      publish: 'PUBLISH',
      moderate: 'MODERATE',
      validate: 'VALIDATE',
      generate: 'GENERATE'
    };

    const resourceMap = {
      user: 'USER',
      concept: 'CONCEPT',
      graph: 'GRAPH',
      thesis: 'THESIS',
      synthesis: 'SYNTHESIS'
    };

    const actionKey = actionMap[action];
    const resourceKey = resourceMap[resource];

    if (!actionKey || !resourceKey) {
      return null;
    }

    const permissionKey = `${resourceKey}_${actionKey}`;
    return PERMISSIONS[permissionKey];
  }

  static _filterObject(obj, allowedFields) {
    const filtered = {};
    
    Object.keys(obj).forEach(key => {
      if (allowedFields[key] || allowedFields['*']) {
        filtered[key] = obj[key];
      }
    });

    return filtered;
  }
}

// Экспорт констант и класса
module.exports = {
  ROLES,
  PERMISSIONS,
  ROLE_HIERARCHY,
  ROLE_PERMISSIONS,
  RoleHelper
};
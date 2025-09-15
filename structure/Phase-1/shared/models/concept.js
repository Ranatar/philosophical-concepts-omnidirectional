/**
 * Concept Model
 * Доменная модель философской концепции
 */

const { v4: uuidv4 } = require('uuid');
const { ValidationError } = require('../lib/errors/ValidationError');

class Concept {
  constructor(data = {}) {
    this.conceptId = data.conceptId || data.concept_id || uuidv4();
    this.creatorId = data.creatorId || data.creator_id;
    this.name = data.name;
    this.description = data.description || '';
    this.creationDate = data.creationDate || data.creation_date || new Date();
    this.lastModified = data.lastModified || data.last_modified || new Date();
    
    // Синтез
    this.isSynthesis = data.isSynthesis !== undefined ? data.isSynthesis : data.is_synthesis || false;
    this.parentConcepts = data.parentConcepts || data.parent_concepts || [];
    this.synthesisMethod = data.synthesisMethod || data.synthesis_method || null;
    
    // Характеристики
    this.focus = data.focus || null;
    this.innovationDegree = data.innovationDegree || data.innovation_degree || 3; // 1-5
    this.historicalContext = data.historicalContext || data.historical_context || null;
    
    // Связанные сущности
    this.philosophers = data.philosophers || [];
    this.traditions = data.traditions || [];
    
    // Метаданные
    this.tags = data.tags || [];
    this.visibility = data.visibility || 'private'; // private, public, shared
    this.collaborators = data.collaborators || [];
    this.version = data.version || 1;
    
    // Статистика
    this.viewCount = data.viewCount || 0;
    this.interactionCount = data.interactionCount || 0;
    this.synthesisCount = data.synthesisCount || 0; // Сколько раз использовалась для синтеза
    
    // Состояние
    this.status = data.status || 'draft'; // draft, published, archived
    this.isDeleted = data.isDeleted || false;
  }

  /**
   * Валидация модели
   */
  validate() {
    const errors = [];

    if (!this.name || this.name.trim().length === 0) {
      errors.push({
        field: 'name',
        message: 'Concept name is required'
      });
    }

    if (this.name && this.name.length > 255) {
      errors.push({
        field: 'name',
        message: 'Concept name must not exceed 255 characters'
      });
    }

    if (!this.creatorId) {
      errors.push({
        field: 'creatorId',
        message: 'Creator ID is required'
      });
    }

    if (this.innovationDegree < 1 || this.innovationDegree > 5) {
      errors.push({
        field: 'innovationDegree',
        message: 'Innovation degree must be between 1 and 5'
      });
    }

    if (this.isSynthesis && (!this.parentConcepts || this.parentConcepts.length < 2)) {
      errors.push({
        field: 'parentConcepts',
        message: 'Synthesis concepts must have at least 2 parent concepts'
      });
    }

    const validVisibilities = ['private', 'public', 'shared'];
    if (!validVisibilities.includes(this.visibility)) {
      errors.push({
        field: 'visibility',
        message: `Visibility must be one of: ${validVisibilities.join(', ')}`
      });
    }

    const validStatuses = ['draft', 'published', 'archived'];
    if (!validStatuses.includes(this.status)) {
      errors.push({
        field: 'status',
        message: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }

    if (errors.length > 0) {
      throw new ValidationError('Concept validation failed', errors);
    }

    return true;
  }

  /**
   * Проверка, является ли концепция синтезом
   */
  isSynthesisConcept() {
    return this.isSynthesis && this.parentConcepts.length >= 2;
  }

  /**
   * Проверка, является ли концепция публичной
   */
  isPublic() {
    return this.visibility === 'public' && this.status === 'published';
  }

  /**
   * Проверка, может ли пользователь просматривать концепцию
   */
  canBeViewedBy(userId) {
    if (this.isDeleted) {
      return false;
    }

    if (this.visibility === 'public') {
      return true;
    }

    if (this.creatorId === userId) {
      return true;
    }

    if (this.visibility === 'shared' && this.collaborators.includes(userId)) {
      return true;
    }

    return false;
  }

  /**
   * Проверка, может ли пользователь редактировать концепцию
   */
  canBeEditedBy(userId) {
    if (this.isDeleted || this.status === 'archived') {
      return false;
    }

    return this.creatorId === userId || this.collaborators.includes(userId);
  }

  /**
   * Добавление соавтора
   */
  addCollaborator(userId) {
    if (!this.collaborators.includes(userId) && userId !== this.creatorId) {
      this.collaborators.push(userId);
      this.updateModified();
    }
    return this;
  }

  /**
   * Удаление соавтора
   */
  removeCollaborator(userId) {
    const index = this.collaborators.indexOf(userId);
    if (index > -1) {
      this.collaborators.splice(index, 1);
      this.updateModified();
    }
    return this;
  }

  /**
   * Добавление философа
   */
  addPhilosopher(philosopherId) {
    if (!this.philosophers.find(p => p.id === philosopherId)) {
      this.philosophers.push({
        id: philosopherId,
        addedAt: new Date()
      });
      this.updateModified();
    }
    return this;
  }

  /**
   * Добавление традиции
   */
  addTradition(traditionId, strength = 0.5) {
    if (!this.traditions.find(t => t.id === traditionId)) {
      this.traditions.push({
        id: traditionId,
        strength,
        addedAt: new Date()
      });
      this.updateModified();
    }
    return this;
  }

  /**
   * Добавление тега
   */
  addTag(tag) {
    const normalizedTag = tag.toLowerCase().trim();
    if (normalizedTag && !this.tags.includes(normalizedTag)) {
      this.tags.push(normalizedTag);
      this.updateModified();
    }
    return this;
  }

  /**
   * Удаление тега
   */
  removeTag(tag) {
    const normalizedTag = tag.toLowerCase().trim();
    const index = this.tags.indexOf(normalizedTag);
    if (index > -1) {
      this.tags.splice(index, 1);
      this.updateModified();
    }
    return this;
  }

  /**
   * Обновление времени последнего изменения
   */
  updateModified() {
    this.lastModified = new Date();
    this.version += 1;
    return this;
  }

  /**
   * Публикация концепции
   */
  publish() {
    if (this.status === 'draft') {
      this.status = 'published';
      this.updateModified();
    }
    return this;
  }

  /**
   * Архивирование концепции
   */
  archive() {
    this.status = 'archived';
    this.updateModified();
    return this;
  }

  /**
   * Мягкое удаление концепции
   */
  softDelete() {
    this.isDeleted = true;
    this.status = 'archived';
    this.updateModified();
    return this;
  }

  /**
   * Увеличение счетчика просмотров
   */
  incrementViewCount() {
    this.viewCount += 1;
    return this;
  }

  /**
   * Увеличение счетчика взаимодействий
   */
  incrementInteractionCount() {
    this.interactionCount += 1;
    return this;
  }

  /**
   * Увеличение счетчика использования в синтезе
   */
  incrementSynthesisCount() {
    this.synthesisCount += 1;
    return this;
  }

  /**
   * Получение краткой информации для списков
   */
  toListJSON() {
    return {
      conceptId: this.conceptId,
      name: this.name,
      description: this.description.substring(0, 200) + (this.description.length > 200 ? '...' : ''),
      creatorId: this.creatorId,
      creationDate: this.creationDate,
      lastModified: this.lastModified,
      isSynthesis: this.isSynthesis,
      status: this.status,
      visibility: this.visibility,
      tags: this.tags,
      viewCount: this.viewCount,
      innovationDegree: this.innovationDegree
    };
  }

  /**
   * Получение полной информации
   */
  toDetailJSON() {
    return {
      conceptId: this.conceptId,
      creatorId: this.creatorId,
      name: this.name,
      description: this.description,
      creationDate: this.creationDate,
      lastModified: this.lastModified,
      isSynthesis: this.isSynthesis,
      parentConcepts: this.parentConcepts,
      synthesisMethod: this.synthesisMethod,
      focus: this.focus,
      innovationDegree: this.innovationDegree,
      historicalContext: this.historicalContext,
      philosophers: this.philosophers,
      traditions: this.traditions,
      tags: this.tags,
      visibility: this.visibility,
      collaborators: this.collaborators,
      version: this.version,
      status: this.status,
      statistics: {
        viewCount: this.viewCount,
        interactionCount: this.interactionCount,
        synthesisCount: this.synthesisCount
      }
    };
  }

  /**
   * Преобразование в объект для сохранения в БД
   */
  toDatabaseObject() {
    return {
      concept_id: this.conceptId,
      creator_id: this.creatorId,
      name: this.name,
      description: this.description,
      creation_date: this.creationDate,
      last_modified: this.lastModified,
      is_synthesis: this.isSynthesis,
      parent_concepts: JSON.stringify(this.parentConcepts),
      synthesis_method: this.synthesisMethod,
      focus: this.focus,
      innovation_degree: this.innovationDegree,
      historical_context: this.historicalContext,
      tags: JSON.stringify(this.tags),
      visibility: this.visibility,
      collaborators: JSON.stringify(this.collaborators),
      version: this.version,
      status: this.status,
      is_deleted: this.isDeleted,
      view_count: this.viewCount,
      interaction_count: this.interactionCount,
      synthesis_count: this.synthesisCount
    };
  }

  /**
   * Создание модели из объекта БД
   */
  static fromDatabaseObject(dbObject) {
    return new Concept({
      conceptId: dbObject.concept_id,
      creatorId: dbObject.creator_id,
      name: dbObject.name,
      description: dbObject.description,
      creationDate: dbObject.creation_date,
      lastModified: dbObject.last_modified,
      isSynthesis: dbObject.is_synthesis,
      parentConcepts: typeof dbObject.parent_concepts === 'string' 
        ? JSON.parse(dbObject.parent_concepts) 
        : dbObject.parent_concepts,
      synthesisMethod: dbObject.synthesis_method,
      focus: dbObject.focus,
      innovationDegree: dbObject.innovation_degree,
      historicalContext: dbObject.historical_context,
      tags: typeof dbObject.tags === 'string' 
        ? JSON.parse(dbObject.tags) 
        : dbObject.tags,
      visibility: dbObject.visibility,
      collaborators: typeof dbObject.collaborators === 'string' 
        ? JSON.parse(dbObject.collaborators) 
        : dbObject.collaborators,
      version: dbObject.version,
      status: dbObject.status,
      isDeleted: dbObject.is_deleted,
      viewCount: dbObject.view_count,
      interactionCount: dbObject.interaction_count,
      synthesisCount: dbObject.synthesis_count
    });
  }

  /**
   * Создание концепции для синтеза
   */
  static createSynthesis(creatorId, parentConceptIds, data = {}) {
    return new Concept({
      ...data,
      creatorId,
      isSynthesis: true,
      parentConcepts: parentConceptIds.map(id => ({
        conceptId: id,
        weight: 1.0 / parentConceptIds.length
      })),
      synthesisMethod: data.synthesisMethod || 'dialectical'
    });
  }

  /**
   * Клонирование концепции
   */
  clone() {
    return new Concept({
      ...this,
      conceptId: uuidv4(),
      creationDate: new Date(),
      lastModified: new Date(),
      version: 1,
      viewCount: 0,
      interactionCount: 0,
      synthesisCount: 0,
      status: 'draft'
    });
  }

  /**
   * Сравнение с другой концепцией
   */
  equals(other) {
    if (!(other instanceof Concept)) {
      return false;
    }
    return this.conceptId === other.conceptId;
  }
}

module.exports = Concept;
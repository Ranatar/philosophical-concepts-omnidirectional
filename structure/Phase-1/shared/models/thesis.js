/**
 * Thesis Model
 * Доменная модель философского тезиса
 */

const { v4: uuidv4 } = require('uuid');
const { ValidationError } = require('../lib/errors/ValidationError');

class Thesis {
  constructor(data = {}) {
    this.thesisId = data.thesisId || data.thesis_id || uuidv4();
    this.conceptId = data.conceptId || data.concept_id;
    this.type = data.type || 'ontological';
    this.content = data.content || '';
    this.style = data.style || 'academic';
    
    // Связанные категории
    this.relatedCategories = data.relatedCategories || data.related_categories || [];
    
    // Параметры генерации
    this.generationParameters = data.generationParameters || data.generation_parameters || {};
    
    // Для синтезированных тезисов
    this.parentTheses = data.parentTheses || data.parent_theses || [];
    this.isSynthesized = data.isSynthesized || data.is_synthesized || false;
    
    // Обоснование и анализ
    this.justification = data.justification || null;
    this.counterarguments = data.counterarguments || [];
    this.supportingEvidence = data.supportingEvidence || [];
    
    // Метаданные
    this.createdAt = data.createdAt || data.created_at || new Date();
    this.updatedAt = data.updatedAt || data.updated_at || new Date();
    this.version = data.version || 1;
    
    // Оценки и характеристики
    this.clarity = data.clarity !== undefined ? data.clarity : null;
    this.originality = data.originality !== undefined ? data.originality : null;
    this.validity = data.validity !== undefined ? data.validity : null;
    this.relevance = data.relevance !== undefined ? data.relevance : null;
    
    // Статистика использования
    this.viewCount = data.viewCount || 0;
    this.citationCount = data.citationCount || 0;
    this.shareCount = data.shareCount || 0;
    
    // Состояние
    this.status = data.status || 'draft'; // draft, reviewed, published
    this.isDeleted = data.isDeleted || false;
    
    // Дополнительные атрибуты
    this.tags = data.tags || [];
    this.language = data.language || 'ru';
    this.claudeGenerationId = data.claudeGenerationId || null;
  }

  /**
   * Валидация модели
   */
  validate() {
    const errors = [];

    if (!this.conceptId) {
      errors.push({
        field: 'conceptId',
        message: 'Concept ID is required'
      });
    }

    if (!this.content || this.content.trim().length === 0) {
      errors.push({
        field: 'content',
        message: 'Thesis content is required'
      });
    }

    if (this.content && this.content.length > 5000) {
      errors.push({
        field: 'content',
        message: 'Thesis content must not exceed 5000 characters'
      });
    }

    const validTypes = [
      'ontological', 'epistemological', 'axiological', 'ethical',
      'aesthetic', 'metaphysical', 'logical', 'methodological',
      'anthropological', 'social', 'political', 'historical',
      'phenomenological', 'existential', 'analytical', 'critical',
      'synthetic', 'comparative'
    ];

    if (!validTypes.includes(this.type)) {
      errors.push({
        field: 'type',
        message: `Thesis type must be one of: ${validTypes.join(', ')}`
      });
    }

    const validStyles = [
      'academic', 'popular', 'aphoristic', 'analytical',
      'narrative', 'dialogical', 'poetic'
    ];

    if (!validStyles.includes(this.style)) {
      errors.push({
        field: 'style',
        message: `Style must be one of: ${validStyles.join(', ')}`
      });
    }

    const validStatuses = ['draft', 'reviewed', 'published'];
    if (!validStatuses.includes(this.status)) {
      errors.push({
        field: 'status',
        message: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Валидация оценок (если заданы)
    const scoreFields = ['clarity', 'originality', 'validity', 'relevance'];
    scoreFields.forEach(field => {
      if (this[field] !== null && (this[field] < 0 || this[field] > 1)) {
        errors.push({
          field,
          message: `${field} must be between 0 and 1`
        });
      }
    });

    // Проверка синтезированных тезисов
    if (this.isSynthesized && (!this.parentTheses || this.parentTheses.length < 2)) {
      errors.push({
        field: 'parentTheses',
        message: 'Synthesized theses must have at least 2 parent theses'
      });
    }

    if (errors.length > 0) {
      throw new ValidationError('Thesis validation failed', errors);
    }

    return true;
  }

  /**
   * Проверка, является ли тезис синтезированным
   */
  isSynthetic() {
    return this.isSynthesized && this.parentTheses.length >= 2;
  }

  /**
   * Проверка, опубликован ли тезис
   */
  isPublished() {
    return this.status === 'published' && !this.isDeleted;
  }

  /**
   * Проверка, имеет ли тезис обоснование
   */
  hasJustification() {
    return this.justification !== null && this.justification.length > 0;
  }

  /**
   * Проверка, имеет ли тезис контраргументы
   */
  hasCounterarguments() {
    return this.counterarguments.length > 0;
  }

  /**
   * Добавление связанной категории
   */
  addRelatedCategory(categoryId) {
    if (!this.relatedCategories.includes(categoryId)) {
      this.relatedCategories.push(categoryId);
      this.updateModified();
    }
    return this;
  }

  /**
   * Удаление связанной категории
   */
  removeRelatedCategory(categoryId) {
    const index = this.relatedCategories.indexOf(categoryId);
    if (index > -1) {
      this.relatedCategories.splice(index, 1);
      this.updateModified();
    }
    return this;
  }

  /**
   * Добавление обоснования
   */
  setJustification(justification) {
    this.justification = justification;
    this.updateModified();
    return this;
  }

  /**
   * Добавление контраргумента
   */
  addCounterargument(counterargument) {
    this.counterarguments.push({
      id: uuidv4(),
      content: counterargument,
      addedAt: new Date()
    });
    this.updateModified();
    return this;
  }

  /**
   * Добавление подтверждающего доказательства
   */
  addSupportingEvidence(evidence) {
    this.supportingEvidence.push({
      id: uuidv4(),
      content: evidence.content,
      source: evidence.source,
      type: evidence.type || 'empirical', // empirical, logical, historical, theoretical
      addedAt: new Date()
    });
    this.updateModified();
    return this;
  }

  /**
   * Установка оценки
   */
  setScore(field, value) {
    const validFields = ['clarity', 'originality', 'validity', 'relevance'];
    
    if (!validFields.includes(field)) {
      throw new ValidationError(`Invalid score field: ${field}`);
    }
    
    if (value < 0 || value > 1) {
      throw new ValidationError(`Score must be between 0 and 1`);
    }
    
    this[field] = value;
    this.updateModified();
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
   * Обновление времени модификации
   */
  updateModified() {
    this.updatedAt = new Date();
    this.version += 1;
    return this;
  }

  /**
   * Публикация тезиса
   */
  publish() {
    if (this.status !== 'published') {
      this.status = 'published';
      this.updateModified();
    }
    return this;
  }

  /**
   * Отметка как проверенного
   */
  markAsReviewed() {
    if (this.status === 'draft') {
      this.status = 'reviewed';
      this.updateModified();
    }
    return this;
  }

  /**
   * Мягкое удаление
   */
  softDelete() {
    this.isDeleted = true;
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
   * Увеличение счетчика цитирований
   */
  incrementCitationCount() {
    this.citationCount += 1;
    return this;
  }

  /**
   * Увеличение счетчика поделиться
   */
  incrementShareCount() {
    this.shareCount += 1;
    return this;
  }

  /**
   * Получение краткой версии для списков
   */
  toListJSON() {
    return {
      thesisId: this.thesisId,
      conceptId: this.conceptId,
      type: this.type,
      content: this.content.substring(0, 200) + (this.content.length > 200 ? '...' : ''),
      style: this.style,
      createdAt: this.createdAt,
      status: this.status,
      hasJustification: this.hasJustification(),
      hasCounterarguments: this.hasCounterarguments(),
      scores: {
        clarity: this.clarity,
        originality: this.originality,
        validity: this.validity,
        relevance: this.relevance
      },
      statistics: {
        viewCount: this.viewCount,
        citationCount: this.citationCount
      }
    };
  }

  /**
   * Получение полной информации
   */
  toDetailJSON() {
    return {
      thesisId: this.thesisId,
      conceptId: this.conceptId,
      type: this.type,
      content: this.content,
      style: this.style,
      relatedCategories: this.relatedCategories,
      generationParameters: this.generationParameters,
      parentTheses: this.parentTheses,
      isSynthesized: this.isSynthesized,
      justification: this.justification,
      counterarguments: this.counterarguments,
      supportingEvidence: this.supportingEvidence,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      version: this.version,
      scores: {
        clarity: this.clarity,
        originality: this.originality,
        validity: this.validity,
        relevance: this.relevance
      },
      statistics: {
        viewCount: this.viewCount,
        citationCount: this.citationCount,
        shareCount: this.shareCount
      },
      status: this.status,
      tags: this.tags,
      language: this.language,
      claudeGenerationId: this.claudeGenerationId
    };
  }

  /**
   * Преобразование в объект для сохранения в БД
   */
  toDatabaseObject() {
    return {
      thesis_id: this.thesisId,
      concept_id: this.conceptId,
      type: this.type,
      content: this.content,
      style: this.style,
      related_categories: this.relatedCategories,
      generation_parameters: this.generationParameters,
      parent_theses: this.parentTheses,
      is_synthesized: this.isSynthesized,
      justification: this.justification,
      counterarguments: this.counterarguments,
      supporting_evidence: this.supportingEvidence,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
      version: this.version,
      clarity: this.clarity,
      originality: this.originality,
      validity: this.validity,
      relevance: this.relevance,
      view_count: this.viewCount,
      citation_count: this.citationCount,
      share_count: this.shareCount,
      status: this.status,
      is_deleted: this.isDeleted,
      tags: this.tags,
      language: this.language,
      claude_generation_id: this.claudeGenerationId
    };
  }

  /**
   * Создание модели из объекта БД
   */
  static fromDatabaseObject(dbObject) {
    return new Thesis({
      thesisId: dbObject.thesis_id,
      conceptId: dbObject.concept_id,
      type: dbObject.type,
      content: dbObject.content,
      style: dbObject.style,
      relatedCategories: dbObject.related_categories,
      generationParameters: dbObject.generation_parameters,
      parentTheses: dbObject.parent_theses,
      isSynthesized: dbObject.is_synthesized,
      justification: dbObject.justification,
      counterarguments: dbObject.counterarguments,
      supportingEvidence: dbObject.supporting_evidence,
      createdAt: dbObject.created_at,
      updatedAt: dbObject.updated_at,
      version: dbObject.version,
      clarity: dbObject.clarity,
      originality: dbObject.originality,
      validity: dbObject.validity,
      relevance: dbObject.relevance,
      viewCount: dbObject.view_count,
      citationCount: dbObject.citation_count,
      shareCount: dbObject.share_count,
      status: dbObject.status,
      isDeleted: dbObject.is_deleted,
      tags: dbObject.tags,
      language: dbObject.language,
      claudeGenerationId: dbObject.claude_generation_id
    });
  }

  /**
   * Создание синтезированного тезиса
   */
  static createSynthesized(conceptId, parentThesisIds, content, type = 'synthetic') {
    return new Thesis({
      conceptId,
      type,
      content,
      isSynthesized: true,
      parentTheses: parentThesisIds,
      generationParameters: {
        method: 'synthesis',
        parentCount: parentThesisIds.length
      }
    });
  }

  /**
   * Клонирование тезиса
   */
  clone() {
    return new Thesis({
      ...this,
      thesisId: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
      viewCount: 0,
      citationCount: 0,
      shareCount: 0,
      status: 'draft'
    });
  }

  /**
   * Сравнение с другим тезисом
   */
  equals(other) {
    if (!(other instanceof Thesis)) {
      return false;
    }
    return this.thesisId === other.thesisId;
  }

  /**
   * Расчет общего рейтинга тезиса
   */
  calculateOverallScore() {
    const scores = [this.clarity, this.originality, this.validity, this.relevance]
      .filter(score => score !== null);
    
    if (scores.length === 0) {
      return null;
    }
    
    const sum = scores.reduce((acc, score) => acc + score, 0);
    return sum / scores.length;
  }
}

module.exports = Thesis;
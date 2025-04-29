/**
 * Сервис форматирования запросов к Claude
 */
class ClaudeRequestFormatter {
  /**
   * Форматирует запрос для валидации графа
   * @param {Object} graphData - Данные графа концепции
   * @returns {String} - Форматированный запрос
   */
  formatGraphValidationRequest(graphData) {
    return `Проанализируй следующий граф категорий философской концепции ${JSON.stringify(graphData, null, 2)}. 
    Выяви возможные логические противоречия, пропущенные важные категории или 
    связи, необычные отношения между категориями. Предложи возможные улучшения.`;
  }

  /**
   * Форматирует запрос для обогащения категории
   * @param {Object} categoryData - Данные категории
   * @param {String} conceptName - Название концепции
   * @param {Array} traditions - Список традиций
   * @param {Array} philosophers - Список философов
   * @returns {String} - Форматированный запрос
   */
  formatCategoryEnrichmentRequest(categoryData, conceptName, traditions, philosophers) {
    return `Для следующей категории "${categoryData.name}" с определением "${categoryData.definition}"
    в контексте философской концепции "${conceptName}", предложи расширенное
    описание, возможные альтернативные трактовки, исторические аналоги и связанные концепты.
    Категория используется в традициях: ${traditions.join(', ')}
    Категория связана с философами: ${philosophers.join(', ')}
    При обогащении учитывай указанные традиции и философов.`;
  }

  /**
   * Форматирует запрос для обогащения связи
   * @param {Object} relationshipData - Данные связи
   * @param {String} category1 - Первая категория
   * @param {String} category2 - Вторая категория
   * @param {String} conceptName - Название концепции
   * @returns {String} - Форматированный запрос
   */
  formatRelationshipEnrichmentRequest(relationshipData, category1, category2, conceptName) {
    return `Проанализируй связь типа "${relationshipData.type}" между категориями "${category1}" 
    и "${category2}" в контексте "${conceptName}". Предложи философское обоснование 
    этой связи, возможные контраргументы и примеры аналогичных связей в других философских системах.`;
  }

  /**
   * Форматирует запрос для генерации тезисов
   * @param {Object} graphData - Данные графа концепции
   * @param {Number} quantity - Количество тезисов
   * @param {String} thesisType - Тип тезисов
   * @param {String} style - Стиль изложения
   * @returns {String} - Форматированный запрос
   */
  formatThesisGenerationRequest(graphData, quantity, thesisType, style) {
    return `На основе следующего графа философской концепции ${JSON.stringify(graphData, null, 2)} 
    сформулируй ${quantity} ключевых тезисов в области ${thesisType}. 
    Тезисы должны отражать структурные отношения между категориями и быть 
    выражены в ${style} стиле. Для каждого тезиса укажи, из каких именно 
    элементов графа он логически следует.`;
  }

  /**
   * Форматирует запрос для синтеза концепций
   * @param {Object} concept1 - Первая концепция
   * @param {Object} concept2 - Вторая концепция
   * @param {String} method - Метод синтеза
   * @param {String} focus - Фокус синтеза
   * @param {String} innovationDegree - Степень инновационности
   * @returns {String} - Форматированный запрос
   */
  formatConceptSynthesisRequest(concept1, concept2, method, focus, innovationDegree) {
    return `На основе графов философских концепций ${JSON.stringify(concept1, null, 2)} и ${JSON.stringify(concept2, null, 2)} 
    разработай граф синтетической концепции, используя метод ${method}. 
    Фокус синтеза: ${focus}. Степень инновационности: ${innovationDegree}. 
    Для каждого элемента нового графа укажи его происхождение (из какой исходной 
    концепции он взят или как трансформирован) и обоснование включения.`;
  }

  /**
   * Форматирует запрос для генерации названия концепции
   * @param {Object} graphData - Данные графа концепции
   * @param {Array} theses - Список тезисов
   * @returns {String} - Форматированный запрос
   */
  formatConceptNameGenerationRequest(graphData, theses) {
    return `На основе следующего графа концепции ${JSON.stringify(graphData, null, 2)} 
    или списка тезисов ${JSON.stringify(theses, null, 2)},
    предложи лаконичное и содержательное название для этой философской концепции. 
    Название должно отражать сущность концепции и быть узнаваемым в философской традиции. 
    Предоставь обоснование своего предложения.`;
  }

  /**
   * Форматирует запрос для создания диалога между концепциями
   * @param {Object} concept1 - Первая концепция
   * @param {String} name1 - Название первой концепции
   * @param {Object} concept2 - Вторая концепция
   * @param {String} name2 - Название второй концепции
   * @param {String} topic - Тема диалога
   * @returns {String} - Форматированный запрос
   */
  formatDialogueRequest(concept1, name1, concept2, name2, topic) {
    return `Создай философский диалог между представителями концепций ${JSON.stringify(concept1, null, 2)} 
    под названием "${name1}" и ${JSON.stringify(concept2, null, 2)} под названием "${name2}" 
    по вопросу "${topic}". Диалог должен отражать ключевые тезисы каждой концепции, 
    логику аргументации и возможные точки соприкосновения или непреодолимых разногласий.`;
  }
}

// Экспорт класса
module.exports = new ClaudeRequestFormatter();

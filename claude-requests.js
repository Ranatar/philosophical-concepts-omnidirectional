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
   * Форматирует запрос для генерации тезисов с учётом количественных характеристик
   * @param {Object} graphData - Данные графа концепции с количественными характеристиками
   * @param {Number} quantity - Количество тезисов
   * @param {String} thesisType - Тип тезисов
   * @param {Object} characteristicsConfig - Настройки учёта характеристик
   * @returns {String} - Форматированный запрос
   */
  formatThesisGenerationWithCharacteristicsRequest(graphData, quantity, thesisType, characteristicsConfig) {
    return `На основе следующего графа философской концепции ${JSON.stringify(graphData, null, 2)} 
    сформулируй ${quantity} ключевых тезисов в области ${thesisType}. 
    Обрати особое внимание на категории с высокой центральностью (> ${characteristicsConfig.centralityThreshold || 0.7}) 
    и связи с высокой силой (> ${characteristicsConfig.strengthThreshold || 0.7}). 
    Для категорий с низкой определённостью (< ${characteristicsConfig.certaintyThreshold || 0.4}) 
    предложи альтернативные формулировки тезисов.
    ${characteristicsConfig.additionalInstructions || ''}`;
  }

  /**
   * Форматирует запрос для сравнения версий тезисов с разным учётом характеристик
   * @param {Array} thesesWithoutCharacteristics - Тезисы без учёта характеристик
   * @param {Array} thesesWithCharacteristics - Тезисы с учётом характеристик
   * @param {Object} characteristicsConfig - Информация о применённых характеристиках
   * @returns {String} - Форматированный запрос
   */
  formatThesisComparisonRequest(thesesWithoutCharacteristics, thesesWithCharacteristics, characteristicsConfig) {
    return `Сравни два набора тезисов, сгенерированных на основе одного графа концепции, 
    но с разным учётом количественных характеристик: 
    [ТЕЗИСЫ БЕЗ УЧЁТА ХАРАКТЕРИСТИК]: ${JSON.stringify(thesesWithoutCharacteristics, null, 2)} и 
    [ТЕЗИСЫ С УЧЁТОМ ХАРАКТЕРИСТИК]: ${JSON.stringify(thesesWithCharacteristics, null, 2)}. 
    При генерации второго набора учитывались следующие характеристики:
    - Порог центральности категорий: ${characteristicsConfig.centralityThreshold || 0.7}
    - Порог силы связей: ${characteristicsConfig.strengthThreshold || 0.7}
    - Порог определённости категорий: ${characteristicsConfig.certaintyThreshold || 0.4}
    
    Выяви ключевые различия, их причины и оцени, какой набор лучше отражает суть концепции и почему.`;
  }

  /**
   * Форматирует запрос для синтеза концепций с учётом количественных характеристик
   * @param {Object} concept1 - Первая концепция с количественными характеристиками
   * @param {Object} concept2 - Вторая концепция с количественными характеристиками
   * @param {String} method - Метод синтеза
   * @param {String} focus - Фокус синтеза
   * @param {String} innovationDegree - Степень инновационности
   * @param {Object} characteristicsConfig - Настройки трансформации характеристик
   * @returns {String} - Форматированный запрос
   */
  formatConceptSynthesisWithCharacteristicsRequest(concept1, concept2, method, focus, innovationDegree, characteristicsConfig) {
    return `Синтезируй новую философскую концепцию на основе концепций 
    ${JSON.stringify(concept1, null, 2)} и ${JSON.stringify(concept2, null, 2)}. 
    Используй метод синтеза: ${method}. 
    Фокус синтеза: ${focus}. 
    Степень инновационности: ${innovationDegree}.
    
    Учитывай количественные характеристики элементов исходных концепций следующим образом:
    1) при конфликте приоритет отдавать элементам с более высокой центральностью,
    2) сохранять силу связей пропорционально их значимости в исходных концепциях,
    3) переоценивать определённость категорий с учётом их новых отношений.
    
    Дополнительные инструкции по трансформации характеристик:
    ${characteristicsConfig.transformationRules || 'Нет дополнительных инструкций'}
    
    Для каждого элемента нового графа укажи его происхождение и обоснование включения, 
    а также расчёт его количественных характеристик.`;
  }

  /**
   * Форматирует запрос для генерации метаданных для количественных характеристик
   * @param {String} category - Название категории
   * @param {String} characteristic - Название характеристики
   * @param {Number} value - Значение характеристики
   * @returns {String} - Форматированный запрос
   */
  formatQuantitativeCharacteristicsMetadataRequest(category, characteristic, value) {
    return `Я определил для категории "${category}" следующую характеристику: ${characteristic} = ${value}. 
    Предложи философские и методологические основания для такой оценки, её возможные 
    ограничения и альтернативные подходы к оценке.`;
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

  /**
   * Форматирует запрос для генерации графа на основе тезисов
   * @param {Array} theses - Список тезисов
   * @returns {String} - Форматированный запрос
   */
  formatThesisToGraphRequest(theses) {
    return `На основе следующих философских тезисов ${JSON.stringify(theses, null, 2)} создай 
    структурированный граф концепции. Выдели ключевые категории, установи связи 
    между ними и предложи иерархию. Для каждого элемента графа укажи, из каких 
    именно тезисов он логически следует.`;
  }

  /**
   * Форматирует запрос для анализа тезисов для выявления синтеза
   * @param {Array} theses - Список тезисов
   * @returns {String} - Форматированный запрос
   */
  formatThesisOriginAnalysisRequest(theses) {
    return `Проанализируй следующие философские тезисы ${JSON.stringify(theses, null, 2)}. 
    Определи, представляют ли они единую философскую перспективу или являются 
    синтезом различных философских традиций. Если это синтез, идентифицируй возможные 
    'родительские' философские традиции или концепции, которые могли быть объединены. 
    Предоставь детальное обоснование своего анализа.`;
  }

  /**
   * Форматирует запрос для анализа графа для выявления происхождения
   * @param {Object} graphData - Данные графа концепции
   * @returns {String} - Форматированный запрос
   */
  formatGraphOriginAnalysisRequest(graphData) {
    return `Проанализируй следующий граф концепции ${JSON.stringify(graphData, null, 2)}. 
    Определи, является ли данная концепция синтезом существующих философских традиций. 
    Если да, идентифицируй возможные 'родительские' концепции, элементы которых 
    объединены в данной концепции. Укажи конкретные признаки, позволяющие сделать 
    такой вывод, и оцени приблизительное соотношение влияния каждой родительской концепции.`;
  }

  /**
   * Форматирует запрос для анализа названия концепции
   * @param {String} name - Название концепции
   * @param {Object} conceptData - Данные концепции (опционально)
   * @returns {String} - Форматированный запрос
   */
  formatConceptNameAnalysisRequest(name, conceptData = null) {
    let conceptDataStr = conceptData ? `в контексте её содержания ${JSON.stringify(conceptData, null, 2)}` : '';
    
    return `Проанализируй название философской концепции "${name}" ${conceptDataStr}. 
    Насколько точно название отражает суть концепции? Какие аспекты концепции 
    подчеркиваются в названии, а какие остаются в тени? Предложи возможные 
    альтернативные названия, которые могли бы лучше отразить различные аспекты концепции.`;
  }

  /**
   * Форматирует запрос для возможных направлений эволюции концепции
   * @param {Object} conceptData - Данные концепции
   * @param {String} conceptName - Название концепции
   * @returns {String} - Форматированный запрос
   */
  formatConceptEvolutionRequest(conceptData, conceptName) {
    return `Предложи возможные направления эволюции философской концепции ${JSON.stringify(conceptData, null, 2)} 
    под названием "${conceptName}" в свете современных научных открытий, социальных 
    изменений и философских тенденций. Какие категории могли бы измениться, какие связи 
    переосмыслены, какие новые элементы добавлены? Как может измениться или должно ли 
    сохраниться название концепции при её эволюции?`;
  }

  /**
 * Форматирует запрос для исторической контекстуализации с расширенными параметрами
 * @param {Object} conceptData - Данные концепции
 * @param {String} conceptName - Название концепции
 * @param {Array} traditions - Список традиций (опционально)
 * @param {Array} philosophers - Список философов (опционально)
 * @param {Object} timeContext - Временной контекст (опционально)
 * @returns {String} - Форматированный запрос
 */
formatHistoricalContextRequest(conceptData, conceptName, traditions = [], philosophers = [], timeContext = null) {
  let contextualizationScope = "";
  
  if (traditions && traditions.length > 0) {
    contextualizationScope += `\nОсобое внимание обрати на связь с традициями: ${traditions.join(', ')}.`;
  }
  
  if (philosophers && philosophers.length > 0) {
    contextualizationScope += `\nРассмотри влияние следующих философов: ${philosophers.join(', ')}.`;
  }
  
  if (timeContext) {
    contextualizationScope += `\nПоместить в контекст периода: ${timeContext.start || "древность"} - ${timeContext.end || "современность"}.`;
  }
  
  return `Помести философскую концепцию ${JSON.stringify(conceptData, null, 2)} 
  под названием "${conceptName}" в исторический контекст. 
  Определи её возможные источники влияния, современников со схожими 
  или противоположными идеями, а также потенциальное влияние на последующие 
  философские направления. Объясни, насколько название концепции соответствует 
  её историческому контексту.${contextualizationScope}
  
  Представь результат в структурированном виде, включающем:
  1. Общий исторический контекст
  2. Ключевые источники влияния
  3. Современные концепции (сходства и различия)
  4. Потенциальное влияние на последующую философию
  5. Соответствие названия историческому контексту`;
}

/**
 * Форматирует запрос для анализа практического применения с расширенными параметрами
 * @param {Object} conceptData - Данные концепции
 * @param {String} conceptName - Название концепции
 * @param {Array} domains - Конкретные области применения (опционально)
 * @param {Boolean} detailed - Флаг подробного анализа
 * @returns {String} - Форматированный запрос
 */
formatPracticalApplicationRequest(conceptData, conceptName, domains = null, detailed = false) {
  let domainsStr = "образование, этика, политика, личностное развитие, социальные институты";
  
  if (domains && domains.length > 0) {
    domainsStr = domains.join(', ');
  }
  
  let detailLevel = detailed 
    ? "Для каждой области предоставь подробный анализ способов операционализации с конкретными примерами и методиками внедрения."
    : "Для каждой области укажи, какие именно тезисы или категории концепции наиболее релевантны и как они могут быть операционализированы.";
  
  return `Предложи возможные практические применения философской концепции ${JSON.stringify(conceptData, null, 2)} 
  под названием "${conceptName}" в следующих областях: ${domainsStr}. 
  ${detailLevel}
  
  Представь результат в структурированном виде для каждой области:
  1. Краткое описание применимости концепции в данной области
  2. Релевантные тезисы/категории концепции
  3. Конкретные способы операционализации
  4. Потенциальные трудности и ограничения
  5. Критерии оценки эффективности применения`;
}

  /**
   * Форматирует запрос для анализа совместимости концепций
   * @param {Object} concept1 - Первая концепция
   * @param {Object} concept2 - Вторая концепция
   * @returns {String} - Форматированный запрос
   */
  formatConceptCompatibilityRequest(concept1, concept2) {
    return `Проанализируй графы следующих философских концепций: ${JSON.stringify(concept1, null, 2)} и ${JSON.stringify(concept2, null, 2)}. 
    Выяви: 1) полностью совместимые элементы, 2) потенциально совместимые при реинтерпретации, 
    3) принципиально несовместимые элементы. Предложи возможные стратегии синтеза, учитывая 
    выявленные особенности.`;
  }

  /**
   * Форматирует запрос для критического анализа синтезированной концепции
   * @param {Object} synthesizedConcept - Данные синтезированной концепции
   * @returns {String} - Форматированный запрос
   */
  formatSynthesisCritiqueRequest(synthesizedConcept) {
    return `Проведи критический анализ синтезированной концепции ${JSON.stringify(synthesizedConcept, null, 2)}. 
    Оцени: 1) внутреннюю согласованность, 2) философскую новизну, 3) сохранение ценных 
    аспектов исходных концепций, 4) разрешение противоречий между ними, 5) потенциальные 
    проблемы и слабые места.`;
  }

/**
 * Форматирует запрос для создания диалога между концепциями с расширенными параметрами
 * @param {Object} concept1 - Первая концепция
 * @param {String} name1 - Название первой концепции
 * @param {Object} concept2 - Вторая концепция
 * @param {String} name2 - Название второй концепции
 * @param {String} topic - Тема диалога
 * @param {Object} options - Дополнительные параметры диалога
 * @returns {String} - Форматированный запрос
 */
formatDialogueRequest(concept1, name1, concept2, name2, topic, options = {}) {
  const { 
    format = 'классический', 
    length = 'средний', 
    focusPoints = [], 
    characterization = false 
  } = options;
  
  let additionalInstructions = "";
  
  if (focusPoints && focusPoints.length > 0) {
    additionalInstructions += `\nВ диалоге должны быть затронуты следующие аспекты: ${focusPoints.join(', ')}.`;
  }
  
  if (characterization) {
    additionalInstructions += "\nПридай участникам диалога характерные черты в соответствии с их философскими позициями.";
  }
  
  let formatInstruction = "";
  switch (format) {
    case 'платоновский':
      formatInstruction = "Диалог должен быть оформлен в стиле платоновских диалогов.";
      break;
    case 'современный':
      formatInstruction = "Диалог должен быть оформлен в стиле современной академической дискуссии.";
      break;
    case 'дебаты':
      formatInstruction = "Диалог должен быть оформлен в стиле структурированных дебатов с аргументами и контраргументами.";
      break;
    default:
      formatInstruction = "Диалог должен быть оформлен в классическом стиле философской беседы.";
  }
  
  let lengthInstruction = "";
  switch (length) {
    case 'краткий':
      lengthInstruction = "Диалог должен быть кратким, с фокусом на ключевых тезисах.";
      break;
    case 'развернутый':
      lengthInstruction = "Диалог должен быть развернутым, с подробным обсуждением всех аспектов вопроса.";
      break;
    default:
      lengthInstruction = "Диалог должен быть средней длины, охватывая основные аспекты вопроса.";
  }
  
  return `Создай философский диалог между представителями концепций ${JSON.stringify(concept1, null, 2)} 
  под названием "${name1}" и ${JSON.stringify(concept2, null, 2)} под названием "${name2}" 
  по вопросу "${topic}". Диалог должен отражать ключевые тезисы каждой концепции, 
  логику аргументации и возможные точки соприкосновения или непреодолимых разногласий.
  ${formatInstruction}
  ${lengthInstruction}
  ${additionalInstructions}
  
  Структура диалога должна включать:
  1. Краткое введение, представляющее участников и контекст
  2. Изложение позиций сторон по обсуждаемому вопросу
  3. Развитие дискуссии с аргументами и контраргументами
  4. Выявление точек соприкосновения и принципиальных разногласий
  5. Заключение, подводящее итоги диалога`;
}
  
}

// Экспорт класса
module.exports = new ClaudeRequestFormatter();

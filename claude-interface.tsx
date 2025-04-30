import { useState, useEffect, useRef } from 'react';
import { Send, LoaderCircle, Save, Copy, Download, Clock } from 'lucide-react';

// Компонент интерфейса взаимодействия с Claude
const ClaudeInterface = ({ conceptId, interactionType = 'freeform', prefilledTemplate = null }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [asyncTasks, setAsyncTasks] = useState({});
  const [isAsyncProcessing, setIsAsyncProcessing] = useState(false);
  const [templates, setTemplates] = useState([
    { id: 'validate-graph', name: 'Валидация графа', template: 'Проанализируй следующий граф категорий философской концепции [ДАННЫЕ ГРАФА]. Выяви возможные логические противоречия, пропущенные важные категории или связи, необычные отношения между категориями. Предложи возможные улучшения.' },
    { id: 'enrich-category', name: 'Обогащение категории', template: 'Для следующей категории [НАЗВАНИЕ] с определением [ОПРЕДЕЛЕНИЕ] в контексте философской концепции [НАЗВАНИЕ КОНЦЕПЦИИ], предложи расширенное описание, возможные альтернативные трактовки, исторические аналоги и связанные концепты.' },
    { id: 'generate-theses', name: 'Генерация тезисов', template: 'На основе следующего графа философской концепции [ДАННЫЕ ГРАФА] сформулируй [КОЛИЧЕСТВО] ключевых тезисов в области [ТИП ТЕЗИСОВ]. Тезисы должны отражать структурные отношения между категориями и быть выражены в [СТИЛЬ] стиле.' },
    { id: 'concept-name', name: 'Генерация названия концепции', template: 'На основе следующего графа концепции [ДАННЫЕ ГРАФА] или списка тезисов [СПИСОК ТЕЗИСОВ], предложи лаконичное и содержательное название для этой философской концепции.' },
    { id: 'thesis-to-graph', name: 'Генерация графа из тезисов', template: 'На основе следующих философских тезисов [СПИСОК ТЕЗИСОВ] создай структурированный граф концепции. Выдели ключевые категории, установи связи между ними и предложи иерархию.' },
    { id: 'analyze-concept-origin', name: 'Анализ происхождения концепции', template: 'Проанализируй следующие философские тезисы [СПИСОК ТЕЗИСОВ] или граф концепции [ДАННЫЕ ГРАФА]. Определи, является ли данная концепция синтезом существующих философских традиций.' },
    { id: 'analyze-concept-name', name: 'Анализ названия концепции', template: 'Проанализируй название философской концепции [НАЗВАНИЕ КОНЦЕПЦИИ] в контексте её содержания [ДАННЫЕ КОНЦЕПЦИИ]. Насколько точно название отражает суть концепции?' },
    { id: 'concept-evolution', name: 'Эволюция концепции', template: 'Предложи возможные направления эволюции философской концепции [КОНЦЕПЦИЯ] под названием [НАЗВАНИЕ КОНЦЕПЦИИ] в свете современных научных открытий, социальных изменений и философских тенденций.' },
    { id: 'dialog-concepts', name: 'Диалог между концепциями', template: 'Создай философский диалог между представителями концепций [КОНЦЕПЦИЯ 1] под названием [НАЗВАНИЕ КОНЦЕПЦИИ 1] и [КОНЦЕПЦИЯ 2] под названием [НАЗВАНИЕ КОНЦЕПЦИИ 2] по вопросу [ФИЛОСОФСКИЙ ВОПРОС]. Диалог должен отражать ключевые тезисы каждой концепции, логику аргументации и возможные точки соприкосновения или непреодолимых разногласий.' },
    { id: 'historical-context', name: 'Историческая контекстуализация', template: 'Помести философскую концепцию [КОНЦЕПЦИЯ] под названием [НАЗВАНИЕ КОНЦЕПЦИИ] в исторический контекст. Определи её возможные источники влияния, современников со схожими или противоположными идеями, а также потенциальное влияние на последующие философские направления.' },
    { id: 'practical-application', name: 'Практическое применение', template: 'Предложи возможные практические применения философской концепции [КОНЦЕПЦИЯ] под названием [НАЗВАНИЕ КОНЦЕПЦИИ] в следующих областях: образование, этика, политика, личностное развитие, социальные институты. Для каждой области укажи, какие именно тезисы или категории концепции наиболее релевантны и как они могут быть операционализированы.' },
    { id: 'concept-compatibility', name: 'Анализ совместимости концепций', template: 'Проанализируй графы следующих философских концепций: [КОНЦЕПЦИЯ 1] и [КОНЦЕПЦИЯ 2]. Выяви: 1) полностью совместимые элементы, 2) потенциально совместимые при реинтерпретации, 3) принципиально несовместимые элементы. Предложи возможные стратегии синтеза, учитывая выявленные особенности.' },
    { id: 'synthesis-critique', name: 'Критический анализ синтеза', template: 'Проведи критический анализ синтезированной концепции [СИНТЕЗИРОВАННАЯ КОНЦЕПЦИЯ]. Оцени: 1) внутреннюю согласованность, 2) философскую новизну, 3) сохранение ценных аспектов исходных концепций, 4) разрешение противоречий между ними, 5) потенциальные проблемы и слабые места.' },
    { id: 'generate-theses-with-characteristics', name: 'Генерация тезисов с учётом характеристик', template: 'На основе следующего графа философской концепции [ДАННЫЕ ГРАФА С ХАРАКТЕРИСТИКАМИ] сформулируй [КОЛИЧЕСТВО] ключевых тезисов. Обрати особое внимание на категории с высокой центральностью и связи с высокой силой. Для категорий с низкой определённостью предложи альтернативные формулировки тезисов.' },
    { id: 'compare-theses-versions', name: 'Сравнение версий тезисов', template: 'Сравни два набора тезисов, сгенерированных на основе одного графа концепции, но с разным учётом количественных характеристик: [ТЕЗИСЫ БЕЗ УЧЁТА ХАРАКТЕРИСТИК] и [ТЕЗИСЫ С УЧЁТОМ ХАРАКТЕРИСТИК]. Выяви ключевые различия, их причины и оцени, какой набор лучше отражает суть концепции и почему.' },
    { id: 'synthesis-with-characteristics', name: 'Синтез с учётом характеристик', template: 'Синтезируй новую философскую концепцию на основе [КОНЦЕПЦИЯ 1] и [КОНЦЕПЦИЯ 2]. Учитывай количественные характеристики элементов исходных концепций следующим образом: 1) при конфликте приоритет отдавать элементам с более высокой центральностью, 2) сохранять силу связей пропорционально их значимости в исходных концепциях, 3) переоценивать определённость категорий с учётом их новых отношений.' },
    { id: 'characteristics-metadata', name: 'Метаданные для количественных характеристик', template: 'Я определил для категории [КАТЕГОРИЯ] следующую характеристику: [ХАРАКТЕРИСТИКА] = [ЗНАЧЕНИЕ]. Предложи философские и методологические основания для такой оценки, её возможные ограничения и альтернативные подходы к оценке.' },
  ]);
  const messagesEndRef = useRef(null);
  
  // Прокрутка к последнему сообщению
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Установка предзаполненного шаблона при загрузке
  useEffect(() => {
    if (prefilledTemplate) {
      const template = templates.find(t => t.id === prefilledTemplate);
      if (template) {
        setSelectedTemplate(template.id);
        setInput(template.template);
      }
    }
  }, [prefilledTemplate, templates]);
  
  // Обработка выбора шаблона
  const handleTemplateChange = (e) => {
    const templateId = e.target.value;
    
    if (templateId) {
      const template = templates.find(t => t.id === templateId);
      if (template) {
        setSelectedTemplate(templateId);
        setInput(template.template);
      }
    } else {
      setSelectedTemplate('');
      setInput('');
    }
  };

  // Общая функция обработки сообщений и ошибок
  const handleMessage = (messageType, content, isAsync = false, taskId = null) => {
    // Добавить сообщение пользователя
    const userMessage = { id: Date.now(), role: 'user', content };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    
    if (isAsync) {
      setIsAsyncProcessing(true);
      
      // Добавляем уведомление о задаче в очереди
      const taskMessage = { 
        id: Date.now() + 1, 
        role: 'system', 
        content: `Ваш запрос поставлен в очередь (ID: ${taskId}). Обработка может занять некоторое время. Вы получите уведомление, когда результат будет готов.` 
      };
      
      setMessages(prev => [...prev, taskMessage]);
      
      // Обновляем состояние асинхронных задач
      setAsyncTasks(prev => ({
        ...prev,
        [taskId]: {
          status: 'queued',
          query: content,
          createdAt: new Date().toISOString()
        }
      }));
    } else {
      setIsProcessing(true);
    }
  };

  // Обработка ошибок
  const handleError = (errorMessage, taskId = null) => {
    if (taskId) {
      setAsyncTasks(prev => ({
        ...prev,
        [taskId]: {
          ...prev[taskId],
          status: 'error',
          errorAt: new Date().toISOString()
        }
      }));
      setIsAsyncProcessing(false);
    } else {
      setIsProcessing(false);
    }
    
    // Добавление сообщения об ошибке
    setMessages(prev => [...prev, { 
      id: Date.now() + 2, 
      role: 'system', 
      content: errorMessage 
    }]);
  };
  
  // Отправка асинхронного запроса
  const sendAsyncMessage = async () => {
    if (!input.trim() || isProcessing || isAsyncProcessing) return;
    
    // Генерируем ID задачи
    const taskId = `task-${Date.now()}`;
    
    // Обработка сообщения
    handleMessage(input, input, true, taskId);
    
    try {
      // Здесь был бы асинхронный API запрос
      // const response = await api.queueClaudeQuery(input, conceptId);
      // const taskId = response.taskId;
      
      console.log('Async task created with ID:', taskId);
      
      // Имитация проверки статуса задачи
      setTimeout(() => {
        // Обновляем статус задачи
        setAsyncTasks(prev => ({
          ...prev,
          [taskId]: {
            ...prev[taskId],
            status: 'processing'
          }
        }));
        
        // Имитация завершения задачи
        setTimeout(() => {
          // Добавление ответа Claude
          const claudeResponse = { 
            id: Date.now() + 2, 
            role: 'assistant', 
            content: `Результат обработки вашего асинхронного запроса (ID: ${taskId}):\n\n[Здесь будет развёрнутый ответ от Claude на запрос: "${input}"]` 
          };
          
          setMessages(prev => [...prev, claudeResponse]);
          
          // Обновляем статус задачи
          setAsyncTasks(prev => ({
            ...prev,
            [taskId]: {
              ...prev[taskId],
              status: 'completed',
              completedAt: new Date().toISOString()
            }
          }));
          
          setIsAsyncProcessing(false);
        }, 5000);
      }, 2000);
      
    } catch (error) {
      console.error('Error sending async message to Claude:', error);
      handleError(`Произошла ошибка при обработке асинхронного запроса (ID: ${taskId}). Пожалуйста, попробуйте еще раз.`, taskId);
    }
  };

  // Отправка синхронного запроса к Claude
  const sendMessage = async () => {
    if (!input.trim() || isProcessing || isAsyncProcessing) return;
    
    // Обработка сообщения
    handleMessage('user', input);
    
    try {
      // Имитация запроса к API
      setTimeout(() => {
        // Примерный ответ Claude
        const claudeResponse = { 
          id: Date.now() + 1, 
          role: 'assistant', 
          content: `Анализируя предоставленные данные концепции, я могу предложить следующее:
          
1. Выявлены следующие возможные противоречия:
   - Категория "Субъективная реальность" описана как независимая, но одновременно указывается её обусловленность психическими процессами.
   - Связь между категориями "Интерсубъективность" и "Объективная реальность" имеет недостаточное обоснование.

2. Предлагаемые улучшения:
   - Добавить категорию "Медиатор" как связующее звено между субъективным и интерсубъективным.
   - Уточнить характер диалектической связи между субъективным и интерсубъективным.
   - Детализировать механизмы формирования интерсубъективного из субъективного опыта.
   
3. Отсутствующие важные категории:
   - "Эпистемологические границы" - категория, описывающая пределы познания в рамках данной концепции
   - "Коммуникативные практики" - необходимый элемент для объяснения формирования интерсубъективности

Общая оценка: концепция имеет хороший потенциал, но требует дополнительной проработки указанных выше моментов для достижения внутренней согласованности.`
        };
        
        setMessages(prev => [...prev, claudeResponse]);
        setIsProcessing(false);
      }, 2000);
      
    } catch (error) {
      console.error('Error sending message to Claude:', error);
      handleError('Произошла ошибка при обработке запроса. Пожалуйста, попробуйте еще раз.');
    }
  };
  
  // Сохранение результата
  const saveResult = () => {
    // Логика сохранения результата в базу данных
    console.log('Saving last result to database');
    // Здесь был бы API запрос для сохранения
  };
  
  // Копирование текста в буфер обмена
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        console.log('Text copied to clipboard');
        // Здесь можно добавить уведомление о копировании
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
      });
  };
  
  return (
    <div className="flex flex-col h-full bg-white border rounded-lg shadow-sm">
      <div className="border-b p-4">
        <h3 className="text-lg font-medium">Взаимодействие с Claude</h3>
        
        {interactionType === 'template' && (
          <div className="mt-2">
            <label htmlFor="template-select" className="block text-sm font-medium text-gray-700 mb-1">
              Выбрать шаблон запроса
            </label>
            <select
              id="template-select"
              className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={selectedTemplate}
              onChange={handleTemplateChange}
            >
              <option value="">Выберите шаблон...</option>
              {templates.map(template => (
                <option key={template.id} value={template.id}>{template.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>Начните диалог с Claude, выбрав шаблон или задав свой вопрос</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map(message => (
              <div 
                key={message.id}
                className={`p-4 rounded-lg ${
                  message.role === 'user' 
                    ? 'bg-blue-100 ml-8' 
                    : message.role === 'system' 
                      ? 'bg-red-100' 
                      : 'bg-white border mr-8'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="font-medium mb-1">
                    {message.role === 'user' ? 'Вы' : message.role === 'system' ? 'Система' : 'Claude'}
                  </div>
                  
                  {message.role === 'assistant' && (
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => copyToClipboard(message.content)}
                        className="text-gray-500 hover:text-gray-700"
                        title="Копировать"
                      >
                        <Copy size={16} />
                      </button>
                      <button 
                        onClick={saveResult}
                        className="text-gray-500 hover:text-gray-700"
                        title="Сохранить результат"
                      >
                        <Save size={16} />
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="whitespace-pre-line">{message.content}</div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      <div className="border-t p-4">
        <div className="flex items-center">
          <textarea
            className="flex-1 border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 resize-none"
            rows={3}
            placeholder="Введите свой запрос к Claude..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isProcessing || isAsyncProcessing}
          />
          
          <div className="ml-4 flex flex-col space-y-2">
            <button
              className={`p-2 rounded-full ${
                isProcessing || isAsyncProcessing || !input.trim()
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
              onClick={sendMessage}
              disabled={isProcessing || isAsyncProcessing || !input.trim()}
              title="Отправить синхронный запрос"
            >
              {isProcessing ? (
                <LoaderCircle className="animate-spin" size={24} />
              ) : (
                <Send size={24} />
              )}
            </button>
            
            <button
              className={`p-2 rounded-full ${
                isProcessing || isAsyncProcessing || !input.trim()
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
              onClick={sendAsyncMessage}
              disabled={isProcessing || isAsyncProcessing || !input.trim()}
              title="Отправить асинхронный запрос (для длительных операций)"
            >
              <Clock size={24} />
            </button>
          </div>
        </div>
        
        {Object.keys(asyncTasks).length > 0 && (
          <div className="mt-4 border-t pt-2">
            <div className="text-sm font-medium">Асинхронные задачи:</div>
            <div className="mt-1 text-xs">
              {Object.entries(asyncTasks).map(([taskId, task]) => (
                <div key={taskId} className="flex items-center mb-1">
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    task.status === 'queued' ? 'bg-yellow-500' :
                    task.status === 'processing' ? 'bg-blue-500 animate-pulse' :
                    task.status === 'completed' ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <div className="flex-1">
                    {taskId} - {
                      task.status === 'queued' ? 'В очереди' :
                      task.status === 'processing' ? 'Обрабатывается' :
                      task.status === 'completed' ? 'Завершена' : 'Ошибка'
                    }
                  </div>
                  <div className="text-gray-500">
                    {new Date(task.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="mt-2 text-sm text-gray-500">
          Нажмите Enter для отправки запроса. Claude проанализирует ваш запрос и предоставит ответ.
        </div>
      </div>
    </div>
  );
};

export default ClaudeInterface;
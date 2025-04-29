import { useState, useEffect, useRef } from 'react';
import { Send, LoaderCircle, Save, Copy, Download } from 'lucide-react';

// Компонент интерфейса взаимодействия с Claude
const ClaudeInterface = ({ conceptId, interactionType = 'freeform', prefilledTemplate = null }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [templates, setTemplates] = useState([
    { id: 'validate-graph', name: 'Валидация графа', template: 'Проанализируй следующий граф категорий философской концепции [ДАННЫЕ ГРАФА]. Выяви возможные логические противоречия, пропущенные важные категории или связи, необычные отношения между категориями. Предложи возможные улучшения.' },
    { id: 'enrich-category', name: 'Обогащение категории', template: 'Для следующей категории [НАЗВАНИЕ] с определением [ОПРЕДЕЛЕНИЕ] в контексте философской концепции [НАЗВАНИЕ КОНЦЕПЦИИ], предложи расширенное описание, возможные альтернативные трактовки, исторические аналоги и связанные концепты.' },
    { id: 'generate-theses', name: 'Генерация тезисов', template: 'На основе следующего графа философской концепции [ДАННЫЕ ГРАФА] сформулируй [КОЛИЧЕСТВО] ключевых тезисов в области [ТИП ТЕЗИСОВ]. Тезисы должны отражать структурные отношения между категориями и быть выражены в [СТИЛЬ] стиле.' },
    { id: 'concept-name', name: 'Генерация названия концепции', template: 'На основе следующего графа концепции [ДАННЫЕ ГРАФА] или списка тезисов [СПИСОК ТЕЗИСОВ], предложи лаконичное и содержательное название для этой философской концепции.' },
    { id: 'thesis-to-graph', name: 'Генерация графа из тезисов', template: 'На основе следующих философских тезисов [СПИСОК ТЕЗИСОВ] создай структурированный граф концепции. Выдели ключевые категории, установи связи между ними и предложи иерархию.' },
    { id: 'analyze-concept-origin', name: 'Анализ происхождения концепции', template: 'Проанализируй следующие философские тезисы [СПИСОК ТЕЗИСОВ] или граф концепции [ДАННЫЕ ГРАФА]. Определи, является ли данная концепция синтезом существующих философских традиций.' },
    { id: 'analyze-concept-name', name: 'Анализ названия концепции', template: 'Проанализируй название философской концепции [НАЗВАНИЕ КОНЦЕПЦИИ] в контексте её содержания [ДАННЫЕ КОНЦЕПЦИИ]. Насколько точно название отражает суть концепции?' },
    { id: 'concept-evolution', name: 'Эволюция концепции', template: 'Предложи возможные направления эволюции философской концепции [КОНЦЕПЦИЯ] под названием [НАЗВАНИЕ КОНЦЕПЦИИ] в свете современных научных открытий, социальных изменений и философских тенденций.' },
  ]);
  const messagesEndRef = useRef(null);
  
  // Прокрутка к последнему сообщению
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Установка префильтрованного шаблона при загрузке
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
    setSelectedTemplate(templateId);
    
    if (templateId) {
      const template = templates.find(t => t.id === templateId);
      setInput(template.template);
    } else {
      setInput('');
    }
  };
  
  // Отправка запроса к Claude
  const sendMessage = async () => {
    if (!input.trim()) return;
    
    // Добавить сообщение пользователя
    const userMessage = { id: Date.now(), role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);
    
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
      setIsProcessing(false);
      
      // Добавление сообщения об ошибке
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        role: 'system', 
        content: 'Произошла ошибка при обработке запроса. Пожалуйста, попробуйте еще раз.' 
      }]);
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
    navigator.clipboard.writeText(text);
    // Здесь можно добавить уведомление о копировании
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
            disabled={isProcessing}
          />
          
          <button
            className={`ml-4 p-2 rounded-full ${
              isProcessing || !input.trim()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
            onClick={sendMessage}
            disabled={isProcessing || !input.trim()}
          >
            {isProcessing ? (
              <LoaderCircle className="animate-spin" size={24} />
            ) : (
              <Send size={24} />
            )}
          </button>
        </div>
        
        <div className="mt-2 text-sm text-gray-500">
          Нажмите Enter для отправки запроса. Claude проанализирует ваш запрос и предоставит ответ.
        </div>
      </div>
    </div>
  );
};

export default ClaudeInterface;
import { useState, useEffect, useRef } from 'react';
import { ZoomIn, ZoomOut, Save, Edit, Plus, Trash, Link, FileText, GitMerge, CheckCircle, BookOpen, Briefcase, MessageSquare, GitBranch } from 'lucide-react';

// Компонент визуализации графа концепции
const ConceptGraphVisualization = ({ conceptId, readOnly = false }) => {
  const [graph, setGraph] = useState({ nodes: [], edges: [] });
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const svgRef = useRef(null);
  const [validationResult, setValidationResult] = useState(null);
  const [enrichmentResult, setEnrichmentResult] = useState(null);
  const [historicalContextResult, setHistoricalContextResult] = useState(null);
  const [practicalApplicationResult, setPracticalApplicationResult] = useState(null);
  const [dialogueResult, setDialogueResult] = useState(null);
  const [evolutionResult, setEvolutionResult] = useState(null);
  const [evolutionMode, setEvolutionMode] = useState(false);
  const [evolutionSuggestions, setEvolutionSuggestions] = useState(null);

  // Общая функция для имитации API-запросов
  const simulateApiRequest = async (apiFunction, mockResponse, errorMessage, setResultFunc = null) => {
    try {
      setLoading(true);
      
      // Имитация запроса к API
      return new Promise((resolve) => {
        setTimeout(() => {
          if (setResultFunc) {
            setResultFunc(mockResponse);
          }
          setLoading(false);
          resolve(mockResponse);
        }, 2000);
      });
    } catch (error) {
      setError(errorMessage);
      setLoading(false);
      throw error;
    }
  };

  const requestGraphValidation = async () => {
    const mockValidation = {
      contradictions: [
        { source: 1, target: 2, description: "Противоречие между категориями 'Субъективная реальность' и 'Интерсубъективность'" }
      ],
      missingCategories: [
        { name: "Эпистемологические границы", description: "Категория для описания пределов познания" }
      ],
      missingRelationships: [
        { source: "Субъективная реальность", target: "Объективная реальность", type: "опосредованная" }
      ],
      recommendations: [
        "Добавить категорию 'Медиатор' как связующее звено между субъективным и интерсубъективным",
        "Уточнить характер диалектической связи между субъективным и интерсубъективным"
      ]
    };
    
    await simulateApiRequest(
      "validateGraph", 
      mockValidation, 
      "Ошибка при валидации графа", 
      setValidationResult
    );
  };

  const requestCategoryEnrichment = async (categoryId) => {
    const category = graph.nodes.find(node => node.id === categoryId);
    if (!category) return;
    
    const mockEnrichment = {
      detailedDescription: `Категория "${category.name}" представляет собой фундаментальное понятие, описывающее... [подробное описание]`,
      alternativeInterpretations: [
        "В феноменологической традиции эта категория понимается как...",
        "С точки зрения аналитической философии данная категория может быть рассмотрена..."
      ],
      historicalAnalogues: [
        { philosopher: "Кант", concept: "Вещь в себе", description: "..." },
        { philosopher: "Гуссерль", concept: "Интенциональность", description: "..." }
      ],
      relatedConcepts: [
        "Сознание", "Восприятие", "Интерсубъективность"
      ]
    };
    
    await simulateApiRequest(
      "enrichCategory", 
      mockEnrichment, 
      `Ошибка при обогащении категории ${categoryId}`, 
      setEnrichmentResult
    );
  };

  const requestHistoricalContext = async () => {
    const mockHistoricalContext = {
      timeContext: "Развитие в контексте постмодернистской философии XX века",
      influences: [
        { source: "Феноменология", description: "Идея интерсубъективности заимствована из феноменологической традиции" },
        { source: "Экзистенциализм", description: "Трактовка субъективности имеет параллели с экзистенциалистским пониманием" }
      ],
      contemporaries: [
        { name: "Структурализм", relationship: "противоположная", description: "Противопоставление концепции субъекта структуралистскому анти-субъективизму" },
        { name: "Герменевтика", relationship: "схожая", description: "Схожее понимание диалектики субъективного и интерсубъективного" }
      ],
      nameAnalysis: "Название концепции адекватно отражает её историческое положение в дискурсе о субъективности"
    };
    
    await simulateApiRequest(
      "getHistoricalContext", 
      mockHistoricalContext, 
      "Ошибка при получении исторического контекста", 
      setHistoricalContextResult
    );
  };

  const requestPracticalApplication = async () => {
    const mockPracticalApplication = {
      domains: [
        { 
          name: "Образование", 
          description: "Применение в педагогических практиках", 
          relevantCategories: ["Субъективная реальность", "Интерсубъективность"],
          methods: ["Диалогическое обучение", "Рефлексивные практики"]
        },
        { 
          name: "Психотерапия", 
          description: "Основа для терапевтического взаимодействия", 
          relevantCategories: ["Интерсубъективность", "Субъективная реальность"],
          methods: ["Феноменологическая терапия", "Диалогические практики"]
        }
      ]
    };
    
    await simulateApiRequest(
      "getPracticalApplications", 
      mockPracticalApplication, 
      "Ошибка при получении анализа практического применения", 
      setPracticalApplicationResult
    );
  };

  const requestDialogueGeneration = async () => {
    // В реальном приложении здесь был бы запрос к другой концепции для сравнения
    // или выбор из списка концепций
    const otherConceptId = "mock-concept-2";
    const philosophicalQuestion = "Природа объективной реальности";
    
    const mockDialogue = {
      question: "Природа объективной реальности",
      otherConcept: "Натуралистический реализм",
      content: "Представитель субъективного идеализма: Объективная реальность не может существовать независимо от воспринимающего субъекта...\n\nПредставитель натуралистического реализма: Объективная реальность существует независимо от наших представлений о ней...",
      convergencePoints: ["Признание множественности перспектив", "Важность эмпирического опыта"],
      irreconcilableDifferences: ["Вопрос о независимом существовании реальности", "Статус научного знания"]
    };
    
    await simulateApiRequest(
      "generateDialogue", 
      mockDialogue, 
      "Ошибка при генерации диалога", 
      setDialogueResult
    );
  };

  const requestEvolutionAnalysis = async () => {
    const mockEvolution = {
      directions: [
        { name: "Цифровая субъективность", description: "Развитие концепции в контексте цифровой реальности и виртуальных идентичностей" },
        { name: "Нейрофеноменология", description: "Интеграция с современными нейронаучными данными о сознании и интерсубъективности" }
      ],
      suggestedChanges: [
        { 
          type: "new_category", 
          name: "Цифровая идентичность", 
          definition: "Проявление субъективности в цифровом пространстве",
          relationTo: "Субъективная реальность",
          relationType: "Extension"
        },
        { 
          type: "modified_relationship", 
          source: "Субъективная реальность",
          target: "Интерсубъективность",
          newType: "Эмерджентное взаимодействие",
          description: "Переосмысление отношений с учетом новых данных когнитивной науки"
        }
      ],
      nameEvolution: {
        keepCurrent: true,
        alternatives: ["Диалектика субъективности и интерсубъективности", "Феноменология интерактивного сознания"]
      }
    };
    
    await simulateApiRequest(
      "getEvolutionAnalysis", 
      mockEvolution, 
      "Ошибка при анализе эволюции концепции", 
      setEvolutionResult
    );
  };

  const enterEvolutionMode = () => {
    if (evolutionResult) {
      setEvolutionMode(true);
      
      // Преобразуем предложения по эволюции в формат для визуализации
      const suggestions = {
        newCategories: evolutionResult.suggestedChanges.filter(change => change.type === "new_category"),
        modifiedRelationships: evolutionResult.suggestedChanges.filter(change => change.type === "modified_relationship"),
        deletedElements: evolutionResult.suggestedChanges.filter(change => change.type === "delete")
      };
      
      setEvolutionSuggestions(suggestions);
    }
  };

  const exitEvolutionMode = () => {
    setEvolutionMode(false);
    setEvolutionSuggestions(null);
  };

  const applyEvolutionSuggestion = (suggestion) => {
    // Здесь была бы логика применения конкретного предложения по эволюции
    console.log("Applying evolution suggestion:", suggestion);
    
    // Для демонстрации просто удаляем предложение из списка
    if (evolutionSuggestions) {
      const updatedSuggestions = {...evolutionSuggestions};
      
      if (suggestion.type === "new_category") {
        updatedSuggestions.newCategories = updatedSuggestions.newCategories.filter(s => s.name !== suggestion.name);
      } else if (suggestion.type === "modified_relationship") {
        updatedSuggestions.modifiedRelationships = updatedSuggestions.modifiedRelationships.filter(
          s => !(s.source === suggestion.source && s.target === suggestion.target)
        );
      } else if (suggestion.type === "delete") {
        updatedSuggestions.deletedElements = updatedSuggestions.deletedElements.filter(
          s => s.id !== suggestion.id
        );
      }
      
      setEvolutionSuggestions(updatedSuggestions);
    }
  };
  
  // Загрузка данных графа
  useEffect(() => {
    const fetchGraphData = async () => {
      try {
        setLoading(true);
        // Здесь был бы реальный API запрос
        // const response = await api.getConceptGraph(conceptId);
        
        // Примерные данные для демонстрации
        const mockData = {
          nodes: [
            { id: 1, name: "Субъективная реальность", type: "category", centrality: 0.9 },
            { id: 2, name: "Интерсубъективность", type: "category", centrality: 0.7 },
            { id: 3, name: "Объективная реальность", type: "category", centrality: 0.6 }
          ],
          edges: [
            { id: 1, source: 1, target: 2, type: "диалектическая", strength: 0.8, direction: "bidirectional" },
            { id: 2, source: 2, target: 3, type: "производная", strength: 0.5, direction: "directed" },
            { id: 3, source: 1, target: 3, type: "противоположность", strength: 0.9, direction: "directed" }
          ]
        };
        
        setGraph(mockData);
        setLoading(false);
      } catch (err) {
        setError("Ошибка загрузки графа концепции");
        setLoading(false);
      }
    };
    
    fetchGraphData();
  }, [conceptId]);
  
  // Функции управления зумом
  const zoomIn = () => setZoomLevel(prev => Math.min(prev + 0.1, 2));
  const zoomOut = () => setZoomLevel(prev => Math.max(prev - 0.1, 0.5));
  
  // Функция выбора ноды
  const handleNodeClick = (node) => {
    setSelectedNode(node);
    setSelectedEdge(null);
  };
  
  // Функция выбора связи
  const handleEdgeClick = (edge) => {
    setSelectedEdge(edge);
    setSelectedNode(null);
  };

  // Вспомогательная функция для подготовки данных для эволюционных изменений
  const prepareEvolutionaryData = (baseNodes, baseEdges) => {
    if (!evolutionMode || !evolutionSuggestions) {
      return { nodes: baseNodes, edges: baseEdges };
    }

    const modifiedNodes = [...baseNodes];
    const modifiedEdges = [...baseEdges];

    // Модифицируем узлы для отображения предложенных изменений
    modifiedNodes.forEach(node => {
      // Проверяем, есть ли предложение удалить этот узел
      const deleteProposal = evolutionSuggestions.deletedElements.find(
        del => del.type === "category" && del.name === node.name
      );
      
      if (deleteProposal) {
        node.deleteProposed = true;
      }
      
      // Проверяем, есть ли предложение изменить связи этого узла
      const relModProposals = evolutionSuggestions.modifiedRelationships.filter(
        mod => mod.source === node.name || mod.target === node.name
      );
      
      if (relModProposals.length > 0) {
        node.relModProposed = true;
      }
    });
    
    // Модифицируем связи для отображения предложенных изменений
    modifiedEdges.forEach(edge => {
      const sourceNode = modifiedNodes.find(n => n.id === edge.source);
      const targetNode = modifiedNodes.find(n => n.id === edge.target);
      
      if (sourceNode && targetNode) {
        const modProposal = evolutionSuggestions.modifiedRelationships.find(
          mod => mod.source === sourceNode.name && mod.target === targetNode.name
        );
        
        if (modProposal) {
          edge.modProposed = true;
          edge.newType = modProposal.newType;
        }
      }
    });
    
    // Добавляем предложенные новые категории
    const newCategoriesNodes = evolutionSuggestions.newCategories.map((newCat, index) => {
      // Размещаем новые категории в отдельной области
      const angle = Math.PI / 2 + (index / evolutionSuggestions.newCategories.length) * Math.PI;
      const width = 800;
      const height = 600;
      const centerX = width / 2;
      const centerY = height / 2;
      const nodeRadius = 40;
      const radius = Math.min(width, height) / 2 - nodeRadius * 2;
      const x = centerX + radius * 1.3 * Math.cos(angle);
      const y = centerY + radius * 1.3 * Math.sin(angle);
      
      return {
        ...newCat,
        id: `new-${index}`,
        x,
        y,
        newProposed: true
      };
    });
    
    // Объединяем с существующими узлами
    const combinedNodes = [...modifiedNodes, ...newCategoriesNodes];
    
    // Добавляем предложенные новые связи
    const newCategoryEdges = evolutionSuggestions.newCategories.map((newCat, index) => {
      const targetNode = combinedNodes.find(n => n.name === newCat.relationTo);
      
      if (targetNode) {
        return {
          id: `new-edge-${index}`,
          source: `new-${index}`,
          target: targetNode.id,
          sourceX: newCategoriesNodes[index].x,
          sourceY: newCategoriesNodes[index].y,
          targetX: targetNode.x,
          targetY: targetNode.y,
          type: newCat.relationType,
          newProposed: true
        };
      }
      return null;
    }).filter(edge => edge !== null);
    
    // Объединяем с существующими связями
    const combinedEdges = [...modifiedEdges, ...newCategoryEdges];

    return { nodes: combinedNodes, edges: combinedEdges };
  };
  
  // Функция для подготовки узлов графа с координатами
  const prepareNodesWithCoordinates = (nodes) => {
    const width = 800;
    const height = 600;
    const centerX = width / 2;
    const centerY = height / 2;
    const nodeRadius = 40;
    const radius = Math.min(width, height) / 2 - nodeRadius * 2;
    
    // Расположить узлы по кругу
    return nodes.map((node, index) => {
      const angle = (index / nodes.length) * 2 * Math.PI;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      
      return {
        ...node,
        x,
        y
      };
    });
  };

  // Функция для подготовки связей графа с координатами
  const prepareEdgesWithCoordinates = (edges, nodes) => {
    return edges.map(edge => {
      const source = nodes.find(n => n.id === edge.source);
      const target = nodes.find(n => n.id === edge.target);
      
      if (!source || !target) {
        return null;
      }
      
      return {
        ...edge,
        sourceX: source.x,
        sourceY: source.y,
        targetX: target.x,
        targetY: target.y
      };
    }).filter(edge => edge !== null);
  };
  
  // Рендеринг графа
  const renderGraph = () => {
    if (loading) return <div className="flex items-center justify-center h-full">Загрузка графа...</div>;
    if (error) return <div className="text-red-500">{error}</div>;
    
    const width = 800;
    const height = 600;
    
    // Подготовка узлов с координатами
    const nodesWithCoordinates = prepareNodesWithCoordinates(graph.nodes);
    
    // Подготовка связей с координатами
    const edgesWithCoordinates = prepareEdgesWithCoordinates(graph.edges, nodesWithCoordinates);
    
    // Подготовка данных с учётом эволюционных изменений
    const { nodes, edges } = prepareEvolutionaryData(nodesWithCoordinates, edgesWithCoordinates);
    
    return (
      <svg 
        ref={svgRef}
        width="100%" 
        height="100%" 
        viewBox={`0 0 ${width} ${height}`}
        style={{ transform: `scale(${zoomLevel})` }}
        className="transition-transform duration-300"
      >
        {/* Определения маркеров для стрелок */}
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="0"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#A0AEC0" />
          </marker>
          <marker
            id="arrowhead-start"
            markerWidth="10"
            markerHeight="7"
            refX="10"
            refY="3.5"
            orient="auto-start-reverse"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#A0AEC0" />
          </marker>
        </defs>
        
        {/* Рендер связей */}
        {renderEdges(edges)}
        
        {/* Рендер узлов */}
        {renderNodes(nodes)}
      </svg>
    );
  };

  // Функция для рендеринга связей
  const renderEdges = (edges) => {
    return edges.map(edge => {
      // Вычисляем угол для правильной ориентации стрелки
      const dx = edge.targetX - edge.sourceX;
      const dy = edge.targetY - edge.sourceY;
      const angle = Math.atan2(dy, dx) * 180 / Math.PI;
      
      // Вычисляем смещение для стрелки, чтобы она не накладывалась на узел
      const nodeRadius = 40 * (0.8 + 0.2); // приблизительный радиус узла
      const length = Math.sqrt(dx * dx + dy * dy);
      const offsetX = dx * nodeRadius / length;
      const offsetY = dy * nodeRadius / length;
      
      // Позиция стрелки (немного смещена от конечного узла)
      const arrowX = edge.targetX - offsetX;
      const arrowY = edge.targetY - offsetY;
      
      // Проверяем тип направленности связи
      const isDirected = edge.direction !== 'bidirectional';
      const isBidirectional = edge.direction === 'bidirectional';
      
      return (
        <g key={`edge-${edge.id}`} onClick={() => handleEdgeClick(edge)}>
          <line
            x1={edge.sourceX}
            y1={edge.sourceY}
            x2={edge.targetX}
            y2={edge.targetY}
            strokeWidth={2 + (edge.strength || 1) * 3}
            stroke={
              edge.newProposed ? "#10B981" :
              edge.modProposed ? "#F59E0B" :
              selectedEdge && selectedEdge.id === edge.id ? "#3182CE" : "#A0AEC0"
            }
            strokeDasharray={edge.modProposed ? "5,5" : "none"}
            className="cursor-pointer"
            markerEnd={isDirected ? "url(#arrowhead)" : null}
            markerStart={isBidirectional ? "url(#arrowhead-start)" : null}
          />
          
          {/* Метка связи */}
          <text
            x={(edge.sourceX + edge.targetX) / 2}
            y={(edge.sourceY + edge.targetY) / 2 - 10}
            textAnchor="middle"
            fill="#4A5568"
            className="text-sm"
          >
            {edge.type}
          </text>
        </g>
      );
    });
  };
  
  // Функция для рендеринга узлов
  const renderNodes = (nodes) => {
    return nodes.map(node => (
      <g 
        key={`node-${node.id}`} 
        transform={`translate(${node.x}, ${node.y})`}
        onClick={() => handleNodeClick(node)}
        className="cursor-pointer"
      >
        <circle
          r={40 * (0.8 + (node.centrality || 0.5) * 0.4)}
          fill={
            node.newProposed ? "#D1FAE5" :
            node.deleteProposed ? "#FEE2E2" :
            node.relModProposed ? "#FEF3C7" :
            selectedNode && selectedNode.id === node.id ? "#EBF8FF" : "#F7FAFC"
          }
          stroke={
            node.newProposed ? "#10B981" :
            node.deleteProposed ? "#EF4444" :
            node.relModProposed ? "#F59E0B" :
            selectedNode && selectedNode.id === node.id ? "#3182CE" : "#E2E8F0"
          }
          strokeWidth={
            (node.newProposed || node.deleteProposed || node.relModProposed) ? 2 :
            selectedNode && selectedNode.id === node.id ? 3 : 1
          }
          strokeDasharray={node.deleteProposed ? "5,5" : "none"}
        />
        
        <text
          textAnchor="middle" 
          dy=".3em"
          className="text-sm font-medium"
          fill="#4A5568"
        >
          {node.name}
        </text>
      </g>
    ));
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between p-4 border-b">
        <div className="text-lg font-medium">Граф концепции</div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={zoomOut}
            className="p-2 rounded hover:bg-gray-100"
            aria-label="Уменьшить"
          >
            <ZoomOut size={20} />
          </button>
          <span className="text-sm">{Math.round(zoomLevel * 100)}%</span>
          <button 
            onClick={zoomIn}
            className="p-2 rounded hover:bg-gray-100"
            aria-label="Увеличить"
          >
            <ZoomIn size={20} />
          </button>
          <button 
            onClick={requestGraphValidation}
            className="p-2 rounded hover:bg-gray-100"
            aria-label="Валидировать граф через Claude"
          >
            <CheckCircle size={20} />
          </button>

          <button 
            onClick={requestHistoricalContext}
            className="p-2 rounded hover:bg-gray-100"
            aria-label="Историческая контекстуализация"
            title="Историческая контекстуализация"
          >
            <BookOpen size={20} />
          </button>

          <button 
            onClick={requestPracticalApplication}
            className="p-2 rounded hover:bg-gray-100"
            aria-label="Практическое применение"
            title="Практическое применение"
          >
            <Briefcase size={20} />
          </button>

          <button 
            onClick={requestDialogueGeneration}
            className="p-2 rounded hover:bg-gray-100"
            aria-label="Диалогическая интерпретация"
            title="Диалогическая интерпретация"
          >
            <MessageSquare size={20} />
          </button>

          <button 
            onClick={requestEvolutionAnalysis}
            className={`p-2 rounded hover:bg-gray-100 ${evolutionMode ? 'bg-blue-100' : ''}`}
            aria-label="Эволюция концепции"
            title="Эволюция концепции"
          >
            <GitBranch size={20} />
          </button>
          
          {!readOnly && (
            <>
              <button className="p-2 rounded hover:bg-gray-100" aria-label="Добавить категорию">
                <Plus size={20} />
              </button>
              <button className="p-2 rounded hover:bg-gray-100" aria-label="Добавить связь">
                <Link size={20} />
              </button>
            </>
          )}
          
          <button className="p-2 rounded hover:bg-gray-100" aria-label="Сохранить">
            <Save size={20} />
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto bg-gray-50">
        <div className="h-full flex items-center justify-center">
          {renderGraph()}
        </div>
      </div>
      
      {/* Панель деталей */}
      {selectedNode && (
        <div>
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Категория: {selectedNode.name}</h3>
            {!readOnly && (
              <div className="flex space-x-2">
                <button className="text-blue-600 hover:text-blue-800">
                  <Edit size={16} />
                </button>
                <button className="text-red-600 hover:text-red-800">
                  <Trash size={16} />
                </button>
              </div>
            )}
          </div>
          <div className="mt-2 text-sm">
            {/* Раздел количественных характеристик */}
            <div className="mb-3 border-b pb-2">
              <div className="font-medium mb-1">Количественные характеристики:</div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-600">Центральность:</label>
                  <div className="flex items-center">
                    <input 
                      type="range" 
                      min="0" 
                      max="1" 
                      step="0.1" 
                      value={selectedNode.centrality} 
                      onChange={(e) => {
                        // Здесь должна быть логика обновления центральности
                        console.log("Центральность изменена:", e.target.value);
                      }}
                      disabled={readOnly}
                      className="w-28 mr-2" 
                    />
                    <span>{selectedNode.centrality.toFixed(2)}</span>
                    <button 
                      className="ml-2 p-1 text-gray-500 hover:text-blue-700 text-xs"
                      onClick={() => {
                        // Здесь должен быть запрос метаданных для характеристики
                        console.log("Запрос метаданных для центральности");
                      }}
                      title="Получить философское обоснование"
                    >
                      <FileText size={12} />
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs text-gray-600">Определённость:</label>
                  <div className="flex items-center">
                    <input 
                      type="range" 
                      min="0" 
                      max="1" 
                      step="0.1" 
                      value={selectedNode.certainty || 0.5} 
                      onChange={(e) => {
                        // Здесь должна быть логика обновления определённости
                        console.log("Определённость изменена:", e.target.value);
                      }}
                      disabled={readOnly}
                      className="w-28 mr-2" 
                    />
                    <span>{(selectedNode.certainty || 0.5).toFixed(2)}</span>
                    <button 
                      className="ml-2 p-1 text-gray-500 hover:text-blue-700 text-xs"
                      onClick={() => {
                        // Здесь должен быть запрос метаданных для характеристики
                        console.log("Запрос метаданных для определённости");
                      }}
                      title="Получить философское обоснование"
                    >
                      <FileText size={12} />
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs text-gray-600">Историческая значимость:</label>
                  <div className="flex items-center">
                    <input 
                      type="range" 
                      min="0" 
                      max="1" 
                      step="0.1" 
                      value={selectedNode.historicalSignificance || 0.5} 
                      onChange={(e) => {
                        // Здесь должна быть логика обновления исторической значимости
                        console.log("Историческая значимость изменена:", e.target.value);
                      }}
                      disabled={readOnly}
                      className="w-28 mr-2" 
                    />
                    <span>{(selectedNode.historicalSignificance || 0.5).toFixed(2)}</span>
                    <button 
                      className="ml-2 p-1 text-gray-500 hover:text-blue-700 text-xs"
                      onClick={() => {
                        // Здесь должен быть запрос метаданных для характеристики
                        console.log("Запрос метаданных для исторической значимости");
                      }}
                      title="Получить философское обоснование"
                    >
                      <FileText size={12} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-2">
              <button 
                className="text-blue-600 hover:underline text-sm"
                onClick={() => requestCategoryEnrichment(selectedNode.id)}
              >
                Сгенерировать обогащенное описание
              </button>
            </div>
          </div>
        </div>
      )}
          
      {selectedEdge && (
        <div>
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Связь: {selectedEdge.type}</h3>
            {!readOnly && (
              <div className="flex space-x-2">
                <button className="text-blue-600 hover:text-blue-800">
                  <Edit size={16} />
                </button>
                <button className="text-red-600 hover:text-red-800">
                  <Trash size={16} />
                </button>
              </div>
            )}
          </div>
          <div className="mt-2 text-sm">
            <div>
              Между категориями: {
                graph.nodes.find(n => n.id === selectedEdge.source)?.name
              } и {
                graph.nodes.find(n => n.id === selectedEdge.target)?.name
              }
            </div>
            
            {/* Раздел количественных характеристик */}
            <div className="my-3 border-b pb-2">
              <div className="font-medium mb-1">Количественные характеристики:</div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-600">Сила связи:</label>
                  <div className="flex items-center">
                    <input 
                      type="range" 
                      min="0" 
                      max="1" 
                      step="0.1" 
                      value={selectedEdge.strength} 
                      onChange={(e) => {
                        // Здесь должна быть логика обновления силы связи
                        console.log("Сила связи изменена:", e.target.value);
                      }}
                      disabled={readOnly}
                      className="w-28 mr-2" 
                    />
                    <span>{selectedEdge.strength.toFixed(2)}</span>
                    <button 
                      className="ml-2 p-1 text-gray-500 hover:text-blue-700 text-xs"
                      onClick={() => {
                        // Здесь должен быть запрос метаданных для характеристики
                        console.log("Запрос метаданных для силы связи");
                      }}
                      title="Получить философское обоснование"
                    >
                      <FileText size={12} />
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs text-gray-600">Очевидность/спорность:</label>
                  <div className="flex items-center">
                    <input 
                      type="range" 
                      min="0" 
                      max="1" 
                      step="0.1" 
                      value={selectedEdge.certainty || 0.5} 
                      onChange={(e) => {
                        // Здесь должна быть логика обновления очевидности/спорности
                        console.log("Очевидность/спорность изменена:", e.target.value);
                      }}
                      disabled={readOnly}
                      className="w-28 mr-2" 
                    />
                    <span>{(selectedEdge.certainty || 0.5).toFixed(2)}</span>
                    <button 
                      className="ml-2 p-1 text-gray-500 hover:text-blue-700 text-xs"
                      onClick={() => {
                        // Здесь должен быть запрос метаданных для характеристики
                        console.log("Запрос метаданных для очевидности/спорности");
                      }}
                      title="Получить философское обоснование"
                    >
                      <FileText size={12} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div>Направленность: {
              selectedEdge.direction === 'bidirectional' ? 'Двунаправленная' : 
              selectedEdge.direction === 'directed' ? 'Однонаправленная' : 
              'Не указана'
            }</div>
            <div className="mt-2">
              <button className="text-blue-600 hover:underline text-sm">
                Сгенерировать философское обоснование
              </button>
            </div>
          </div>
        </div>
      )}

      {validationResult && (
        <div className="border-t p-4 bg-white">
          <h3 className="font-medium">Результаты валидации графа</h3>
          <div className="mt-2 text-sm">
            {validationResult.contradictions.length > 0 && (
              <div className="mb-2">
                <div className="font-medium">Обнаруженные противоречия:</div>
                <ul className="list-disc pl-5">
                  {validationResult.contradictions.map((item, index) => (
                    <li key={`contradiction-${index}`}>{item.description}</li>
                  ))}
                </ul>
              </div>
            )}
            {validationResult.recommendations.length > 0 && (
              <div>
                <div className="font-medium">Рекомендации:</div>
                <ul className="list-disc pl-5">
                  {validationResult.recommendations.map((item, index) => (
                    <li key={`recommendation-${index}`}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {enrichmentResult && selectedNode && (
        <div className="border-t p-4 bg-white">
          <h3 className="font-medium">Обогащенное описание категории "{selectedNode.name}"</h3>
          <div className="mt-2 text-sm">
            <p className="mb-2">{enrichmentResult.detailedDescription}</p>
            
            {enrichmentResult.alternativeInterpretations.length > 0 && (
              <div className="mb-2">
                <div className="font-medium">Альтернативные интерпретации:</div>
                <ul className="list-disc pl-5">
                  {enrichmentResult.alternativeInterpretations.map((item, index) => (
                    <li key={`interp-${index}`}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {enrichmentResult.relatedConcepts.length > 0 && (
              <div>
                <div className="font-medium">Связанные концепты:</div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {enrichmentResult.relatedConcepts.map((concept, index) => (
                    <span key={`concept-${index}`} className="px-2 py-1 bg-blue-100 rounded text-blue-800">{concept}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      <button className="p-2 rounded hover:bg-gray-100" aria-label="Сгенерировать тезисы">
        <FileText size={20} />
      </button>

      {/* Кнопка для генерации графа из тезисов */}
      <button className="p-2 rounded hover:bg-gray-100" aria-label="Создать граф из тезисов" style={{color: '#d63384'}}>
        <GitMerge size={20} />
      </button>

        {historicalContextResult && (
          <div className="border-t p-4 bg-white">
            <h3 className="font-medium">Историческая контекстуализация</h3>
            <div className="mt-2 text-sm">
              <p className="mb-2">{historicalContextResult.timeContext}</p>
              
              {historicalContextResult.influences.length > 0 && (
                <div className="mb-2">
                  <div className="font-medium">Источники влияния:</div>
                  <ul className="list-disc pl-5">
                    {historicalContextResult.influences.map((item, index) => (
                      <li key={`influence-${index}`}>
                        <span className="font-medium">{item.source}</span>: {item.description}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {historicalContextResult.contemporaries.length > 0 && (
                <div className="mb-2">
                  <div className="font-medium">Современники:</div>
                  <ul className="list-disc pl-5">
                    {historicalContextResult.contemporaries.map((item, index) => (
                      <li key={`contemporary-${index}`}>
                        <span className="font-medium">{item.name}</span> (отношение: {item.relationship}): {item.description}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="mt-2">
                <div className="font-medium">Анализ названия в историческом контексте:</div>
                <p>{historicalContextResult.nameAnalysis}</p>
              </div>
            </div>
          </div>
        )}

        {practicalApplicationResult && (
          <div className="border-t p-4 bg-white">
            <h3 className="font-medium">Практическое применение</h3>
            <div className="mt-2 text-sm">
              {practicalApplicationResult.domains.map((domain, index) => (
                <div key={`domain-${index}`} className="mb-3 pb-2 border-b border-gray-100">
                  <h4 className="font-medium text-base">{domain.name}</h4>
                  <p className="mb-1">{domain.description}</p>
                  
                  <div className="mt-2">
                    <span className="font-medium">Релевантные категории:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {domain.relevantCategories.map((category, idx) => (
                        <span key={`category-${idx}`} className="px-2 py-1 bg-blue-100 rounded text-blue-800">
                          {category}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mt-2">
                    <span className="font-medium">Методы применения:</span>
                    <ul className="list-disc pl-5 mt-1">
                      {domain.methods.map((method, idx) => (
                        <li key={`method-${idx}`}>{method}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {dialogueResult && (
          <div className="border-t p-4 bg-white">
            <h3 className="font-medium">Диалогическая интерпретация</h3>
            <div className="mt-2 text-sm">
              <div className="mb-2">
                <span className="font-medium">Философский вопрос:</span> {dialogueResult.question}
              </div>
              <div className="mb-2">
                <span className="font-medium">Диалог с концепцией:</span> {dialogueResult.otherConcept}
              </div>
              
              <div className="mb-3 mt-3 p-3 bg-gray-50 rounded whitespace-pre-line">
                {dialogueResult.content}
              </div>
              
              <div className="flex space-x-4">
                <div className="flex-1">
                  <div className="font-medium">Точки соприкосновения:</div>
                  <ul className="list-disc pl-5">
                    {dialogueResult.convergencePoints.map((point, idx) => (
                      <li key={`convergence-${idx}`}>{point}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="flex-1">
                  <div className="font-medium">Непреодолимые различия:</div>
                  <ul className="list-disc pl-5">
                    {dialogueResult.irreconcilableDifferences.map((diff, idx) => (
                      <li key={`difference-${idx}`}>{diff}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {evolutionResult && (
          <div className="border-t p-4 bg-white">
            <h3 className="font-medium">Эволюция концепции</h3>
            <div className="mt-2 text-sm">
              <div className="mb-3">
                <div className="font-medium">Возможные направления эволюции:</div>
                <ul className="list-disc pl-5">
                  {evolutionResult.directions.map((direction, idx) => (
                    <li key={`direction-${idx}`}>
                      <span className="font-medium">{direction.name}</span>: {direction.description}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="mb-3">
                <div className="font-medium">Название:</div>
                <p>
                  {evolutionResult.nameEvolution.keepCurrent 
                    ? "Рекомендуется сохранить текущее название." 
                    : "Рекомендуется изменить название."}
                  {evolutionResult.nameEvolution.alternatives.length > 0 && (
                    <>
                      <span className="block mt-1">Альтернативные названия:</span>
                      <ul className="list-disc pl-5">
                        {evolutionResult.nameEvolution.alternatives.map((name, idx) => (
                          <li key={`alt-name-${idx}`}>{name}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </p>
              </div>
              
              <div className="mt-3 flex justify-between">
                <button 
                  onClick={enterEvolutionMode}
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                  disabled={evolutionMode}
                >
                  Режим применения предложенных изменений
                </button>
                
                {evolutionMode && (
                  <button 
                    onClick={exitEvolutionMode}
                    className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    Выйти из режима эволюции
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {evolutionMode && evolutionSuggestions && (
          <div className="border-t p-4 bg-white">
            <h3 className="font-medium">Предложенные изменения</h3>
            <div className="mt-2 text-sm">
              {evolutionSuggestions.newCategories.length > 0 && (
                <div className="mb-3">
                  <div className="font-medium">Новые категории:</div>
                  <div className="mt-1 space-y-2">
                    {evolutionSuggestions.newCategories.map((suggestion, idx) => (
                      <div key={`new-cat-${idx}`} className="p-2 bg-green-50 border border-green-200 rounded flex justify-between items-center">
                        <div>
                          <span className="font-medium">{suggestion.name}</span>: {suggestion.definition}
                          <div className="text-xs text-gray-600">Связь с категорией "{suggestion.relationTo}" (тип: {suggestion.relationType})</div>
                        </div>
                        <button 
                          onClick={() => applyEvolutionSuggestion(suggestion)}
                          className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-xs"
                        >
                          Применить
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {evolutionSuggestions.modifiedRelationships.length > 0 && (
                <div className="mb-3">
                  <div className="font-medium">Измененные связи:</div>
                  <div className="mt-1 space-y-2">
                    {evolutionSuggestions.modifiedRelationships.map((suggestion, idx) => (
                      <div key={`mod-rel-${idx}`} className="p-2 bg-yellow-50 border border-yellow-200 rounded flex justify-between items-center">
                        <div>
                          <span className="font-medium">"{suggestion.source}" → "{suggestion.target}"</span>
                          <div className="text-xs text-gray-600">Новый тип: {suggestion.newType}</div>
                          <div className="text-xs">{suggestion.description}</div>
                        </div>
                        <button 
                          onClick={() => applyEvolutionSuggestion(suggestion)}
                          className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-xs"
                        >
                          Применить
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {evolutionSuggestions.deletedElements.length > 0 && (
                <div className="mb-3">
                  <div className="font-medium">Элементы для удаления:</div>
                  <div className="mt-1 space-y-2">
                    {evolutionSuggestions.deletedElements.map((suggestion, idx) => (
                      <div key={`del-el-${idx}`} className="p-2 bg-red-50 border border-red-200 rounded flex justify-between items-center">
                        <div>
                          <span className="font-medium">{suggestion.type === "category" ? "Категория" : "Связь"}: "{suggestion.name}"</span>
                          <div className="text-xs text-gray-600">Причина: {suggestion.reason}</div>
                        </div>
                        <button 
                          onClick={() => applyEvolutionSuggestion(suggestion)}
                          className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
                        >
                          Применить
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

    </div>
  );
};

export default ConceptGraphVisualization;
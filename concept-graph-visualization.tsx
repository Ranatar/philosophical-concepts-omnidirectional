import { useState, useEffect, useRef } from 'react';
import { ZoomIn, ZoomOut, Save, Edit, Plus, Trash, Link } from 'lucide-react';

// Компонент визуализации графа концепции
const ConceptGraphVisualization = ({ conceptId, readOnly = false }) => {
  const [graph, setGraph] = useState({ nodes: [], edges: [] });
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const svgRef = useRef(null);
  
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
  
  // Рендеринг графа
  const renderGraph = () => {
    if (loading) return <div className="flex items-center justify-center h-full">Загрузка графа...</div>;
    if (error) return <div className="text-red-500">{error}</div>;
    
    const width = 800;
    const height = 600;
    const nodeRadius = 40;
    
    // Простое расположение узлов в круге
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - nodeRadius * 2;
    
    // Расположить узлы по кругу
    const nodes = graph.nodes.map((node, index) => {
      const angle = (index / graph.nodes.length) * 2 * Math.PI;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      
      return {
        ...node,
        x,
        y
      };
    });
    
    // Найти соответствующие координаты для связей
    const edges = graph.edges.map(edge => {
      const source = nodes.find(n => n.id === edge.source);
      const target = nodes.find(n => n.id === edge.target);
      
      return {
        ...edge,
        sourceX: source.x,
        sourceY: source.y,
        targetX: target.x,
        targetY: target.y
      };
    });
    
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
        {/* Связи */}
        {edges.map(edge => {
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
                strokeWidth={2 + edge.strength * 3}
                stroke={selectedEdge && selectedEdge.id === edge.id ? "#3182CE" : "#A0AEC0"}
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
        })}
        
        {/* Узлы */}
        {nodes.map(node => (
          <g 
            key={`node-${node.id}`} 
            transform={`translate(${node.x}, ${node.y})`}
            onClick={() => handleNodeClick(node)}
            className="cursor-pointer"
          >
            <circle
              r={nodeRadius * (0.8 + node.centrality * 0.4)}
              fill={selectedNode && selectedNode.id === node.id ? "#EBF8FF" : "#F7FAFC"}
              stroke={selectedNode && selectedNode.id === node.id ? "#3182CE" : "#E2E8F0"}
              strokeWidth={selectedNode && selectedNode.id === node.id ? 3 : 1}
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
        ))}
      </svg>
    );
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
      {(selectedNode || selectedEdge) && (
        <div className="border-t p-4 bg-white">
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
                <div>Центральность: {selectedNode.centrality.toFixed(2)}</div>
                <div className="mt-2">
                  <button className="text-blue-600 hover:underline text-sm">
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
                <div>Сила связи: {selectedEdge.strength.toFixed(2)}</div>
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
        </div>
      )}
      <button className="p-2 rounded hover:bg-gray-100" aria-label="Сгенерировать тезисы">
        <FileText size={20} />
      </button>

      {/* Кнопка для генерации графа из тезисов */}
      <button className="p-2 rounded hover:bg-gray-100" aria-label="Создать граф из тезисов" style={{color: '#d63384'}}>
        <GitMerge size={20} />
      </button>
    </div>
  );
};

export default ConceptGraphVisualization;
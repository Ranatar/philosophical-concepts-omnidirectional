import React, { useState, useEffect } from 'react';

/**
 * Column configuration for list component
 */
export interface ColumnConfig<T> {
  /** Column identifier */
  key: string;
  /** Column header title */
  title: string;
  /** Function to render cell content */
  render?: (item: T, index: number) => React.ReactNode;
  /** Column width (e.g., '150px', '20%') */
  width?: string;
  /** Whether the column is sortable */
  sortable?: boolean;
  /** Custom sort function (if sortable) */
  sortFn?: (a: T, b: T) => number;
  /** Whether this is the default sort column */
  defaultSort?: boolean;
  /** Default sort direction ('asc' or 'desc') */
  defaultDirection?: 'asc' | 'desc';
  /** Whether the column can be hidden */
  hideable?: boolean;
  /** Whether the column is hidden by default */
  hidden?: boolean;
}

/**
 * Props for the ListComponent
 */
interface ListComponentProps<T> {
  /** Title for the list */
  title?: string;
  /** Array of data items */
  items: T[];
  /** Array of column configurations */
  columns: ColumnConfig<T>[];
  /** Key function to extract unique identifier for items */
  keyExtractor: (item: T) => string | number;
  /** Whether data is currently loading */
  loading?: boolean;
  /** Error message */
  error?: string;
  /** Function to handle clicking on a row */
  onRowClick?: (item: T) => void;
  /** Function to handle selecting rows (if selectable) */
  onSelectItems?: (items: T[]) => void;
  /** Whether rows are selectable */
  selectable?: boolean;
  /** Whether multiple rows can be selected */
  multiSelect?: boolean;
  /** Custom renderer for empty state */
  emptyComponent?: React.ReactNode;
  /** Whether to enable pagination */
  pagination?: boolean;
  /** Total number of items (if using pagination) */
  totalItems?: number;
  /** Current page (if using pagination) */
  currentPage?: number;
  /** Number of items per page (if using pagination) */
  pageSize?: number;
  /** Function to handle page changes */
  onPageChange?: (page: number) => void;
  /** Whether to show the table header */
  showHeader?: boolean;
  /** Whether to show column visibility controls */
  showColumnControls?: boolean;
  /** Whether to enable local sorting */
  enableLocalSort?: boolean;
  /** Custom actions to show in list header */
  actions?: React.ReactNode;
  /** Additional class name */
  className?: string;
  /** Children elements to render below the list */
  children?: React.ReactNode;
}

/**
 * Generic list component with sorting, pagination, and row selection
 * 
 * @example
 * ```tsx
 * <ListComponent
 *   items={data}
 *   columns={[
 *     { key: 'id', title: 'ID', width: '80px' },
 *     { key: 'name', title: 'Name', sortable: true },
 *     { key: 'status', title: 'Status', render: item => <StatusBadge status={item.status} /> }
 *   ]}
 *   keyExtractor={item => item.id}
 *   onRowClick={handleRowClick}
 *   selectable
 * />
 * ```
 */
function ListComponent<T>({
  title,
  items,
  columns: initialColumns,
  keyExtractor,
  loading = false,
  error,
  onRowClick,
  onSelectItems,
  selectable = false,
  multiSelect = false,
  emptyComponent,
  pagination = false,
  totalItems,
  currentPage = 1,
  pageSize = 20,
  onPageChange,
  showHeader = true,
  showColumnControls = false,
  enableLocalSort = true,
  actions,
  className = '',
  children
}: ListComponentProps<T>) {
  // Initialize columns with visibility state
  const [columns, setColumns] = useState(
    initialColumns.map(col => ({
      ...col,
      hidden: col.hidden || false
    }))
  );
  
  // Sorting state
  const [sortKey, setSortKey] = useState<string | null>(
    initialColumns.find(col => col.defaultSort)?.key || null
  );
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(
    initialColumns.find(col => col.defaultSort)?.defaultDirection || 'asc'
  );
  
  // Filtered and sorted items
  const [displayedItems, setDisplayedItems] = useState<T[]>(items);
  
  // Selected items
  const [selectedItems, setSelectedItems] = useState<Set<string | number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  
  // Update displayed items when items, sorting or filtering change
  useEffect(() => {
    if (enableLocalSort && sortKey) {
      // Find the column config for the sort key
      const sortColumn = columns.find(col => col.key === sortKey);
      
      // Sort the items
      const sortedItems = [...items].sort((a: T, b: T) => {
        // Use custom sort function if provided
        if (sortColumn?.sortFn) {
          return sortDirection === 'asc'
            ? sortColumn.sortFn(a, b)
            : sortColumn.sortFn(b, a);
        }
        
        // Default sort based on property values
        const aValue = (a as any)[sortKey];
        const bValue = (b as any)[sortKey];
        
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
      
      setDisplayedItems(sortedItems);
    } else {
      setDisplayedItems(items);
    }
  }, [items, sortKey, sortDirection, columns, enableLocalSort]);
  
  // Handle selecting/deselecting all items
  useEffect(() => {
    if (selectAll) {
      const allKeys = displayedItems.map(item => keyExtractor(item));
      setSelectedItems(new Set(allKeys));
    } else if (selectedItems.size === displayedItems.length) {
      // If we uncheck "select all", clear all selections
      setSelectedItems(new Set());
    }
  }, [selectAll, displayedItems, keyExtractor]);
  
  // Notify parent when selection changes
  useEffect(() => {
    if (onSelectItems) {
      const selected = displayedItems.filter(item => 
        selectedItems.has(keyExtractor(item))
      );
      onSelectItems(selected);
    }
  }, [selectedItems, displayedItems, keyExtractor, onSelectItems]);
  
  // Handle column sorting
  const handleSort = (key: string) => {
    if (sortKey === key) {
      // Toggle direction if already sorting by this column
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      // Set new sort column
      setSortKey(key);
      setSortDirection('asc');
    }
  };
  
  // Handle row selection
  const handleSelectRow = (item: T) => {
    const itemKey = keyExtractor(item);
    
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      
      if (newSet.has(itemKey)) {
        newSet.delete(itemKey);
      } else {
        if (!multiSelect) {
          // Clear previous selections if not multi-select
          newSet.clear();
        }
        newSet.add(itemKey);
      }
      
      return newSet;
    });
  };
  
  // Handle select all toggle
  const handleSelectAll = () => {
    setSelectAll(prev => !prev);
  };
  
  // Handle column visibility toggle
  const toggleColumnVisibility = (key: string) => {
    setColumns(prev => 
      prev.map(col => 
        col.key === key ? { ...col, hidden: !col.hidden } : col
      )
    );
  };
  
  // Calculate total pages for pagination
  const totalPages = pagination && totalItems && pageSize
    ? Math.ceil(totalItems / pageSize)
    : 0;
  
  // Handle page change
  const handlePageChange = (page: number) => {
    if (onPageChange) {
      onPageChange(page);
    }
  };
  
  // Generate a list of page numbers for pagination
  const generatePageNumbers = () => {
    if (!totalPages) return [];
    
    const pages = [];
    
    // Always show first page
    pages.push(1);
    
    // Calculate range of pages around current page
    const rangeStart = Math.max(2, currentPage - 2);
    const rangeEnd = Math.min(totalPages - 1, currentPage + 2);
    
    // Add ellipsis after first page if needed
    if (rangeStart > 2) {
      pages.push('...');
    }
    
    // Add pages in range
    for (let i = rangeStart; i <= rangeEnd; i++) {
      pages.push(i);
    }
    
    // Add ellipsis before last page if needed
    if (rangeEnd < totalPages - 1) {
      pages.push('...');
    }
    
    // Always show last page if not already included
    if (totalPages > 1) {
      pages.push(totalPages);
    }
    
    return pages;
  };
  
  // Combine classes
  const listClasses = [
    'list-component',
    loading ? 'is-loading' : '',
    error ? 'has-error' : '',
    onRowClick ? 'has-clickable-rows' : '',
    selectable ? 'has-selectable-rows' : '',
    className
  ].filter(Boolean).join(' ');
  
  // Filter out hidden columns
  const visibleColumns = columns.filter(col => !col.hidden);
  
  return (
    <div className={listClasses}>
      {/* List header with title, actions, and column controls */}
      {(title || actions || showColumnControls) && (
        <div className="list-header">
          {title && <h3 className="list-title">{title}</h3>}
          
          <div className="list-header-actions">
            {showColumnControls && (
              <div className="column-controls">
                <button className="btn btn-sm">
                  Columns <span className="caret"></span>
                </button>
                <div className="column-dropdown">
                  {columns.map(column => 
                    column.hideable !== false && (
                      <div key={column.key} className="column-option">
                        <label>
                          <input
                            type="checkbox"
                            checked={!column.hidden}
                            onChange={() => toggleColumnVisibility(column.key)}
                          />
                          {column.title}
                        </label>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
            
            {actions}
          </div>
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="list-error">
          <div className="error-message">
            <span className="error-icon">⚠️</span> {error}
          </div>
        </div>
      )}
      
      {/* Loading overlay */}
      {loading && (
        <div className="list-loading-overlay">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      )}
      
      <div className="list-table-container">
        <table className="list-table">
          {/* Table header */}
          {showHeader && (
            <thead>
              <tr>
                {/* Selection checkbox for multi-select */}
                {selectable && (
                  <th className="select-column">
                    {multiSelect && (
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAll}
                      />
                    )}
                  </th>
                )}
                
                {/* Column headers */}
                {visibleColumns.map(column => (
                  <th
                    key={column.key}
                    className={`
                      ${column.sortable ? 'sortable-column' : ''}
                      ${sortKey === column.key ? `sorted-${sortDirection}` : ''}
                    `}
                    style={{ width: column.width }}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className="column-header">
                      <span className="column-title">{column.title}</span>
                      
                      {column.sortable && (
                        <span className="sort-icon">
                          {sortKey === column.key ? (
                            sortDirection === 'asc' ? '▲' : '▼'
                          ) : (
                            '⬍'
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
          )}
          
          {/* Table body */}
          <tbody>
            {displayedItems.length === 0 ? (
              // Empty state
              <tr className="empty-row">
                <td colSpan={visibleColumns.length + (selectable ? 1 : 0)}>
                  {emptyComponent || (
                    <div className="empty-state">
                      <p>No items to display</p>
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              // Data rows
              displayedItems.map((item, index) => {
                const itemKey = keyExtractor(item);
                const isSelected = selectedItems.has(itemKey);
                
                return (
                  <tr
                    key={itemKey}
                    className={`list-row ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      if (selectable) {
                        handleSelectRow(item);
                      }
                      if (onRowClick) {
                        onRowClick(item);
                      }
                    }}
                  >
                    {/* Selection checkbox */}
                    {selectable && (
                      <td className="select-cell">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={e => {
                            e.stopPropagation();
                            handleSelectRow(item);
                          }}
                          onClick={e => e.stopPropagation()}
                        />
                      </td>
                    )}
                    
                    {/* Data cells */}
                    {visibleColumns.map(column => (
                      <td key={column.key} className="list-cell">
                        {column.render 
                          ? column.render(item, index)
                          : (item as any)[column.key]
                        }
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {pagination && totalPages > 0 && (
        <div className="list-pagination">
          <div className="pagination-info">
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, totalItems || 0)} of{' '}
            {totalItems} items
          </div>
          
          <div className="pagination-controls">
            <button
              className="pagination-btn prev-btn"
              disabled={currentPage <= 1}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              Previous
            </button>
            
            <div className="pagination-pages">
              {generatePageNumbers().map((page, index) => (
                <button
                  key={index}
                  className={`
                    pagination-btn page-btn
                    ${page === currentPage ? 'active' : ''}
                    ${page === '...' ? 'ellipsis' : ''}
                  `}
                  disabled={page === '...'}
                  onClick={() => 
                    typeof page === 'number' && handlePageChange(page)
                  }
                >
                  {page}
                </button>
              ))}
            </div>
            
            <button
              className="pagination-btn next-btn"
              disabled={currentPage >= totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}
      
      {children}
    </div>
  );
}

export default ListComponent;

/**
 * Simple list component for displaying items in a card-based grid layout
 */
export function GridList<T>({
  items,
  renderItem,
  keyExtractor,
  loading = false,
  error,
  emptyComponent,
  title,
  actions,
  className = '',
  gridClassName = '',
  columns = 3,
  gap = '1rem',
  children
}: {
  /** Array of data items */
  items: T[];
  /** Function to render each item */
  renderItem: (item: T, index: number) => React.ReactNode;
  /** Key function to extract unique identifier for items */
  keyExtractor: (item: T) => string | number;
  /** Whether data is currently loading */
  loading?: boolean;
  /** Error message */
  error?: string;
  /** Custom renderer for empty state */
  emptyComponent?: React.ReactNode;
  /** Title for the list */
  title?: string;
  /** Custom actions to show in list header */
  actions?: React.ReactNode;
  /** Additional class name for the container */
  className?: string;
  /** Additional class name for the grid */
  gridClassName?: string;
  /** Number of columns in the grid */
  columns?: number;
  /** Gap between grid items */
  gap?: string;
  /** Children elements to render below the list */
  children?: React.ReactNode;
}) {
  // Combine classes
  const listClasses = [
    'grid-list-component',
    loading ? 'is-loading' : '',
    error ? 'has-error' : '',
    className
  ].filter(Boolean).join(' ');
  
  const gridClasses = [
    'grid-list',
    gridClassName
  ].filter(Boolean).join(' ');
  
  return (
    <div className={listClasses}>
      {/* List header with title and actions */}
      {(title || actions) && (
        <div className="list-header">
          {title && <h3 className="list-title">{title}</h3>}
          
          {actions && (
            <div className="list-header-actions">
              {actions}
            </div>
          )}
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="list-error">
          <div className="error-message">
            <span className="error-icon">⚠️</span> {error}
          </div>
        </div>
      )}
      
      {/* Loading overlay */}
      {loading && (
        <div className="list-loading-overlay">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      )}
      
      {/* Grid list */}
      <div 
        className={gridClasses}
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap
        }}
      >
        {items.length === 0 ? (
          // Empty state
          <div className="empty-state" style={{ gridColumn: `span ${columns}` }}>
            {emptyComponent || (
              <div className="empty-message">
                <p>No items to display</p>
              </div>
            )}
          </div>
        ) : (
          // Items
          items.map((item, index) => (
            <div
              key={keyExtractor(item)}
              className="grid-item"
            >
              {renderItem(item, index)}
            </div>
          ))
        )}
      </div>
      
      {children}
    </div>
  );
}

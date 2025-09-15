/**
 * Шаблон компонента списка
 * Базовый шаблон для создания списков с пагинацией, фильтрацией и сортировкой
 * 
 * Использование:
 * 1. Скопировать файл в нужную директорию компонентов
 * 2. Заменить {{ListName}} на название списка (например, UserList)
 * 3. Заменить {{EntityName}} на название сущности (например, User)
 * 4. Заменить {{entityName}} на название в camelCase (например, user)
 * 5. Адаптировать колонки и фильтры под специфику списка
 */

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import classNames from 'classnames';
import { debounce } from 'lodash';

// UI компоненты
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Loader } from '../common/Loader';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { Notification } from '../common/Notification';
import { Modal } from '../common/Modal';

// Хуки
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../hooks/useAuth';

// Сервисы
import { {{entityName}}Service } from '../../services/{{entityName}}Service';

// Типы
import { {{EntityName}}, {{EntityName}}Filter, SortField, SortOrder } from '../../types/{{entityName}}.types';

// Утилиты
import { formatDate, formatNumber } from '../../utils/formatters';
import { downloadFile, exportToCSV } from '../../utils/export';

// Иконки
import { ChevronUp, ChevronDown, Filter, Download, Trash, Edit, Eye } from 'lucide-react';

// Стили
import styles from './{{ListName}}.module.css';

/**
 * Интерфейс пропсов компонента списка
 */
interface {{ListName}}Props {
  className?: string;
  onItemSelect?: (item: {{EntityName}}) => void;
  selectable?: boolean;
  multiSelect?: boolean;
  showActions?: boolean;
  customActions?: (item: {{EntityName}}) => React.ReactNode;
  initialFilters?: Partial<{{EntityName}}Filter>;
  pageSize?: number;
  showFilters?: boolean;
  showPagination?: boolean;
  showExport?: boolean;
}

/**
 * Интерфейс состояния списка
 */
interface ListState {
  selectedItems: Set<string>;
  showBulkActions: boolean;
  showDeleteModal: boolean;
  itemToDelete: {{EntityName}} | null;
}

/**
 * Компонент списка {{ListName}}
 * 
 * @example
 * ```tsx
 * <{{ListName}}
 *   onItemSelect={(item) => navigate(`/{{entityName}}s/${item.id}`)}
 *   showActions
 *   pageSize={25}
 * />
 * ```
 */
export const {{ListName}}: React.FC<{{ListName}}Props> = ({
  className,
  onItemSelect,
  selectable = false,
  multiSelect = false,
  showActions = true,
  customActions,
  initialFilters = {},
  pageSize = 20,
  showFilters = true,
  showPagination = true,
  showExport = true,
}) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  
  // Состояние компонента
  const [state, setState] = useState<ListState>({
    selectedItems: new Set(),
    showBulkActions: false,
    showDeleteModal: false,
    itemToDelete: null
  });
  
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
  } | null>(null);
  
  // Параметры списка из URL
  const currentPage = parseInt(searchParams.get('page') || '1');
  const currentSort = (searchParams.get('sort') || 'created_at') as SortField;
  const currentOrder = (searchParams.get('order') || 'desc') as SortOrder;
  const currentSearch = searchParams.get('search') || '';
  
  // Фильтры
  const [filters, setFilters] = useState<{{EntityName}}Filter>({
    search: currentSearch,
    ...initialFilters,
    ...Object.fromEntries(searchParams.entries())
  });
  
  // Ref для отложенного поиска
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // API запрос для получения списка
  const {
    data,
    loading,
    error,
    refetch
  } = useApi<{
    items: {{EntityName}}[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }>('/api/{{entityName}}s', {
    params: {
      page: currentPage,
      limit: pageSize,
      sort: currentSort,
      order: currentOrder,
      ...filters
    }
  });
  
  // Обновление URL при изменении параметров
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (currentPage > 1) params.set('page', currentPage.toString());
    if (currentSort !== 'created_at') params.set('sort', currentSort);
    if (currentOrder !== 'desc') params.set('order', currentOrder);
    if (filters.search) params.set('search', filters.search);
    
    // Добавляем другие фильтры
    Object.entries(filters).forEach(([key, value]) => {
      if (value && key !== 'search') {
        params.set(key, value.toString());
      }
    });
    
    setSearchParams(params);
  }, [currentPage, currentSort, currentOrder, filters]);
  
  // Обработчики событий
  const handlePageChange = useCallback((page: number) => {
    setSearchParams(prev => {
      prev.set('page', page.toString());
      return prev;
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [setSearchParams]);
  
  const handleSortChange = useCallback((field: SortField) => {
    setSearchParams(prev => {
      const currentSortField = prev.get('sort');
      const currentSortOrder = prev.get('order');
      
      if (currentSortField === field) {
        // Переключаем порядок сортировки
        prev.set('order', currentSortOrder === 'asc' ? 'desc' : 'asc');
      } else {
        // Новое поле сортировки
        prev.set('sort', field);
        prev.set('order', 'desc');
      }
      
      // Сбрасываем на первую страницу
      prev.delete('page');
      
      return prev;
    });
  }, [setSearchParams]);
  
  // Отложенный поиск
  const debouncedSearch = useMemo(
    () => debounce((value: string) => {
      setFilters(prev => ({ ...prev, search: value }));
      setSearchParams(prev => {
        if (value) {
          prev.set('search', value);
        } else {
          prev.delete('search');
        }
        prev.delete('page'); // Сброс на первую страницу
        return prev;
      });
    }, 500),
    [setSearchParams]
  );
  
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    debouncedSearch(value);
  }, [debouncedSearch]);
  
  const handleFilterChange = useCallback((key: keyof {{EntityName}}Filter, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setSearchParams(prev => {
      if (value) {
        prev.set(key, value.toString());
      } else {
        prev.delete(key);
      }
      prev.delete('page'); // Сброс на первую страницу
      return prev;
    });
  }, [setSearchParams]);
  
  const handleResetFilters = useCallback(() => {
    setFilters(initialFilters);
    setSearchParams(new URLSearchParams());
    if (searchInputRef.current) {
      searchInputRef.current.value = '';
    }
  }, [initialFilters, setSearchParams]);
  
  // Выбор элементов
  const handleSelectItem = useCallback((item: {{EntityName}}) => {
    if (!selectable) {
      onItemSelect?.(item);
      return;
    }
    
    setState(prev => {
      const newSelected = new Set(prev.selectedItems);
      
      if (multiSelect) {
        if (newSelected.has(item.id)) {
          newSelected.delete(item.id);
        } else {
          newSelected.add(item.id);
        }
      } else {
        newSelected.clear();
        newSelected.add(item.id);
      }
      
      return {
        ...prev,
        selectedItems: newSelected,
        showBulkActions: newSelected.size > 0
      };
    });
  }, [selectable, multiSelect, onItemSelect]);
  
  const handleSelectAll = useCallback((checked: boolean) => {
    if (!data?.items) return;
    
    setState(prev => ({
      ...prev,
      selectedItems: checked 
        ? new Set(data.items.map(item => item.id))
        : new Set(),
      showBulkActions: checked
    }));
  }, [data]);
  
  // Действия
  const handleView = useCallback((item: {{EntityName}}) => {
    navigate(`/{{entityName}}s/${item.id}`);
  }, [navigate]);
  
  const handleEdit = useCallback((item: {{EntityName}}) => {
    navigate(`/{{entityName}}s/${item.id}/edit`);
  }, [navigate]);
  
  const handleDelete = useCallback((item: {{EntityName}}) => {
    setState(prev => ({
      ...prev,
      showDeleteModal: true,
      itemToDelete: item
    }));
  }, []);
  
  const confirmDelete = useCallback(async () => {
    if (!state.itemToDelete) return;
    
    try {
      await {{entityName}}Service.delete(state.itemToDelete.id);
      
      setNotification({
        type: 'success',
        message: '{{EntityName}} deleted successfully'
      });
      
      setState(prev => ({
        ...prev,
        showDeleteModal: false,
        itemToDelete: null
      }));
      
      refetch();
    } catch (error) {
      setNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to delete {{entityName}}'
      });
    }
  }, [state.itemToDelete, refetch]);
  
  const handleBulkDelete = useCallback(async () => {
    if (!window.confirm(`Delete ${state.selectedItems.size} selected items?`)) {
      return;
    }
    
    try {
      await {{entityName}}Service.bulkDelete(Array.from(state.selectedItems));
      
      setNotification({
        type: 'success',
        message: `${state.selectedItems.size} items deleted successfully`
      });
      
      setState(prev => ({
        ...prev,
        selectedItems: new Set(),
        showBulkActions: false
      }));
      
      refetch();
    } catch (error) {
      setNotification({
        type: 'error',
        message: 'Failed to delete selected items'
      });
    }
  }, [state.selectedItems, refetch]);
  
  // Экспорт
  const handleExport = useCallback(async (format: 'csv' | 'json') => {
    try {
      const exportData = await {{entityName}}Service.export({
        format,
        filters
      });
      
      const filename = `{{entityName}}s_export_${Date.now()}.${format}`;
      
      if (format === 'csv') {
        downloadFile(exportData, filename, 'text/csv');
      } else {
        downloadFile(JSON.stringify(exportData, null, 2), filename, 'application/json');
      }
      
      setNotification({
        type: 'success',
        message: 'Export completed successfully'
      });
    } catch (error) {
      setNotification({
        type: 'error',
        message: 'Failed to export data'
      });
    }
  }, [filters]);
  
  // Вычисляемые значения
  const isAllSelected = useMemo(() => {
    if (!data?.items || data.items.length === 0) return false;
    return data.items.every(item => state.selectedItems.has(item.id));
  }, [data, state.selectedItems]);
  
  const hasActiveFilters = useMemo(() => {
    return Object.entries(filters).some(([key, value]) => {
      if (key === 'search') return value !== '';
      return value !== undefined && value !== null && value !== '';
    });
  }, [filters]);
  
  // Рендер компонентов
  const renderSortIcon = (field: SortField) => {
    if (currentSort !== field) return null;
    return currentOrder === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />;
  };
  
  const renderEmptyState = () => (
    <div className={styles.emptyState}>
      <p className={styles.emptyMessage}>
        {hasActiveFilters ? 'No items match your filters' : 'No items found'}
      </p>
      {hasActiveFilters && (
        <Button variant="secondary" onClick={handleResetFilters}>
          Clear filters
        </Button>
      )}
    </div>
  );
  
  const renderPagination = () => {
    if (!data || data.totalPages <= 1) return null;
    
    const pages = Array.from({ length: data.totalPages }, (_, i) => i + 1);
    const visiblePages = pages.filter(page => {
      if (page === 1 || page === data.totalPages) return true;
      if (Math.abs(page - currentPage) <= 2) return true;
      return false;
    });
    
    return (
      <div className={styles.pagination}>
        <Button
          variant="ghost"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        
        <div className={styles.pageNumbers}>
          {visiblePages.map((page, index) => {
            const showEllipsis = index > 0 && page - visiblePages[index - 1] > 1;
            
            return (
              <React.Fragment key={page}>
                {showEllipsis && <span className={styles.ellipsis}>...</span>}
                <button
                  className={classNames(styles.pageNumber, {
                    [styles.active]: page === currentPage
                  })}
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </button>
              </React.Fragment>
            );
          })}
        </div>
        
        <Button
          variant="ghost"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === data.totalPages}
        >
          Next
        </Button>
      </div>
    );
  };
  
  // Основной рендер
  if (loading && !data) {
    return (
      <div className={classNames(styles.container, styles.centered, className)}>
        <Loader size="large" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={classNames(styles.container, styles.centered, className)}>
        <div className={styles.error}>
          <h3>Error loading {{entityName}}s</h3>
          <p>{error.message}</p>
          <Button onClick={refetch}>Retry</Button>
        </div>
      </div>
    );
  }
  
  return (
    <ErrorBoundary fallback={<div>Something went wrong</div>}>
      <div className={classNames(styles.container, className)}>
        {/* Уведомления */}
        {notification && (
          <Notification
            type={notification.type}
            message={notification.message}
            onClose={() => setNotification(null)}
          />
        )}
        
        {/* Заголовок и действия */}
        <div className={styles.header}>
          <h2 className={styles.title}>{{EntityName}}s</h2>
          <div className={styles.headerActions}>
            {showExport && (
              <div className={styles.exportDropdown}>
                <Button variant="secondary" size="small">
                  <Download size={16} />
                  Export
                </Button>
                <div className={styles.exportMenu}>
                  <button onClick={() => handleExport('csv')}>Export as CSV</button>
                  <button onClick={() => handleExport('json')}>Export as JSON</button>
                </div>
              </div>
            )}
            <Button
              variant="primary"
              onClick={() => navigate('/{{entityName}}s/new')}
            >
              Create {{EntityName}}
            </Button>
          </div>
        </div>
        
        {/* Фильтры */}
        {showFilters && (
          <div className={styles.filters}>
            <div className={styles.searchBox}>
              <Input
                ref={searchInputRef}
                type="search"
                placeholder="Search {{entityName}}s..."
                defaultValue={currentSearch}
                onChange={handleSearchChange}
                className={styles.searchInput}
              />
            </div>
            
            <div className={styles.filterControls}>
              <Select
                value={filters.status || ''}
                onChange={(value) => handleFilterChange('status', value)}
                options={[
                  { value: '', label: 'All Statuses' },
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                  { value: 'pending', label: 'Pending' }
                ]}
                className={styles.filterSelect}
              />
              
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="small"
                  onClick={handleResetFilters}
                >
                  Clear filters
                </Button>
              )}
            </div>
          </div>
        )}
        
        {/* Массовые действия */}
        {state.showBulkActions && multiSelect && (
          <div className={styles.bulkActions}>
            <span>{state.selectedItems.size} selected</span>
            <Button
              variant="danger"
              size="small"
              onClick={handleBulkDelete}
            >
              Delete selected
            </Button>
          </div>
        )}
        
        {/* Таблица */}
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                {(selectable && multiSelect) && (
                  <th className={styles.checkboxColumn}>
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </th>
                )}
                <th
                  className={styles.sortable}
                  onClick={() => handleSortChange('name')}
                >
                  Name {renderSortIcon('name')}
                </th>
                <th
                  className={styles.sortable}
                  onClick={() => handleSortChange('status')}
                >
                  Status {renderSortIcon('status')}
                </th>
                <th
                  className={styles.sortable}
                  onClick={() => handleSortChange('created_at')}
                >
                  Created {renderSortIcon('created_at')}
                </th>
                <th
                  className={styles.sortable}
                  onClick={() => handleSortChange('updated_at')}
                >
                  Updated {renderSortIcon('updated_at')}
                </th>
                {showActions && <th className={styles.actionsColumn}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {data?.items.length === 0 ? (
                <tr>
                  <td colSpan={100} className={styles.emptyCell}>
                    {renderEmptyState()}
                  </td>
                </tr>
              ) : (
                data?.items.map(item => (
                  <tr
                    key={item.id}
                    className={classNames(styles.row, {
                      [styles.selected]: state.selectedItems.has(item.id),
                      [styles.clickable]: selectable || onItemSelect
                    })}
                    onClick={() => handleSelectItem(item)}
                  >
                    {(selectable && multiSelect) && (
                      <td className={styles.checkboxColumn}>
                        <input
                          type="checkbox"
                          checked={state.selectedItems.has(item.id)}
                          onChange={() => {}}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                    )}
                    <td className={styles.nameCell}>{item.name}</td>
                    <td>
                      <span className={classNames(styles.status, styles[`status-${item.status}`])}>
                        {item.status}
                      </span>
                    </td>
                    <td className={styles.dateCell}>{formatDate(item.created_at)}</td>
                    <td className={styles.dateCell}>{formatDate(item.updated_at)}</td>
                    {showActions && (
                      <td className={styles.actionsCell}>
                        <div className={styles.actions}>
                          {customActions?.(item) || (
                            <>
                              <button
                                className={styles.actionButton}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleView(item);
                                }}
                                title="View"
                              >
                                <Eye size={16} />
                              </button>
                              <button
                                className={styles.actionButton}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEdit(item);
                                }}
                                title="Edit"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                className={styles.actionButton}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(item);
                                }}
                                title="Delete"
                              >
                                <Trash size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Пагинация и информация */}
        {showPagination && data && (
          <div className={styles.footer}>
            <div className={styles.info}>
              Showing {((currentPage - 1) * pageSize) + 1} to{' '}
              {Math.min(currentPage * pageSize, data.total)} of {data.total} items
            </div>
            {renderPagination()}
          </div>
        )}
        
        {/* Модалка удаления */}
        <Modal
          isOpen={state.showDeleteModal}
          onClose={() => setState(prev => ({ ...prev, showDeleteModal: false, itemToDelete: null }))}
          title="Confirm Delete"
        >
          <p>Are you sure you want to delete "{state.itemToDelete?.name}"?</p>
          <p className={styles.warning}>This action cannot be undone.</p>
          <div className={styles.modalActions}>
            <Button
              variant="danger"
              onClick={confirmDelete}
            >
              Delete
            </Button>
            <Button
              variant="secondary"
              onClick={() => setState(prev => ({ ...prev, showDeleteModal: false, itemToDelete: null }))}
            >
              Cancel
            </Button>
          </div>
        </Modal>
      </div>
    </ErrorBoundary>
  );
};

export default {{ListName}};
/**
 * Шаблон базового React компонента
 * Базовый шаблон для создания компонентов React с TypeScript
 * 
 * Использование:
 * 1. Скопировать файл в нужную директорию компонентов
 * 2. Заменить {{ComponentName}} на название компонента (например, UserProfile)
 * 3. Заменить {{componentName}} на название в camelCase (например, userProfile)
 * 4. Адаптировать props, состояние и логику под специфику компонента
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import classNames from 'classnames';

// Импорт UI компонентов
import { Button } from '../common/Button';
import { Loader } from '../common/Loader';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { Notification } from '../common/Notification';

// Импорт хуков
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../hooks/useAuth';

// Импорт сервисов
import { {{componentName}}Service } from '../../services/{{componentName}}Service';

// Импорт типов
import { {{ComponentName}}Data, {{ComponentName}}Props } from '../../types/{{componentName}}.types';

// Импорт утилит
import { formatDate, validateData } from '../../utils/formatters';

// Импорт стилей
import styles from './{{ComponentName}}.module.css';

/**
 * Интерфейс пропсов компонента
 */
interface Props extends {{ComponentName}}Props {
  className?: string;
  onDataChange?: (data: {{ComponentName}}Data) => void;
  initialData?: Partial<{{ComponentName}}Data>;
  mode?: 'view' | 'edit' | 'create';
  showHeader?: boolean;
  customActions?: React.ReactNode;
}

/**
 * Интерфейс состояния компонента
 */
interface State {
  data: {{ComponentName}}Data | null;
  isEditing: boolean;
  errors: Record<string, string>;
  isDirty: boolean;
}

/**
 * {{ComponentName}} компонент
 * 
 * @example
 * ```tsx
 * <{{ComponentName}} 
 *   id="123"
 *   mode="edit"
 *   onDataChange={(data) => console.log(data)}
 * />
 * ```
 */
export const {{ComponentName}}: React.FC<Props> = ({
  className,
  onDataChange,
  initialData,
  mode = 'view',
  showHeader = true,
  customActions,
  ...props
}) => {
  // Роутинг
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  // Аутентификация
  const { user, isAuthenticated } = useAuth();
  
  // Локальное состояние
  const [state, setState] = useState<State>({
    data: null,
    isEditing: mode === 'edit' || mode === 'create',
    errors: {},
    isDirty: false
  });
  
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
  } | null>(null);
  
  // Рефы
  const formRef = useRef<HTMLFormElement>(null);
  const initialDataRef = useRef(initialData);
  
  // API хук для загрузки данных
  const {
    data: fetchedData,
    loading,
    error,
    refetch
  } = useApi<{{ComponentName}}Data>(
    id ? `{{endpoint}}/${id}` : null,
    {
      enabled: mode === 'view' || mode === 'edit',
      onSuccess: (data) => {
        setState(prev => ({ ...prev, data }));
      }
    }
  );
  
  // Эффект для инициализации данных
  useEffect(() => {
    if (mode === 'create' && initialData) {
      setState(prev => ({
        ...prev,
        data: { ...getDefaultData(), ...initialData }
      }));
    }
  }, [mode, initialData]);
  
  // Эффект для обновления данных при изменении пропсов
  useEffect(() => {
    if (initialData && initialData !== initialDataRef.current) {
      setState(prev => ({
        ...prev,
        data: prev.data ? { ...prev.data, ...initialData } : null,
        isDirty: true
      }));
      initialDataRef.current = initialData;
    }
  }, [initialData]);
  
  // Обработчики событий
  const handleFieldChange = useCallback((field: keyof {{ComponentName}}Data, value: any) => {
    setState(prev => ({
      ...prev,
      data: prev.data ? { ...prev.data, [field]: value } : null,
      isDirty: true,
      errors: { ...prev.errors, [field]: '' } // Очищаем ошибку поля
    }));
  }, []);
  
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!state.data) return;
    
    // Валидация
    const validationErrors = validateFormData(state.data);
    if (Object.keys(validationErrors).length > 0) {
      setState(prev => ({ ...prev, errors: validationErrors }));
      setNotification({
        type: 'error',
        message: 'Please fix the errors before submitting'
      });
      return;
    }
    
    try {
      // Сохранение данных
      const savedData = mode === 'create'
        ? await {{componentName}}Service.create(state.data)
        : await {{componentName}}Service.update(id!, state.data);
      
      setState(prev => ({
        ...prev,
        data: savedData,
        isDirty: false,
        isEditing: false
      }));
      
      setNotification({
        type: 'success',
        message: `{{ComponentName}} ${mode === 'create' ? 'created' : 'updated'} successfully`
      });
      
      // Вызываем колбэк
      onDataChange?.(savedData);
      
      // Редирект после создания
      if (mode === 'create') {
        navigate(`/{{componentName}}s/${savedData.id}`);
      }
    } catch (error) {
      console.error('Error saving {{componentName}}:', error);
      setNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to save {{componentName}}'
      });
    }
  }, [state.data, mode, id, onDataChange, navigate]);
  
  const handleCancel = useCallback(() => {
    if (state.isDirty) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to cancel?');
      if (!confirmed) return;
    }
    
    setState(prev => ({
      ...prev,
      isEditing: false,
      errors: {},
      isDirty: false,
      data: fetchedData || prev.data
    }));
  }, [state.isDirty, fetchedData]);
  
  const handleEdit = useCallback(() => {
    setState(prev => ({ ...prev, isEditing: true }));
  }, []);
  
  const handleDelete = useCallback(async () => {
    if (!id || !window.confirm('Are you sure you want to delete this {{componentName}}?')) {
      return;
    }
    
    try {
      await {{componentName}}Service.delete(id);
      setNotification({
        type: 'success',
        message: '{{ComponentName}} deleted successfully'
      });
      navigate('/{{componentName}}s');
    } catch (error) {
      console.error('Error deleting {{componentName}}:', error);
      setNotification({
        type: 'error',
        message: 'Failed to delete {{componentName}}'
      });
    }
  }, [id, navigate]);
  
  // Вычисляемые значения
  const canEdit = useMemo(() => {
    if (!isAuthenticated) return false;
    if (mode === 'create') return true;
    if (!state.data || !user) return false;
    
    // Проверка прав доступа
    return state.data.createdBy === user.id || user.role === 'admin';
  }, [isAuthenticated, mode, state.data, user]);
  
  const formTitle = useMemo(() => {
    if (mode === 'create') return 'Create New {{ComponentName}}';
    if (state.isEditing) return 'Edit {{ComponentName}}';
    return '{{ComponentName}} Details';
  }, [mode, state.isEditing]);
  
  // Вспомогательные функции
  function getDefaultData(): {{ComponentName}}Data {
    return {
      id: '',
      name: '',
      description: '',
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: user?.id || ''
      // Добавить дефолтные значения для специфичных полей
    };
  }
  
  function validateFormData(data: {{ComponentName}}Data): Record<string, string> {
    const errors: Record<string, string> = {};
    
    if (!data.name || data.name.trim().length < 3) {
      errors.name = 'Name must be at least 3 characters long';
    }
    
    if (!data.description || data.description.trim().length < 10) {
      errors.description = 'Description must be at least 10 characters long';
    }
    
    // Добавить специфичную валидацию
    
    return errors;
  }
  
  // Рендер состояний загрузки и ошибок
  if (loading) {
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
          <h3>Error loading {{componentName}}</h3>
          <p>{error.message}</p>
          <Button onClick={refetch}>Retry</Button>
        </div>
      </div>
    );
  }
  
  if (!state.data && mode !== 'create') {
    return (
      <div className={classNames(styles.container, styles.centered, className)}>
        <p>No data available</p>
      </div>
    );
  }
  
  // Основной рендер
  return (
    <ErrorBoundary fallback={<div>Something went wrong</div>}>
      <div className={classNames(styles.container, className)}>
        {/* Уведомления */}
        {notification && (
          <Notification
            type={notification.type}
            message={notification.message}
            onClose={() => setNotification(null)}
            autoClose={5000}
          />
        )}
        
        {/* Заголовок */}
        {showHeader && (
          <div className={styles.header}>
            <h2 className={styles.title}>{formTitle}</h2>
            <div className={styles.actions}>
              {customActions}
              {!state.isEditing && canEdit && (
                <Button variant="primary" onClick={handleEdit}>
                  Edit
                </Button>
              )}
              {!state.isEditing && canEdit && (
                <Button variant="danger" onClick={handleDelete}>
                  Delete
                </Button>
              )}
            </div>
          </div>
        )}
        
        {/* Форма */}
        <form 
          ref={formRef}
          className={styles.form}
          onSubmit={handleSubmit}
          noValidate
        >
          {/* Поля формы */}
          <div className={styles.formGroup}>
            <label htmlFor="name" className={styles.label}>
              Name *
            </label>
            {state.isEditing ? (
              <>
                <input
                  type="text"
                  id="name"
                  className={classNames(styles.input, {
                    [styles.inputError]: state.errors.name
                  })}
                  value={state.data?.name || ''}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  disabled={!state.isEditing}
                  required
                />
                {state.errors.name && (
                  <span className={styles.errorMessage}>{state.errors.name}</span>
                )}
              </>
            ) : (
              <p className={styles.value}>{state.data?.name || '-'}</p>
            )}
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="description" className={styles.label}>
              Description *
            </label>
            {state.isEditing ? (
              <>
                <textarea
                  id="description"
                  className={classNames(styles.textarea, {
                    [styles.inputError]: state.errors.description
                  })}
                  value={state.data?.description || ''}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  disabled={!state.isEditing}
                  rows={4}
                  required
                />
                {state.errors.description && (
                  <span className={styles.errorMessage}>{state.errors.description}</span>
                )}
              </>
            ) : (
              <p className={styles.value}>{state.data?.description || '-'}</p>
            )}
          </div>
          
          {/* Метаданные */}
          {mode !== 'create' && state.data && (
            <div className={styles.metadata}>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Created:</span>
                <span className={styles.metaValue}>
                  {formatDate(state.data.createdAt)}
                </span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Updated:</span>
                <span className={styles.metaValue}>
                  {formatDate(state.data.updatedAt)}
                </span>
              </div>
            </div>
          )}
          
          {/* Кнопки действий */}
          {state.isEditing && (
            <div className={styles.formActions}>
              <Button 
                type="submit" 
                variant="primary"
                disabled={!state.isDirty}
              >
                {mode === 'create' ? 'Create' : 'Save'}
              </Button>
              <Button 
                type="button" 
                variant="secondary"
                onClick={handleCancel}
              >
                Cancel
              </Button>
            </div>
          )}
        </form>
      </div>
    </ErrorBoundary>
  );
};

// Мемоизированная версия компонента
export default React.memo({{ComponentName}});
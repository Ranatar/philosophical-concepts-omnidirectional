/**
 * Шаблон компонента формы
 * Базовый шаблон для создания форм с валидацией и управлением состоянием
 * 
 * Использование:
 * 1. Скопировать файл в нужную директорию компонентов
 * 2. Заменить {{FormName}} на название формы (например, UserRegistrationForm)
 * 3. Заменить {{formName}} на название в camelCase (например, userRegistration)
 * 4. Заменить {{EntityName}} на название сущности (например, User)
 * 5. Адаптировать поля и валидацию под специфику формы
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import classNames from 'classnames';

// UI компоненты
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Loader } from '../common/Loader';
import { ErrorBoundary } from '../common/ErrorBoundary';

// Хуки
import { useApi } from '../../hooks/useApi';

// Типы
import { {{EntityName}}, {{FormName}}Data } from '../../types/{{formName}}.types';

// Утилиты
import { formatError, sanitizeInput } from '../../utils/validators';

// Стили
import styles from './{{FormName}}.module.css';

/**
 * Интерфейс пропсов формы
 */
interface {{FormName}}Props {
  className?: string;
  initialData?: Partial<{{FormName}}Data>;
  onSubmit: (data: {{FormName}}Data) => Promise<void> | void;
  onCancel?: () => void;
  onChange?: (data: Partial<{{FormName}}Data>, isValid: boolean) => void;
  mode?: 'create' | 'edit';
  submitLabel?: string;
  cancelLabel?: string;
  showCancel?: boolean;
  disabled?: boolean;
  autoSave?: boolean;
  autoSaveDelay?: number;
}

/**
 * Схема валидации формы
 */
const validationSchema = yup.object().shape({
  name: yup
    .string()
    .trim()
    .required('Name is required')
    .min(3, 'Name must be at least 3 characters')
    .max(100, 'Name must not exceed 100 characters'),
  
  email: yup
    .string()
    .trim()
    .required('Email is required')
    .email('Invalid email format'),
  
  phone: yup
    .string()
    .trim()
    .matches(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/, 'Invalid phone format')
    .nullable(),
  
  status: yup
    .string()
    .oneOf(['active', 'inactive', 'pending'], 'Invalid status')
    .required('Status is required'),
  
  description: yup
    .string()
    .trim()
    .max(500, 'Description must not exceed 500 characters')
    .nullable(),
  
  tags: yup
    .array()
    .of(yup.string().trim())
    .max(10, 'Maximum 10 tags allowed')
    .nullable(),
  
  // Добавить специфичные поля валидации
});

// Тип для данных формы на основе схемы
type FormData = yup.InferType<typeof validationSchema>;

/**
 * Компонент формы {{FormName}}
 * 
 * @example
 * ```tsx
 * <{{FormName}}
 *   initialData={{ name: 'Test' }}
 *   onSubmit={async (data) => {
 *     await saveData(data);
 *   }}
 *   onCancel={() => navigate(-1)}
 * />
 * ```
 */
export const {{FormName}}: React.FC<{{FormName}}Props> = ({
  className,
  initialData,
  onSubmit,
  onCancel,
  onChange,
  mode = 'create',
  submitLabel,
  cancelLabel = 'Cancel',
  showCancel = true,
  disabled = false,
  autoSave = false,
  autoSaveDelay = 2000,
}) => {
  // Состояние формы
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // React Hook Form
  const {
    control,
    handleSubmit,
    formState: { errors, isDirty, isValid, dirtyFields },
    reset,
    watch,
    setValue,
    trigger,
    getValues
  } = useForm<FormData>({
    resolver: yupResolver(validationSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      status: 'active',
      description: '',
      tags: [],
      ...initialData
    }
  });
  
  // Загрузка дополнительных данных (например, опций для селектов)
  const { data: statusOptions } = useApi<Array<{ value: string; label: string }>>(
    '/api/options/statuses',
    { initialData: [] }
  );
  
  // Отслеживание изменений для onChange колбэка
  const watchedValues = watch();
  
  useEffect(() => {
    if (onChange) {
      onChange(watchedValues, isValid);
    }
  }, [watchedValues, isValid, onChange]);
  
  // Автосохранение
  useEffect(() => {
    if (!autoSave || !isDirty || !isValid) return;
    
    const timeoutId = setTimeout(async () => {
      try {
        await handleFormSubmit(getValues());
        setLastSaved(new Date());
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, autoSaveDelay);
    
    return () => clearTimeout(timeoutId);
  }, [watchedValues, autoSave, isDirty, isValid, autoSaveDelay]);
  
  // Обработчик отправки формы
  const handleFormSubmit: SubmitHandler<FormData> = useCallback(async (data) => {
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      // Санитизация данных перед отправкой
      const sanitizedData = sanitizeFormData(data);
      
      // Вызов внешнего обработчика
      await onSubmit(sanitizedData as {{FormName}}Data);
      
      // Сброс состояния формы после успешной отправки
      if (mode === 'create') {
        reset();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setSubmitError(errorMessage);
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [onSubmit, mode, reset]);
  
  // Обработчик отмены
  const handleCancel = useCallback(() => {
    if (isDirty) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to cancel?');
      if (!confirmed) return;
    }
    onCancel?.();
  }, [isDirty, onCancel]);
  
  // Обработчик сброса формы
  const handleReset = useCallback(() => {
    reset(initialData);
    setSubmitError(null);
  }, [reset, initialData]);
  
  // Вспомогательные функции
  function sanitizeFormData(data: FormData): FormData {
    return {
      ...data,
      name: sanitizeInput(data.name),
      email: data.email.toLowerCase().trim(),
      phone: data.phone?.trim() || null,
      description: sanitizeInput(data.description || ''),
      tags: data.tags?.map(tag => sanitizeInput(tag)) || []
    };
  }
  
  // Функция для получения сообщения об ошибке поля
  const getFieldError = useCallback((fieldName: keyof FormData) => {
    const error = errors[fieldName];
    return error ? formatError(error) : undefined;
  }, [errors]);
  
  // Мемоизированные значения
  const submitButtonLabel = useMemo(() => {
    if (submitLabel) return submitLabel;
    if (isSubmitting) return 'Saving...';
    if (mode === 'create') return 'Create';
    return 'Save';
  }, [submitLabel, isSubmitting, mode]);
  
  const formTitle = useMemo(() => {
    return mode === 'create' ? 'Create New {{EntityName}}' : 'Edit {{EntityName}}';
  }, [mode]);
  
  return (
    <ErrorBoundary fallback={<div>Form error occurred</div>}>
      <div className={classNames(styles.container, className)}>
        <form 
          className={styles.form}
          onSubmit={handleSubmit(handleFormSubmit)}
          noValidate
        >
          <h2 className={styles.title}>{formTitle}</h2>
          
          {/* Сообщение об ошибке отправки */}
          {submitError && (
            <div className={styles.errorAlert}>
              <span className={styles.errorIcon}>⚠️</span>
              <span>{submitError}</span>
            </div>
          )}
          
          {/* Индикатор автосохранения */}
          {autoSave && lastSaved && (
            <div className={styles.autoSaveIndicator}>
              Last saved: {lastSaved.toLocaleTimeString()}
            </div>
          )}
          
          {/* Поля формы */}
          <div className={styles.formGrid}>
            {/* Имя */}
            <div className={styles.formGroup}>
              <label htmlFor="name" className={styles.label}>
                Name <span className={styles.required}>*</span>
              </label>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="name"
                    type="text"
                    placeholder="Enter name"
                    error={getFieldError('name')}
                    disabled={disabled || isSubmitting}
                    className={styles.input}
                  />
                )}
              />
            </div>
            
            {/* Email */}
            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.label}>
                Email <span className={styles.required}>*</span>
              </label>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    error={getFieldError('email')}
                    disabled={disabled || isSubmitting}
                    className={styles.input}
                  />
                )}
              />
            </div>
            
            {/* Телефон */}
            <div className={styles.formGroup}>
              <label htmlFor="phone" className={styles.label}>
                Phone
              </label>
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    error={getFieldError('phone')}
                    disabled={disabled || isSubmitting}
                    className={styles.input}
                  />
                )}
              />
            </div>
            
            {/* Статус */}
            <div className={styles.formGroup}>
              <label htmlFor="status" className={styles.label}>
                Status <span className={styles.required}>*</span>
              </label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    id="status"
                    options={statusOptions || [
                      { value: 'active', label: 'Active' },
                      { value: 'inactive', label: 'Inactive' },
                      { value: 'pending', label: 'Pending' }
                    ]}
                    placeholder="Select status"
                    error={getFieldError('status')}
                    disabled={disabled || isSubmitting}
                    className={styles.select}
                  />
                )}
              />
            </div>
          </div>
          
          {/* Описание */}
          <div className={styles.formGroup}>
            <label htmlFor="description" className={styles.label}>
              Description
            </label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <textarea
                  {...field}
                  id="description"
                  placeholder="Enter description"
                  rows={4}
                  disabled={disabled || isSubmitting}
                  className={classNames(styles.textarea, {
                    [styles.error]: errors.description
                  })}
                />
              )}
            />
            {errors.description && (
              <span className={styles.errorMessage}>
                {formatError(errors.description)}
              </span>
            )}
          </div>
          
          {/* Теги */}
          <div className={styles.formGroup}>
            <label htmlFor="tags" className={styles.label}>
              Tags
            </label>
            <Controller
              name="tags"
              control={control}
              render={({ field }) => (
                <TagInput
                  {...field}
                  id="tags"
                  placeholder="Add tags"
                  error={getFieldError('tags')}
                  disabled={disabled || isSubmitting}
                  maxTags={10}
                />
              )}
            />
          </div>
          
          {/* Кнопки действий */}
          <div className={styles.formActions}>
            <Button
              type="submit"
              variant="primary"
              disabled={disabled || isSubmitting || !isValid}
              loading={isSubmitting}
              className={styles.submitButton}
            >
              {submitButtonLabel}
            </Button>
            
            {showCancel && (
              <Button
                type="button"
                variant="secondary"
                onClick={handleCancel}
                disabled={isSubmitting}
                className={styles.cancelButton}
              >
                {cancelLabel}
              </Button>
            )}
            
            {mode === 'create' && isDirty && (
              <Button
                type="button"
                variant="ghost"
                onClick={handleReset}
                disabled={isSubmitting}
                className={styles.resetButton}
              >
                Reset
              </Button>
            )}
          </div>
          
          {/* Информация о состоянии формы (для отладки) */}
          {process.env.NODE_ENV === 'development' && (
            <div className={styles.debugInfo}>
              <p>Dirty: {isDirty ? 'Yes' : 'No'}</p>
              <p>Valid: {isValid ? 'Yes' : 'No'}</p>
              <p>Dirty fields: {Object.keys(dirtyFields).join(', ') || 'None'}</p>
            </div>
          )}
        </form>
      </div>
    </ErrorBoundary>
  );
};

/**
 * Компонент для ввода тегов
 */
const TagInput: React.FC<{
  value?: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  maxTags?: number;
  id?: string;
}> = ({ value = [], onChange, placeholder, error, disabled, maxTags = 10, id }) => {
  const [inputValue, setInputValue] = useState('');
  
  const handleAddTag = useCallback((tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !value.includes(trimmedTag) && value.length < maxTags) {
      onChange([...value, trimmedTag]);
      setInputValue('');
    }
  }, [value, onChange, maxTags]);
  
  const handleRemoveTag = useCallback((index: number) => {
    onChange(value.filter((_, i) => i !== index));
  }, [value, onChange]);
  
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag(inputValue);
    }
  }, [inputValue, handleAddTag]);
  
  return (
    <div className={styles.tagInput}>
      <div className={styles.tags}>
        {value.map((tag, index) => (
          <span key={index} className={styles.tag}>
            {tag}
            <button
              type="button"
              onClick={() => handleRemoveTag(index)}
              disabled={disabled}
              className={styles.tagRemove}
              aria-label={`Remove ${tag}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <input
        id={id}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => handleAddTag(inputValue)}
        placeholder={value.length < maxTags ? placeholder : `Maximum ${maxTags} tags`}
        disabled={disabled || value.length >= maxTags}
        className={classNames(styles.input, {
          [styles.error]: error
        })}
      />
      {error && <span className={styles.errorMessage}>{error}</span>}
    </div>
  );
};

export default {{FormName}};
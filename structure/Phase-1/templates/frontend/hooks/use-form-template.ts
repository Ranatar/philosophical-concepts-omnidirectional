/**
 * Шаблон хука для работы с формами
 * Базовый шаблон для создания хуков управления состоянием форм
 * 
 * Использование:
 * 1. Скопировать файл в директорию hooks
 * 2. Заменить {{HookName}} на название хука (например, useUserForm)
 * 3. Заменить {{FormData}} на тип данных формы (например, UserFormData)
 * 4. Адаптировать валидацию и логику под специфику формы
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { debounce } from 'lodash';

/**
 * Типы ошибок валидации
 */
type ValidationErrors<T> = Partial<Record<keyof T, string | string[]>>;

/**
 * Правила валидации
 */
type ValidationRule<T> = (value: T) => string | undefined;

type ValidationRules<T> = {
  [K in keyof T]?: ValidationRule<T[K]> | ValidationRule<T[K]>[];
};

/**
 * Опции хука
 */
interface {{HookName}}Options<T> {
  // Начальные значения формы
  initialValues: T;
  // Правила валидации
  validationRules?: ValidationRules<T>;
  // Валидация при изменении значения
  validateOnChange?: boolean;
  // Валидация при потере фокуса
  validateOnBlur?: boolean;
  // Задержка валидации (мс)
  validationDelay?: number;
  // Колбэк при отправке формы
  onSubmit?: (values: T) => void | Promise<void>;
  // Колбэк при изменении значений
  onChange?: (values: T) => void;
  // Колбэк при изменении валидности
  onValidChange?: (isValid: boolean) => void;
  // Режим валидации
  validationMode?: 'onChange' | 'onBlur' | 'onSubmit' | 'all';
  // Сохранение в localStorage
  persistKey?: string;
  // Преобразование значений перед сохранением
  transformValues?: (values: T) => T;
}

/**
 * Состояние поля формы
 */
interface FieldState {
  touched: boolean;
  dirty: boolean;
  validating: boolean;
}

/**
 * Мета-информация поля
 */
interface FieldMeta<T> {
  value: T;
  error?: string | string[];
  touched: boolean;
  dirty: boolean;
  validating: boolean;
}

/**
 * Хелперы для работы с полем
 */
interface FieldHelpers<T> {
  setValue: (value: T) => void;
  setTouched: (touched: boolean) => void;
  setError: (error: string | string[] | undefined) => void;
}

/**
 * Результат хука
 */
interface {{HookName}}Result<T> {
  // Значения формы
  values: T;
  // Ошибки валидации
  errors: ValidationErrors<T>;
  // Состояние полей
  touched: Partial<Record<keyof T, boolean>>;
  // Флаг валидности формы
  isValid: boolean;
  // Флаг изменения формы
  isDirty: boolean;
  // Флаг отправки формы
  isSubmitting: boolean;
  // Флаг валидации
  isValidating: boolean;
  // Установка значения поля
  setFieldValue: <K extends keyof T>(field: K, value: T[K]) => void;
  // Установка нескольких значений
  setValues: (values: Partial<T>) => void;
  // Установка ошибки поля
  setFieldError: <K extends keyof T>(field: K, error: string | string[] | undefined) => void;
  // Установка нескольких ошибок
  setErrors: (errors: ValidationErrors<T>) => void;
  // Установка состояния touched для поля
  setFieldTouched: <K extends keyof T>(field: K, touched?: boolean) => void;
  // Установка touched для всех полей
  setAllTouched: (touched?: boolean) => void;
  // Получение пропсов для поля
  getFieldProps: <K extends keyof T>(field: K) => {
    name: K;
    value: T[K];
    onChange: (e: React.ChangeEvent<any>) => void;
    onBlur: (e: React.FocusEvent<any>) => void;
  };
  // Получение мета-информации поля
  getFieldMeta: <K extends keyof T>(field: K) => FieldMeta<T[K]>;
  // Получение хелперов поля
  getFieldHelpers: <K extends keyof T>(field: K) => FieldHelpers<T[K]>;
  // Регистрация поля (для react-hook-form совместимости)
  register: <K extends keyof T>(field: K) => {
    name: K;
    value: T[K];
    onChange: (e: React.ChangeEvent<any>) => void;
    onBlur: (e: React.FocusEvent<any>) => void;
  };
  // Обработчик отправки формы
  handleSubmit: (e?: React.FormEvent) => void | Promise<void>;
  // Сброс формы
  resetForm: (values?: Partial<T>) => void;
  // Валидация формы
  validateForm: () => Promise<ValidationErrors<T>>;
  // Валидация поля
  validateField: <K extends keyof T>(field: K) => Promise<string | string[] | undefined>;
}

/**
 * Хук для управления состоянием формы
 * 
 * @example
 * ```tsx
 * const form = {{HookName}}({
 *   initialValues: { name: '', email: '' },
 *   validationRules: {
 *     name: (value) => !value ? 'Name is required' : undefined,
 *     email: [
 *       (value) => !value ? 'Email is required' : undefined,
 *       (value) => !isEmail(value) ? 'Invalid email' : undefined
 *     ]
 *   },
 *   onSubmit: async (values) => {
 *     await saveUser(values);
 *   }
 * });
 * ```
 */
export function {{HookName}}<T extends Record<string, any>>(
  options: {{HookName}}Options<T>
): {{HookName}}Result<T> {
  const {
    initialValues,
    validationRules = {},
    validateOnChange = true,
    validateOnBlur = true,
    validationDelay = 300,
    onSubmit,
    onChange,
    onValidChange,
    validationMode = 'all',
    persistKey,
    transformValues = (v) => v
  } = options;

  // Состояние формы
  const [values, setValuesState] = useState<T>(() => {
    if (persistKey) {
      const saved = localStorage.getItem(persistKey);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // Игнорируем ошибки парсинга
        }
      }
    }
    return initialValues;
  });

  const [errors, setErrorsState] = useState<ValidationErrors<T>>({});
  const [touched, setTouchedState] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  // Рефы
  const valuesRef = useRef(values);
  const validationTimeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});
  const mountedRef = useRef(true);

  // Обновление рефа значений
  useEffect(() => {
    valuesRef.current = values;
  }, [values]);

  // Сохранение в localStorage
  useEffect(() => {
    if (persistKey) {
      const transformed = transformValues(values);
      localStorage.setItem(persistKey, JSON.stringify(transformed));
    }
  }, [values, persistKey, transformValues]);

  // Функция валидации поля
  const validateFieldValue = useCallback(async <K extends keyof T>(
    field: K,
    value: T[K]
  ): Promise<string | string[] | undefined> => {
    const rules = validationRules[field];
    if (!rules) return undefined;

    const rulesArray = Array.isArray(rules) ? rules : [rules];
    const errors: string[] = [];

    for (const rule of rulesArray) {
      const error = await rule(value);
      if (error) {
        errors.push(error);
      }
    }

    return errors.length === 0 ? undefined : errors.length === 1 ? errors[0] : errors;
  }, [validationRules]);

  // Функция валидации всей формы
  const validateForm = useCallback(async (): Promise<ValidationErrors<T>> => {
    if (!mountedRef.current) return {};

    setIsValidating(true);
    const newErrors: ValidationErrors<T> = {};

    try {
      const validationPromises = Object.keys(validationRules).map(async (field) => {
        const fieldKey = field as keyof T;
        const error = await validateFieldValue(fieldKey, valuesRef.current[fieldKey]);
        if (error) {
          newErrors[fieldKey] = error;
        }
      });

      await Promise.all(validationPromises);
    } finally {
      if (mountedRef.current) {
        setIsValidating(false);
      }
    }

    return newErrors;
  }, [validationRules, validateFieldValue]);

  // Отложенная валидация поля
  const debouncedValidateField = useCallback(<K extends keyof T>(field: K) => {
    // Отменяем предыдущий таймаут
    if (validationTimeoutsRef.current[field as string]) {
      clearTimeout(validationTimeoutsRef.current[field as string]);
    }

    // Устанавливаем новый таймаут
    validationTimeoutsRef.current[field as string] = setTimeout(async () => {
      if (!mountedRef.current) return;

      const error = await validateFieldValue(field, valuesRef.current[field]);
      
      if (mountedRef.current) {
        setErrorsState(prev => ({
          ...prev,
          [field]: error
        }));
      }
    }, validationDelay);
  }, [validateFieldValue, validationDelay]);

  // Установка значения поля
  const setFieldValue = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setValuesState(prev => {
      const newValues = { ...prev, [field]: value };
      
      // Вызываем onChange колбэк
      onChange?.(newValues);
      
      return newValues;
    });

    // Помечаем поле как измененное
    setTouchedState(prev => ({ ...prev, [field]: true }));

    // Валидация при изменении
    if (validateOnChange && (validationMode === 'onChange' || validationMode === 'all')) {
      debouncedValidateField(field);
    }
  }, [onChange, validateOnChange, validationMode, debouncedValidateField]);

  // Установка нескольких значений
  const setValues = useCallback((newValues: Partial<T>) => {
    setValuesState(prev => {
      const updated = { ...prev, ...newValues };
      onChange?.(updated);
      return updated;
    });

    // Валидация измененных полей
    if (validateOnChange && (validationMode === 'onChange' || validationMode === 'all')) {
      Object.keys(newValues).forEach(field => {
        debouncedValidateField(field as keyof T);
      });
    }
  }, [onChange, validateOnChange, validationMode, debouncedValidateField]);

  // Установка ошибки поля
  const setFieldError = useCallback(<K extends keyof T>(
    field: K,
    error: string | string[] | undefined
  ) => {
    setErrorsState(prev => ({
      ...prev,
      [field]: error
    }));
  }, []);

  // Установка нескольких ошибок
  const setErrors = useCallback((errors: ValidationErrors<T>) => {
    setErrorsState(errors);
  }, []);

  // Установка touched для поля
  const setFieldTouched = useCallback(<K extends keyof T>(
    field: K,
    touched: boolean = true
  ) => {
    setTouchedState(prev => ({ ...prev, [field]: touched }));

    // Валидация при потере фокуса
    if (touched && validateOnBlur && (validationMode === 'onBlur' || validationMode === 'all')) {
      debouncedValidateField(field);
    }
  }, [validateOnBlur, validationMode, debouncedValidateField]);

  // Установка touched для всех полей
  const setAllTouched = useCallback((touched: boolean = true) => {
    const allTouched = Object.keys(values).reduce((acc, key) => ({
      ...acc,
      [key]: touched
    }), {} as Partial<Record<keyof T, boolean>>);
    
    setTouchedState(allTouched);
  }, [values]);

  // Получение пропсов для поля
  const getFieldProps = useCallback(<K extends keyof T>(field: K) => {
    return {
      name: field,
      value: values[field],
      onChange: (e: React.ChangeEvent<any>) => {
        const value = e.target.type === 'checkbox' 
          ? e.target.checked 
          : e.target.value;
        setFieldValue(field, value);
      },
      onBlur: (e: React.FocusEvent<any>) => {
        setFieldTouched(field, true);
      }
    };
  }, [values, setFieldValue, setFieldTouched]);

  // Получение мета-информации поля
  const getFieldMeta = useCallback(<K extends keyof T>(field: K): FieldMeta<T[K]> => {
    return {
      value: values[field],
      error: errors[field],
      touched: touched[field] || false,
      dirty: values[field] !== initialValues[field],
      validating: isValidating
    };
  }, [values, errors, touched, initialValues, isValidating]);

  // Получение хелперов поля
  const getFieldHelpers = useCallback(<K extends keyof T>(field: K): FieldHelpers<T[K]> => {
    return {
      setValue: (value: T[K]) => setFieldValue(field, value),
      setTouched: (touched: boolean) => setFieldTouched(field, touched),
      setError: (error: string | string[] | undefined) => setFieldError(field, error)
    };
  }, [setFieldValue, setFieldTouched, setFieldError]);

  // Регистрация поля (совместимость с react-hook-form)
  const register = useCallback(<K extends keyof T>(field: K) => {
    return getFieldProps(field);
  }, [getFieldProps]);

  // Обработчик отправки формы
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();

    // Помечаем все поля как touched
    setAllTouched(true);

    // Валидируем форму
    const validationErrors = await validateForm();
    setErrorsState(validationErrors);

    // Если есть ошибки, не отправляем
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const transformed = transformValues(values);
      await onSubmit?.(transformed);
    } catch (error) {
      console.error('Form submission error:', error);
      // Можно добавить обработку ошибок отправки
    } finally {
      if (mountedRef.current) {
        setIsSubmitting(false);
      }
    }
  }, [values, validateForm, setAllTouched, onSubmit, transformValues]);

  // Сброс формы
  const resetForm = useCallback((newValues?: Partial<T>) => {
    const resetValues = newValues ? { ...initialValues, ...newValues } : initialValues;
    
    setValuesState(resetValues);
    setErrorsState({});
    setTouchedState({});
    setIsSubmitting(false);
    setIsValidating(false);

    // Очищаем таймауты валидации
    Object.values(validationTimeoutsRef.current).forEach(timeout => {
      clearTimeout(timeout);
    });
    validationTimeoutsRef.current = {};

    // Очищаем localStorage если нужно
    if (persistKey && !newValues) {
      localStorage.removeItem(persistKey);
    }
  }, [initialValues, persistKey]);

  // Валидация конкретного поля
  const validateField = useCallback(async <K extends keyof T>(field: K) => {
    const error = await validateFieldValue(field, values[field]);
    if (mountedRef.current) {
      setFieldError(field, error);
    }
    return error;
  }, [values, validateFieldValue, setFieldError]);

  // Вычисляемые значения
  const isValid = useMemo(() => {
    return Object.keys(errors).length === 0;
  }, [errors]);

  const isDirty = useMemo(() => {
    return Object.keys(values).some(key => {
      const field = key as keyof T;
      return values[field] !== initialValues[field];
    });
  }, [values, initialValues]);

  // Эффект для отслеживания валидности
  useEffect(() => {
    onValidChange?.(isValid);
  }, [isValid, onValidChange]);

  // Эффект для очистки при размонтировании
  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      // Очищаем все таймауты
      Object.values(validationTimeoutsRef.current).forEach(timeout => {
        clearTimeout(timeout);
      });
    };
  }, []);

  return {
    values,
    errors,
    touched,
    isValid,
    isDirty,
    isSubmitting,
    isValidating,
    setFieldValue,
    setValues,
    setFieldError,
    setErrors,
    setFieldTouched,
    setAllTouched,
    getFieldProps,
    getFieldMeta,
    getFieldHelpers,
    register,
    handleSubmit,
    resetForm,
    validateForm,
    validateField
  };
}

/**
 * Хук для создания контролируемого поля формы
 */
export function useField<T>(
  name: string,
  form: {{HookName}}Result<any>
): [FieldMeta<T>, FieldHelpers<T>] {
  const meta = form.getFieldMeta(name as any);
  const helpers = form.getFieldHelpers(name as any);
  
  return [meta as FieldMeta<T>, helpers as FieldHelpers<T>];
}

/**
 * Встроенные валидаторы
 */
export const validators = {
  required: (message = 'This field is required') => 
    <T>(value: T) => !value ? message : undefined,
  
  minLength: (min: number, message?: string) => 
    (value: string) => value.length < min 
      ? message || `Must be at least ${min} characters` 
      : undefined,
  
  maxLength: (max: number, message?: string) => 
    (value: string) => value.length > max 
      ? message || `Must be no more than ${max} characters` 
      : undefined,
  
  pattern: (pattern: RegExp, message = 'Invalid format') => 
    (value: string) => !pattern.test(value) ? message : undefined,
  
  email: (message = 'Invalid email address') => 
    (value: string) => !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value) 
      ? message 
      : undefined,
  
  numeric: (message = 'Must be a number') => 
    (value: string) => isNaN(Number(value)) ? message : undefined,
  
  min: (min: number, message?: string) => 
    (value: number) => value < min 
      ? message || `Must be at least ${min}` 
      : undefined,
  
  max: (max: number, message?: string) => 
    (value: number) => value > max 
      ? message || `Must be no more than ${max}` 
      : undefined,
  
  oneOf: <T>(values: T[], message?: string) => 
    (value: T) => !values.includes(value) 
      ? message || `Must be one of: ${values.join(', ')}` 
      : undefined,
  
  custom: <T>(fn: (value: T) => boolean, message: string) => 
    (value: T) => !fn(value) ? message : undefined
};

/**
 * Утилита для комбинирования валидаторов
 */
export function composeValidators<T>(...validators: ValidationRule<T>[]): ValidationRule<T> {
  return (value: T) => {
    for (const validator of validators) {
      const error = validator(value);
      if (error) return error;
    }
    return undefined;
  };
}
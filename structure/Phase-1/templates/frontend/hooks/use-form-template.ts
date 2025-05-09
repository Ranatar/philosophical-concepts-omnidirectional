import { useState, useCallback, useEffect, ChangeEvent } from 'react';

/**
 * Field configuration for validation
 */
interface FieldConfig {
  /** Whether the field is required */
  required?: boolean;
  /** Field label for error messages */
  label?: string;
  /** Minimum value/length */
  min?: number;
  /** Maximum value/length */
  max?: number;
  /** Regular expression pattern for validation */
  pattern?: RegExp;
  /** Custom validation function */
  validate?: (value: any, formData: any) => string | null;
  /** Custom transform function */
  transform?: (value: any) => any;
  /** Initial value */
  initialValue?: any;
}

/**
 * Form configuration
 */
interface FormConfig {
  /** Field configuration by field name */
  fields: Record<string, FieldConfig>;
  /** Initial values */
  initialValues?: Record<string, any>;
  /** Whether to validate on change */
  validateOnChange?: boolean;
  /** Whether to validate on blur */
  validateOnBlur?: boolean;
  /** Whether to validate all fields on submit */
  validateOnSubmit?: boolean;
  /** Function to run before validation */
  onPreValidate?: (values: any) => any;
  /** Function to run after validation */
  onPostValidate?: (values: any, errors: Record<string, string>) => void;
  /** Function to run when form is submitted and valid */
  onSubmit?: (values: any) => void | Promise<any>;
}

/**
 * Custom hook for form handling with validation
 * 
 * @example
 * ```ts
 * const { values, errors, touched, handleChange, handleBlur, handleSubmit, setFieldValue, reset } = useForm({
 *   fields: {
 *     name: { required: true },
 *     email: { 
 *       required: true, 
 *       validate: (value) => (/^\S+@\S+\.\S+$/.test(value) ? null : 'Invalid email format')
 *     },
 *     age: { min: 18, max: 100 }
 *   },
 *   initialValues: {
 *     name: '',
 *     email: '',
 *     age: ''
 *   },
 *   onSubmit: (values) => console.log('Form submitted', values)
 * });
 * ```
 */
function useForm(config: FormConfig) {
  // Extract config properties with defaults
  const {
    fields,
    initialValues = {},
    validateOnChange = false,
    validateOnBlur = true,
    validateOnSubmit = true,
    onPreValidate,
    onPostValidate,
    onSubmit
  } = config;
  
  // Initialize form state
  const [values, setValues] = useState(() => {
    // Get initial values from fields config or initialValues prop
    const initialFormValues: Record<string, any> = {};
    
    // Process all fields
    Object.entries(fields).forEach(([fieldName, fieldConfig]) => {
      // Check if the field has initialValue in config
      if (fieldConfig.initialValue !== undefined) {
        initialFormValues[fieldName] = fieldConfig.initialValue;
      }
      // Otherwise use the initialValues prop if available
      else if (initialValues[fieldName] !== undefined) {
        initialFormValues[fieldName] = initialValues[fieldName];
      }
      // Default to empty string or appropriate default based on field type
      else {
        initialFormValues[fieldName] = '';
      }
    });
    
    return initialFormValues;
  });
  
  // Track touched fields
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  
  // Track validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Track submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitCount, setSubmitCount] = useState(0);
  
  // Track if the form is dirty (values changed from initial)
  const [isDirty, setIsDirty] = useState(false);
  
  // Update isDirty when values change
  useEffect(() => {
    // Compare current values with initial values
    const isFormDirty = Object.keys(fields).some(fieldName => {
      const initialValue = fields[fieldName].initialValue !== undefined
        ? fields[fieldName].initialValue
        : initialValues[fieldName];
      
      return values[fieldName] !== initialValue && 
        !(values[fieldName] === '' && initialValue === undefined);
    });
    
    setIsDirty(isFormDirty);
  }, [values, fields, initialValues]);
  
  // Validate a single field
  const validateField = useCallback((fieldName: string, value: any): string => {
    const fieldConfig = fields[fieldName];
    
    if (!fieldConfig) {
      return '';
    }
    
    // Required validation
    if (fieldConfig.required && (value === undefined || value === null || value === '')) {
      return `${fieldConfig.label || fieldName} is required`;
    }
    
    // Skip validation if value is empty and not required
    if (value === undefined || value === null || value === '') {
      return '';
    }
    
    // Min/max validation for numbers
    if (typeof value === 'number') {
      if (fieldConfig.min !== undefined && value < fieldConfig.min) {
        return `${fieldConfig.label || fieldName} must be at least ${fieldConfig.min}`;
      }
      
      if (fieldConfig.max !== undefined && value > fieldConfig.max) {
        return `${fieldConfig.label || fieldName} must be at most ${fieldConfig.max}`;
      }
    }
    
    // Min/max validation for strings
    if (typeof value === 'string') {
      if (fieldConfig.min !== undefined && value.length < fieldConfig.min) {
        return `${fieldConfig.label || fieldName} must be at least ${fieldConfig.min} characters`;
      }
      
      if (fieldConfig.max !== undefined && value.length > fieldConfig.max) {
        return `${fieldConfig.label || fieldName} must be at most ${fieldConfig.max} characters`;
      }
    }
    
    // Pattern validation
    if (fieldConfig.pattern && typeof value === 'string' && !fieldConfig.pattern.test(value)) {
      return `${fieldConfig.label || fieldName} is not in the correct format`;
    }
    
    // Custom validation
    if (fieldConfig.validate) {
      const customError = fieldConfig.validate(value, values);
      if (customError) {
        return customError;
      }
    }
    
    return '';
  }, [fields, values]);
  
  // Validate all fields
  const validateForm = useCallback((): Record<string, string> => {
    const newErrors: Record<string, string> = {};
    
    // Pre-validate hook
    let valuesToValidate = { ...values };
    if (onPreValidate) {
      valuesToValidate = onPreValidate(valuesToValidate);
    }
    
    // Validate each field
    Object.keys(fields).forEach(fieldName => {
      const error = validateField(fieldName, valuesToValidate[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
      }
    });
    
    // Post-validate hook
    if (onPostValidate) {
      onPostValidate(valuesToValidate, newErrors);
    }
    
    setErrors(newErrors);
    return newErrors;
  }, [fields, validateField, values, onPreValidate, onPostValidate]);
  
  // Handler for field change
  const handleChange = useCallback((
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> | any
  ) => {
    const { name, value, type, checked } = e.target || e;
    
    // Process the value based on input type
    let newValue = value;
    
    // Handle checkbox inputs
    if (type === 'checkbox') {
      newValue = checked;
    }
    
    // Handle number inputs
    if (type === 'number') {
      newValue = value === '' ? '' : Number(value);
    }
    
    // Apply field transformation if defined
    if (fields[name]?.transform) {
      newValue = fields[name].transform!(newValue);
    }
    
    // Update values
    setValues(prev => ({
      ...prev,
      [name]: newValue
    }));
    
    // Validate on change if enabled
    if (validateOnChange) {
      const error = validateField(name, newValue);
      setErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }
    
    // Mark as touched
    if (!touched[name]) {
      setTouched(prev => ({
        ...prev,
        [name]: true
      }));
    }
  }, [fields, touched, validateField, validateOnChange]);
  
  // Handler for field blur
  const handleBlur = useCallback((
    e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> | any
  ) => {
    const { name } = e.target || e;
    
    // Mark as touched
    if (!touched[name]) {
      setTouched(prev => ({
        ...prev,
        [name]: true
      }));
    }
    
    // Validate on blur if enabled
    if (validateOnBlur) {
      const error = validateField(name, values[name]);
      setErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }
  }, [touched, validateField, validateOnBlur, values]);
  
  // Set a specific field value
  const setFieldValue = useCallback((
    name: string,
    value: any,
    shouldValidate = false
  ) => {
    // Apply field transformation if defined
    if (fields[name]?.transform) {
      value = fields[name].transform!(value);
    }
    
    // Update value
    setValues(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Validate if requested
    if (shouldValidate) {
      const error = validateField(name, value);
      setErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }
  }, [fields, validateField]);
  
  // Set multiple field values at once
  const setFieldValues = useCallback((
    fieldValues: Record<string, any>,
    shouldValidate = false
  ) => {
    // Apply transformations
    const processedValues = { ...fieldValues };
    
    Object.keys(fieldValues).forEach(name => {
      if (fields[name]?.transform) {
        processedValues[name] = fields[name].transform!(fieldValues[name]);
      }
    });
    
    // Update values
    setValues(prev => ({
      ...prev,
      ...processedValues
    }));
    
    // Validate if requested
    if (shouldValidate) {
      const newErrors: Record<string, string> = { ...errors };
      
      Object.keys(fieldValues).forEach(name => {
        newErrors[name] = validateField(name, processedValues[name]);
      });
      
      setErrors(newErrors);
    }
  }, [fields, validateField, errors]);
  
  // Set a specific touched state
  const setFieldTouched = useCallback((
    name: string,
    isTouched = true,
    shouldValidate = false
  ) => {
    setTouched(prev => ({
      ...prev,
      [name]: isTouched
    }));
    
    // Validate if requested
    if (shouldValidate) {
      const error = validateField(name, values[name]);
      setErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }
  }, [validateField, values]);
  
  // Set multiple touched states at once
  const setFieldsTouched = useCallback((
    touchedFields: Record<string, boolean>,
    shouldValidate = false
  ) => {
    setTouched(prev => ({
      ...prev,
      ...touchedFields
    }));
    
    // Validate if requested
    if (shouldValidate) {
      const newErrors: Record<string, string> = { ...errors };
      
      Object.keys(touchedFields).forEach(name => {
        if (touchedFields[name]) {
          newErrors[name] = validateField(name, values[name]);
        }
      });
      
      setErrors(newErrors);
    }
  }, [validateField, values, errors]);
  
  // Set a specific error
  const setFieldError = useCallback((name: string, error: string) => {
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  }, []);
  
  // Set multiple errors at once
  const setFieldErrors = useCallback((newErrors: Record<string, string>) => {
    setErrors(prev => ({
      ...prev,
      ...newErrors
    }));
  }, []);
  
  // Reset the form
  const reset = useCallback((newValues?: Record<string, any>) => {
    // Reset to initial values or new values if provided
    const resetValues: Record<string, any> = {};
    
    if (newValues) {
      // Use provided new values
      Object.keys(fields).forEach(fieldName => {
        resetValues[fieldName] = newValues[fieldName] !== undefined
          ? newValues[fieldName]
          : (fields[fieldName].initialValue !== undefined
              ? fields[fieldName].initialValue
              : '');
      });
    } else {
      // Reset to initial values
      Object.keys(fields).forEach(fieldName => {
        resetValues[fieldName] = fields[fieldName].initialValue !== undefined
          ? fields[fieldName].initialValue
          : (initialValues[fieldName] !== undefined
              ? initialValues[fieldName]
              : '');
      });
    }
    
    setValues(resetValues);
    setTouched({});
    setErrors({});
    setIsSubmitted(false);
    setIsSubmitting(false);
  }, [fields, initialValues]);
  
  // Handle form submission
  const handleSubmit = useCallback(async (
    e?: React.FormEvent<HTMLFormElement>
  ) => {
    // Prevent default form submission
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    
    // Increment submit count
    setSubmitCount(prev => prev + 1);
    
    // Mark all fields as touched
    const allTouched: Record<string, boolean> = {};
    Object.keys(fields).forEach(fieldName => {
      allTouched[fieldName] = true;
    });
    setTouched(allTouched);
    
    // Validate all fields
    let formErrors = {};
    if (validateOnSubmit) {
      formErrors = validateForm();
    }
    
    setIsSubmitted(true);
    
    // Check if there are any errors
    if (Object.keys(formErrors).length === 0) {
      // Form is valid, proceed with submission
      if (onSubmit) {
        setIsSubmitting(true);
        
        try {
          await onSubmit(values);
          // Submission successful
        } catch (error) {
          // Handle submission error
          console.error('Form submission error:', error);
        } finally {
          setIsSubmitting(false);
        }
      }
      
      return true;
    } else {
      // Form has errors
      return false;
    }
  }, [fields, validateForm, validateOnSubmit, onSubmit, values]);
  
  // Check if the form is valid
  const isValid = Object.keys(errors).length === 0;
  
  return {
    // Form state
    values,
    errors,
    touched,
    isSubmitting,
    isSubmitted,
    submitCount,
    isDirty,
    isValid,
    
    // Handlers
    handleChange,
    handleBlur,
    handleSubmit,
    
    // Field utilities
    setFieldValue,
    setFieldValues,
    setFieldTouched,
    setFieldsTouched,
    setFieldError,
    setFieldErrors,
    
    // Form utilities
    reset,
    validateForm,
    validateField
  };
}

export default useForm;

/**
 * Custom hook for handling simple search form state
 * 
 * @example
 * ```ts
 * const { searchParams, handleSearchChange, handleSearch, resetSearch } = useSearchForm({
 *   initialParams: { query: '', status: '' },
 *   onSearch: (params) => fetchData(params)
 * });
 * ```
 */
export function useSearchForm<T extends Record<string, any>>(options: {
  /** Initial search parameters */
  initialParams: T;
  /** Function to call when search is performed */
  onSearch?: (params: T) => void;
  /** Whether to search automatically on change */
  searchOnChange?: boolean;
  /** Debounce time in ms (0 to disable) */
  debounceTime?: number;
}) {
  const {
    initialParams,
    onSearch,
    searchOnChange = false,
    debounceTime = 0
  } = options;
  
  // Search parameters state
  const [searchParams, setSearchParams] = useState<T>(initialParams);
  
  // Debounce timer
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  
  // Handle search parameter change
  const handleSearchChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement> | { name: string; value: any }
  ) => {
    const { name, value, type, checked } = e as any;
    
    // Process the value based on input type
    let newValue = value;
    
    // Handle checkbox inputs
    if (type === 'checkbox') {
      newValue = checked;
    }
    
    // Update search params
    setSearchParams(prev => ({
      ...prev,
      [name]: newValue
    }));
    
    // Search on change if enabled
    if (searchOnChange) {
      // Clear previous timer
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      
      // Debounce search
      if (debounceTime > 0) {
        const timer = setTimeout(() => {
          if (onSearch) {
            onSearch({
              ...searchParams,
              [name]: newValue
            } as T);
          }
        }, debounceTime);
        
        setDebounceTimer(timer);
      } else {
        // No debounce
        if (onSearch) {
          onSearch({
            ...searchParams,
            [name]: newValue
          } as T);
        }
      }
    }
  }, [searchParams, searchOnChange, onSearch, debounceTime, debounceTimer]);
  
  // Handle search form submission
  const handleSearch = useCallback((e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    if (onSearch) {
      onSearch(searchParams);
    }
  }, [searchParams, onSearch]);
  
  // Reset search form
  const resetSearch = useCallback(() => {
    setSearchParams(initialParams);
    
    // Trigger search with initial params
    if (onSearch) {
      onSearch(initialParams);
    }
  }, [initialParams, onSearch]);
  
  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);
  
  return {
    searchParams,
    setSearchParams,
    handleSearchChange,
    handleSearch,
    resetSearch
  };
}

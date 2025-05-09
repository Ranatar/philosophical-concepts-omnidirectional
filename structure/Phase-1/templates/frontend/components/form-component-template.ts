import React, { useState, useEffect } from 'react';

/**
 * Field configuration for form fields
 */
interface FieldConfig {
  /** Field name (used as key and form field name) */
  name: string;
  /** Field label */
  label: string;
  /** Field type (text, email, password, etc.) */
  type?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Default value */
  defaultValue?: any;
  /** Help text to display below the field */
  helpText?: string;
  /** Custom validation function */
  validate?: (value: any, formData: Record<string, any>) => string | null;
  /** Options for select fields */
  options?: Array<{
    label: string;
    value: any;
  }>;
  /** Optional render function for custom field rendering */
  render?: (field: FieldConfig, value: any, onChange: (value: any) => void, error?: string) => React.ReactNode;
  /** Additional props to pass to the input element */
  inputProps?: Record<string, any>;
}

/**
 * Props for FormComponent
 */
interface FormComponentProps {
  /** Form title */
  title?: string;
  /** Form fields configuration */
  fields: FieldConfig[];
  /** Initial values for the form */
  initialValues?: Record<string, any>;
  /** Callback for form submission */
  onSubmit: (values: Record<string, any>) => void | Promise<void>;
  /** Text for the submit button */
  submitText?: string;
  /** Whether the form is currently submitting */
  isSubmitting?: boolean;
  /** Form-level error message */
  error?: string;
  /** Whether to show the form in a horizontal layout */
  horizontal?: boolean;
  /** Optional callback when form is reset */
  onReset?: () => void;
  /** Optional success message */
  successMessage?: string;
  /** Optional custom class name */
  className?: string;
  /** Content to render after the form */
  children?: React.ReactNode;
}

/**
 * FormComponent - A reusable form component with validation
 * 
 * @example
 * ```tsx
 * <FormComponent
 *   title="Contact Form"
 *   fields={[
 *     { name: 'name', label: 'Name', required: true },
 *     { name: 'email', label: 'Email', type: 'email', required: true },
 *     { name: 'message', label: 'Message', type: 'textarea', required: true }
 *   ]}
 *   onSubmit={handleSubmit}
 *   submitText="Send Message"
 * />
 * ```
 */
const FormComponent: React.FC<FormComponentProps> = ({
  title,
  fields,
  initialValues = {},
  onSubmit,
  submitText = 'Submit',
  isSubmitting = false,
  error,
  horizontal = false,
  onReset,
  successMessage,
  className = '',
  children
}) => {
  // Form state
  const [formData, setFormData] = useState<Record<string, any>>(initialValues);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Update form data when initialValues change
  useEffect(() => {
    setFormData(initialValues);
  }, [initialValues]);
  
  // Handle input change
  const handleChange = (name: string, value: any) => {
    // Update form data
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Mark field as touched
    if (!touched[name]) {
      setTouched(prev => ({
        ...prev,
        [name]: true
      }));
    }
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Hide success message when form changes
    if (showSuccess) {
      setShowSuccess(false);
    }
  };
  
  // Validate a single field
  const validateField = (field: FieldConfig, value: any): string => {
    // Required field validation
    if (field.required && (value === undefined || value === null || value === '')) {
      return `${field.label} is required`;
    }
    
    // Email validation
    if (field.type === 'email' && value && !/^\S+@\S+\.\S+$/.test(value)) {
      return 'Please enter a valid email address';
    }
    
    // URL validation
    if (field.type === 'url' && value && !/^(ftp|http|https):\/\/[^ "]+$/.test(value)) {
      return 'Please enter a valid URL';
    }
    
    // Custom validation function
    if (field.validate) {
      const customError = field.validate(value, formData);
      if (customError) {
        return customError;
      }
    }
    
    return '';
  };
  
  // Validate all fields
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;
    
    // Validate each field
    fields.forEach(field => {
      const value = formData[field.name];
      const error = validateField(field, value);
      
      if (error) {
        newErrors[field.name] = error;
        isValid = false;
      }
    });
    
    setErrors(newErrors);
    return isValid;
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched
    const allTouched: Record<string, boolean> = {};
    fields.forEach(field => {
      allTouched[field.name] = true;
    });
    setTouched(allTouched);
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    try {
      // Call onSubmit callback
      await onSubmit(formData);
      
      // Show success message if provided
      if (successMessage) {
        setShowSuccess(true);
        
        // Hide success message after 5 seconds
        setTimeout(() => {
          setShowSuccess(false);
        }, 5000);
      }
    } catch (err) {
      // Error handling is done by the parent component
      console.error('Form submission error:', err);
    }
  };
  
  // Handle form reset
  const handleReset = () => {
    setFormData(initialValues);
    setTouched({});
    setErrors({});
    setShowSuccess(false);
    
    if (onReset) {
      onReset();
    }
  };
  
  // Render a field based on its configuration
  const renderField = (field: FieldConfig) => {
    const value = formData[field.name] !== undefined ? formData[field.name] : field.defaultValue || '';
    const fieldError = touched[field.name] ? errors[field.name] : '';
    
    // Use custom render function if provided
    if (field.render) {
      return field.render(
        field,
        value,
        (newValue) => handleChange(field.name, newValue),
        fieldError
      );
    }
    
    // Default field rendering based on field type
    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            id={field.name}
            name={field.name}
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            className={`form-textarea ${fieldError ? 'is-invalid' : ''}`}
            placeholder={field.placeholder}
            required={field.required}
            {...field.inputProps}
          />
        );
        
      case 'select':
        return (
          <select
            id={field.name}
            name={field.name}
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            className={`form-select ${fieldError ? 'is-invalid' : ''}`}
            required={field.required}
            {...field.inputProps}
          >
            {!field.required && (
              <option value="">-- Select {field.label} --</option>
            )}
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
        
      case 'checkbox':
        return (
          <input
            type="checkbox"
            id={field.name}
            name={field.name}
            checked={!!value}
            onChange={(e) => handleChange(field.name, e.target.checked)}
            className={`form-checkbox ${fieldError ? 'is-invalid' : ''}`}
            required={field.required}
            {...field.inputProps}
          />
        );
        
      case 'radio':
        return (
          <div className="radio-group">
            {field.options?.map((option) => (
              <div key={option.value} className="radio-option">
                <input
                  type="radio"
                  id={`${field.name}-${option.value}`}
                  name={field.name}
                  value={option.value}
                  checked={value === option.value}
                  onChange={() => handleChange(field.name, option.value)}
                  className={fieldError ? 'is-invalid' : ''}
                  required={field.required}
                  {...field.inputProps}
                />
                <label htmlFor={`${field.name}-${option.value}`}>
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        );
        
      default:
        return (
          <input
            type={field.type || 'text'}
            id={field.name}
            name={field.name}
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            className={`form-input ${fieldError ? 'is-invalid' : ''}`}
            placeholder={field.placeholder}
            required={field.required}
            {...field.inputProps}
          />
        );
    }
  };
  
  // Form layout classes
  const formClasses = [
    'form-component',
    horizontal ? 'form-horizontal' : 'form-vertical',
    className
  ].filter(Boolean).join(' ');
  
  return (
    <div className={formClasses}>
      {title && <h3 className="form-title">{title}</h3>}
      
      {/* Form-level error message */}
      {error && (
        <div className="form-error">
          <div className="error-message">
            <span className="error-icon">⚠️</span> {error}
          </div>
        </div>
      )}
      
      {/* Success message */}
      {showSuccess && successMessage && (
        <div className="form-success">
          <div className="success-message">
            <span className="success-icon">✓</span> {successMessage}
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} onReset={handleReset} noValidate>
        <div className="form-fields">
          {fields.map((field) => (
            <div
              key={field.name}
              className={`form-field ${
                field.type === 'checkbox' ? 'form-field-checkbox' : ''
              } ${touched[field.name] && errors[field.name] ? 'has-error' : ''}`}
            >
              <label htmlFor={field.name} className="field-label">
                {field.label}
                {field.required && <span className="required-indicator">*</span>}
              </label>
              
              <div className="field-input">
                {renderField(field)}
                
                {/* Field error message */}
                {touched[field.name] && errors[field.name] && (
                  <div className="field-error">{errors[field.name]}</div>
                )}
                
                {/* Help text */}
                {field.helpText && (
                  <div className="field-help-text">{field.helpText}</div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : submitText}
          </button>
          
          <button
            type="reset"
            className="btn btn-secondary reset-button"
            onClick={handleReset}
          >
            Reset
          </button>
        </div>
      </form>
      
      {children}
    </div>
  );
};

export default FormComponent;

/**
 * SearchForm - A simplified form for search operations
 * 
 * @example
 * ```tsx
 * <SearchForm
 *   onSearch={handleSearch}
 *   fields={[
 *     { name: 'query', label: 'Search', placeholder: 'Search by name...' },
 *     { name: 'type', label: 'Type', type: 'select', options: typeOptions }
 *   ]}
 * />
 * ```
 */
export const SearchForm: React.FC<{
  /** Form fields configuration */
  fields: FieldConfig[];
  /** Callback for search submission */
  onSearch: (values: Record<string, any>) => void;
  /** Initial search values */
  initialValues?: Record<string, any>;
  /** Search button text */
  searchText?: string;
  /** Custom class name */
  className?: string;
}> = ({
  fields,
  onSearch,
  initialValues = {},
  searchText = 'Search',
  className = ''
}) => {
  const [searchValues, setSearchValues] = useState<Record<string, any>>(initialValues);
  
  // Handle input change
  const handleChange = (name: string, value: any) => {
    setSearchValues(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchValues);
  };
  
  // Handle form reset
  const handleReset = () => {
    setSearchValues(initialValues);
    onSearch(initialValues);
  };
  
  const formClasses = ['search-form', className].filter(Boolean).join(' ');
  
  return (
    <div className={formClasses}>
      <form onSubmit={handleSubmit} onReset={handleReset}>
        <div className="search-fields">
          {fields.map((field) => (
            <div key={field.name} className="search-field">
              {field.label && (
                <label htmlFor={field.name}>{field.label}</label>
              )}
              
              {field.type === 'select' ? (
                <select
                  id={field.name}
                  name={field.name}
                  value={searchValues[field.name] || ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  {...field.inputProps}
                >
                  <option value="">All</option>
                  {field.options?.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type || 'text'}
                  id={field.name}
                  name={field.name}
                  value={searchValues[field.name] || ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  {...field.inputProps}
                />
              )}
            </div>
          ))}
        </div>
        
        <div className="search-actions">
          <button type="submit" className="btn btn-primary search-button">
            {searchText}
          </button>
          <button 
            type="reset" 
            className="btn btn-secondary clear-button"
            onClick={handleReset}
          >
            Clear
          </button>
        </div>
      </form>
    </div>
  );
};

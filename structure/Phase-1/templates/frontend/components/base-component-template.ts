import React, { useState, useEffect } from 'react';

/**
 * Props for the BaseComponent
 */
interface BaseComponentProps {
  /** The title to display */
  title?: string;
  /** Optional description */
  description?: string;
  /** Optional className for custom styling */
  className?: string;
  /** Whether to show loading state */
  loading?: boolean;
  /** Error message to display if there is an error */
  error?: string;
  /** Children elements */
  children?: React.ReactNode;
  /** Optional callback when component is mounted */
  onMount?: () => void;
  /** Optional callback when component will unmount */
  onUnmount?: () => void;
}

/**
 * BaseComponent - A template for creating consistent React components
 * 
 * This component handles common functionalities like loading states,
 * error displays, and lifecycle management.
 * 
 * @example
 * ```tsx
 * <BaseComponent
 *   title="My Component"
 *   description="This is a description"
 *   loading={isLoading}
 *   error={errorMessage}
 * >
 *   <div>Content goes here</div>
 * </BaseComponent>
 * ```
 */
const BaseComponent: React.FC<BaseComponentProps> = ({
  title,
  description,
  className = '',
  loading = false,
  error,
  children,
  onMount,
  onUnmount
}) => {
  // Track if component is mounted to prevent state updates after unmounting
  const [isMounted, setIsMounted] = useState(false);

  // Handle component mount/unmount lifecycle
  useEffect(() => {
    setIsMounted(true);
    
    // Call onMount callback if provided
    if (onMount) {
      onMount();
    }
    
    // Cleanup on unmount
    return () => {
      setIsMounted(false);
      
      // Call onUnmount callback if provided
      if (onUnmount) {
        onUnmount();
      }
    };
  }, [onMount, onUnmount]);

  // Combine classes
  const containerClasses = ['base-component', className].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      {/* Header section */}
      {(title || description) && (
        <div className="base-component-header">
          {title && <h2 className="base-component-title">{title}</h2>}
          {description && <p className="base-component-description">{description}</p>}
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="base-component-error">
          <div className="error-message">
            <span className="error-icon">⚠️</span> {error}
          </div>
        </div>
      )}
      
      {/* Loading state */}
      {loading ? (
        <div className="base-component-loading">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      ) : (
        /* Content section */
        <div className="base-component-content">
          {children}
        </div>
      )}
    </div>
  );
};

export default BaseComponent;

// You can also create variations for different component types

/**
 * Card component built on top of BaseComponent
 */
export const Card: React.FC<BaseComponentProps & {
  /** Optional card footer content */
  footer?: React.ReactNode;
  /** Optional actions for the card */
  actions?: React.ReactNode;
}> = ({ 
  footer,
  actions,
  className = '',
  ...baseProps 
}) => {
  // Combine classes
  const cardClasses = ['card', className].filter(Boolean).join(' ');

  return (
    <BaseComponent className={cardClasses} {...baseProps}>
      {baseProps.children}
      
      {(actions || footer) && (
        <div className="card-footer">
          {footer && <div className="card-footer-content">{footer}</div>}
          {actions && <div className="card-actions">{actions}</div>}
        </div>
      )}
    </BaseComponent>
  );
};

/**
 * Panel component built on top of BaseComponent
 */
export const Panel: React.FC<BaseComponentProps & {
  /** Whether the panel is collapsible */
  collapsible?: boolean;
  /** Default collapsed state (if collapsible) */
  defaultCollapsed?: boolean;
}> = ({
  collapsible = false,
  defaultCollapsed = false,
  className = '',
  ...baseProps
}) => {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  
  // Toggle collapsed state
  const toggleCollapse = () => {
    setCollapsed(prev => !prev);
  };
  
  // Combine classes
  const panelClasses = [
    'panel', 
    className,
    collapsed ? 'panel-collapsed' : ''
  ].filter(Boolean).join(' ');

  return (
    <BaseComponent className={panelClasses} {...baseProps}>
      {collapsible && (
        <button
          className="panel-collapse-toggle"
          onClick={toggleCollapse}
          aria-expanded={!collapsed}
        >
          {collapsed ? '▼ Expand' : '▲ Collapse'}
        </button>
      )}
      
      {!collapsed && baseProps.children}
    </BaseComponent>
  );
};

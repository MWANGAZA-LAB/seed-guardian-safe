// Secure content component to prevent XSS attacks
import React from 'react';
import { InputSanitizer } from '@/lib/security';

interface SecureContentProps {
  content: string;
  allowHtml?: boolean;
  allowedTags?: string[];
  allowedAttributes?: string[];
  className?: string;
  children?: React.ReactNode;
}

export const SecureContent: React.FC<SecureContentProps> = ({
  content,
  allowHtml = false,
  allowedTags = [],
  allowedAttributes = [],
  className,
  children
}) => {
  const [sanitizedContent, setSanitizedContent] = React.useState<string>('');
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const sanitizeContent = async () => {
      setIsLoading(true);
      try {
        if (allowHtml) {
          const result = await InputSanitizer.sanitizeHtml(content, {
            allowedTags,
            allowedAttributes
          });
          setSanitizedContent(result);
        } else {
          const result = InputSanitizer.sanitizeString(content);
          setSanitizedContent(result);
        }
      } catch (error) {
        // Fallback to string sanitization if HTML sanitization fails
        setSanitizedContent(InputSanitizer.sanitizeString(content));
      } finally {
        setIsLoading(false);
      }
    };

    sanitizeContent();
  }, [content, allowHtml, allowedTags, allowedAttributes]);

  if (isLoading) {
    return (
      <div className={className}>
        {children}
      </div>
    );
  }

  if (allowHtml) {
    return (
      <div 
        className={className}
        dangerouslySetInnerHTML={{ __html: sanitizedContent }}
      >
        {children}
      </div>
    );
  }

  return (
    <div className={className}>
      {sanitizedContent}
      {children}
    </div>
  );
};

// Secure input component
interface SecureInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onValueChange?: (value: string) => void;
  sanitizeOnBlur?: boolean;
}

export const SecureInput: React.FC<SecureInputProps> = ({
  onValueChange,
  sanitizeOnBlur = true,
  onChange,
  onBlur,
  ...props
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitizedValue = InputSanitizer.sanitizeString(e.target.value);
    e.target.value = sanitizedValue;
    
    if (onChange) {
      onChange(e);
    }
    
    if (onValueChange) {
      onValueChange(sanitizedValue);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (sanitizeOnBlur) {
      const sanitizedValue = InputSanitizer.sanitizeString(e.target.value);
      e.target.value = sanitizedValue;
    }
    
    if (onBlur) {
      onBlur(e);
    }
  };

  return (
    <input
      {...props}
      onChange={handleChange}
      onBlur={handleBlur}
    />
  );
};

// Secure textarea component
interface SecureTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  onValueChange?: (value: string) => void;
  sanitizeOnBlur?: boolean;
}

export const SecureTextarea: React.FC<SecureTextareaProps> = ({
  onValueChange,
  sanitizeOnBlur = true,
  onChange,
  onBlur,
  ...props
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const sanitizedValue = InputSanitizer.sanitizeString(e.target.value);
    e.target.value = sanitizedValue;
    
    if (onChange) {
      onChange(e);
    }
    
    if (onValueChange) {
      onValueChange(sanitizedValue);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    if (sanitizeOnBlur) {
      const sanitizedValue = InputSanitizer.sanitizeString(e.target.value);
      e.target.value = sanitizedValue;
    }
    
    if (onBlur) {
      onBlur(e);
    }
  };

  return (
    <textarea
      {...props}
      onChange={handleChange}
      onBlur={handleBlur}
    />
  );
};

// Secure form component
interface SecureFormProps extends Omit<React.FormHTMLAttributes<HTMLFormElement>, 'onSubmit'> {
  onSubmit?: (data: FormData) => void;
  children: React.ReactNode;
}

export const SecureForm: React.FC<SecureFormProps> = ({
  onSubmit,
  children,
  ...props
}) => {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (onSubmit) {
      const formData = new FormData(e.currentTarget);
      
      // Sanitize all form data
      const sanitizedData = new FormData();
      for (const [key, value] of formData.entries()) {
        if (typeof value === 'string') {
          sanitizedData.append(key, InputSanitizer.sanitizeString(value));
        } else {
          sanitizedData.append(key, value);
        }
      }
      
      onSubmit(sanitizedData);
    }
  };

  return (
    <form {...props} onSubmit={handleSubmit}>
      {children}
    </form>
  );
};

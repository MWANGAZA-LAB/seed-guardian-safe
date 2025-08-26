import React from 'react';
import { render, screen } from '@testing-library/react';
import { SecureContent, SecureInput, SecureTextarea, SecureForm } from '@/components/SecureContent';

describe('SecureContent', () => {
  describe('XSS Protection', () => {
    it('should sanitize malicious content by default', () => {
      const maliciousContent = '<script>alert("xss")</script>Hello World';
      
      render(<SecureContent content={maliciousContent} />);
      
      expect(screen.getByText('Hello World')).toBeInTheDocument();
      expect(screen.queryByText('<script>alert("xss")</script>')).not.toBeInTheDocument();
    });

    it('should allow safe HTML when configured', () => {
      const safeHtml = '<p>Hello <strong>World</strong></p>';
      
      render(
        <SecureContent 
          content={safeHtml} 
          allowHtml={true}
          allowedTags={['p', 'strong']}
        />
      );
      
      expect(screen.getByText('Hello')).toBeInTheDocument();
      expect(screen.getByText('World')).toBeInTheDocument();
    });

    it('should block malicious HTML even when HTML is allowed', () => {
      const maliciousHtml = '<p>Hello <script>alert("xss")</script>World</p>';
      
      render(
        <SecureContent 
          content={maliciousHtml} 
          allowHtml={true}
          allowedTags={['p', 'strong']}
        />
      );
      
      expect(screen.getByText('Hello')).toBeInTheDocument();
      expect(screen.getByText('World')).toBeInTheDocument();
      expect(screen.queryByText('<script>alert("xss")</script>')).not.toBeInTheDocument();
    });

    it('should handle javascript: URLs', () => {
      const maliciousContent = 'javascript:alert("xss")';
      
      render(<SecureContent content={maliciousContent} />);
      
      expect(screen.getByText('alert("xss")')).toBeInTheDocument();
      expect(screen.queryByText('javascript:')).not.toBeInTheDocument();
    });

    it('should handle event handlers', () => {
      const maliciousContent = 'onclick="alert(\'xss\')" onerror="alert(\'xss\')"';
      
      render(<SecureContent content={maliciousContent} />);
      
      expect(screen.getByText('alert(\'xss\')')).toBeInTheDocument();
      expect(screen.queryByText('onclick=')).not.toBeInTheDocument();
      expect(screen.queryByText('onerror=')).not.toBeInTheDocument();
    });
  });

  describe('Content Rendering', () => {
    it('should render plain text content', () => {
      const content = 'Hello World';
      
      render(<SecureContent content={content} />);
      
      expect(screen.getByText('Hello World')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const content = 'Hello World';
      const className = 'custom-class';
      
      render(<SecureContent content={content} className={className} />);
      
      const element = screen.getByText('Hello World');
      expect(element.parentElement).toHaveClass(className);
    });

    it('should render children when provided', () => {
      const content = 'Hello World';
      
      render(
        <SecureContent content={content}>
          <span data-testid="child">Child Content</span>
        </SecureContent>
      );
      
      expect(screen.getByText('Hello World')).toBeInTheDocument();
      expect(screen.getByTestId('child')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty content', () => {
      render(<SecureContent content="" />);
      
      const container = screen.getByText('').parentElement;
      expect(container).toBeInTheDocument();
    });

    it('should handle very long content', () => {
      const longContent = 'a'.repeat(10000);
      
      render(<SecureContent content={longContent} />);
      
      expect(screen.getByText(longContent)).toBeInTheDocument();
    });

    it('should handle unicode content', () => {
      const unicodeContent = 'Hello 世界 🌍';
      
      render(<SecureContent content={unicodeContent} />);
      
      expect(screen.getByText('Hello 世界 🌍')).toBeInTheDocument();
    });
  });
});

describe('SecureInput', () => {
  describe('Input Sanitization', () => {
    it('should sanitize malicious input on change', () => {
      const handleChange = jest.fn();
      
      render(<SecureInput onChange={handleChange} data-testid="input" />);
      
      const input = screen.getByTestId('input');
      const maliciousValue = '<script>alert("xss")</script>';
      
      // Simulate user typing
      input.setAttribute('value', maliciousValue);
      input.dispatchEvent(new Event('change', { bubbles: true }));
      
      expect(handleChange).toHaveBeenCalled();
      expect(input.value).not.toContain('<script>');
    });

    it('should sanitize input on blur', () => {
      const handleBlur = jest.fn();
      
      render(<SecureInput onBlur={handleBlur} data-testid="input" />);
      
      const input = screen.getByTestId('input');
      const maliciousValue = 'javascript:alert("xss")';
      
      // Set value and trigger blur
      input.setAttribute('value', maliciousValue);
      input.dispatchEvent(new Event('blur', { bubbles: true }));
      
      expect(handleBlur).toHaveBeenCalled();
      expect(input.value).not.toContain('javascript:');
    });

    it('should call onValueChange with sanitized value', () => {
      const handleValueChange = jest.fn();
      
      render(<SecureInput onValueChange={handleValueChange} data-testid="input" />);
      
      const input = screen.getByTestId('input');
      const maliciousValue = 'onclick="alert(\'xss\')"';
      
      // Simulate user typing
      input.setAttribute('value', maliciousValue);
      input.dispatchEvent(new Event('change', { bubbles: true }));
      
      expect(handleValueChange).toHaveBeenCalledWith('alert(\'xss\')"');
    });
  });

  describe('Props Handling', () => {
    it('should pass through standard input props', () => {
      render(
        <SecureInput 
          type="email"
          placeholder="Enter email"
          required
          data-testid="input"
        />
      );
      
      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('type', 'email');
      expect(input).toHaveAttribute('placeholder', 'Enter email');
      expect(input).toHaveAttribute('required');
    });

    it('should disable sanitization on blur when configured', () => {
      const handleBlur = jest.fn();
      
      render(
        <SecureInput 
          onBlur={handleBlur} 
          sanitizeOnBlur={false}
          data-testid="input" 
        />
      );
      
      const input = screen.getByTestId('input');
      const originalValue = '<script>alert("xss")</script>';
      
      // Set value and trigger blur
      input.setAttribute('value', originalValue);
      input.dispatchEvent(new Event('blur', { bubbles: true }));
      
      expect(handleBlur).toHaveBeenCalled();
      // Value should remain unchanged since sanitization is disabled
      expect(input.value).toBe(originalValue);
    });
  });
});

describe('SecureTextarea', () => {
  describe('Textarea Sanitization', () => {
    it('should sanitize malicious content in textarea', () => {
      const handleChange = jest.fn();
      
      render(<SecureTextarea onChange={handleChange} data-testid="textarea" />);
      
      const textarea = screen.getByTestId('textarea');
      const maliciousValue = '<iframe src="javascript:alert(\'xss\')"></iframe>';
      
      // Simulate user typing
      textarea.setAttribute('value', maliciousValue);
      textarea.dispatchEvent(new Event('change', { bubbles: true }));
      
      expect(handleChange).toHaveBeenCalled();
      expect(textarea.value).not.toContain('<iframe>');
      expect(textarea.value).not.toContain('javascript:');
    });

    it('should handle multiline content', () => {
      const handleValueChange = jest.fn();
      
      render(<SecureTextarea onValueChange={handleValueChange} data-testid="textarea" />);
      
      const textarea = screen.getByTestId('textarea');
      const multilineContent = 'Line 1\nLine 2\nLine 3';
      
      // Simulate user typing
      textarea.setAttribute('value', multilineContent);
      textarea.dispatchEvent(new Event('change', { bubbles: true }));
      
      expect(handleValueChange).toHaveBeenCalledWith(multilineContent);
    });
  });

  describe('Props Handling', () => {
    it('should pass through standard textarea props', () => {
      render(
        <SecureTextarea 
          rows={5}
          cols={50}
          placeholder="Enter text"
          data-testid="textarea"
        />
      );
      
      const textarea = screen.getByTestId('textarea');
      expect(textarea).toHaveAttribute('rows', '5');
      expect(textarea).toHaveAttribute('cols', '50');
      expect(textarea).toHaveAttribute('placeholder', 'Enter text');
    });
  });
});

describe('SecureForm', () => {
  describe('Form Submission', () => {
    it('should sanitize form data on submission', () => {
      const handleSubmit = jest.fn();
      
      render(
        <SecureForm onSubmit={handleSubmit}>
          <input name="name" defaultValue="<script>alert('xss')</script>John" />
          <input name="email" defaultValue="john@example.com" />
          <button type="submit">Submit</button>
        </SecureForm>
      );
      
      const submitButton = screen.getByText('Submit');
      submitButton.click();
      
      expect(handleSubmit).toHaveBeenCalled();
      const formData = handleSubmit.mock.calls[0][0];
      
      // Check that malicious content is sanitized
      expect(formData.get('name')).toBe('alert(\'xss\')John');
      expect(formData.get('email')).toBe('john@example.com');
    });

    it('should handle multiple form fields', () => {
      const handleSubmit = jest.fn();
      
      render(
        <SecureForm onSubmit={handleSubmit}>
          <input name="firstName" defaultValue="John" />
          <input name="lastName" defaultValue="Doe" />
          <textarea name="message" defaultValue="Hello World" />
          <button type="submit">Submit</button>
        </SecureForm>
      );
      
      const submitButton = screen.getByText('Submit');
      submitButton.click();
      
      expect(handleSubmit).toHaveBeenCalled();
      const formData = handleSubmit.mock.calls[0][0];
      
      expect(formData.get('firstName')).toBe('John');
      expect(formData.get('lastName')).toBe('Doe');
      expect(formData.get('message')).toBe('Hello World');
    });

    it('should handle file inputs without sanitization', () => {
      const handleSubmit = jest.fn();
      
      render(
        <SecureForm onSubmit={handleSubmit}>
          <input name="file" type="file" />
          <button type="submit">Submit</button>
        </SecureForm>
      );
      
      const submitButton = screen.getByText('Submit');
      submitButton.click();
      
      expect(handleSubmit).toHaveBeenCalled();
      const formData = handleSubmit.mock.calls[0][0];
      
      // File inputs should not be sanitized
      expect(formData.get('file')).toBeDefined();
    });
  });

  describe('Props Handling', () => {
    it('should pass through standard form props', () => {
      render(
        <SecureForm method="POST" action="/submit" data-testid="form">
          <button type="submit">Submit</button>
        </SecureForm>
      );
      
      const form = screen.getByTestId('form');
      expect(form).toHaveAttribute('method', 'POST');
      expect(form).toHaveAttribute('action', '/submit');
    });

    it('should prevent default form submission', () => {
      const handleSubmit = jest.fn();
      
      render(
        <SecureForm onSubmit={handleSubmit}>
          <button type="submit">Submit</button>
        </SecureForm>
      );
      
      const form = screen.getByRole('button').closest('form');
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      
      form?.dispatchEvent(submitEvent);
      
      expect(handleSubmit).toHaveBeenCalled();
      expect(submitEvent.defaultPrevented).toBe(true);
    });
  });
});

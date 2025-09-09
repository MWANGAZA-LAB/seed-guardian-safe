// Environment utility that works in both browser and Node.js
// Check if we're in a test environment first
const isTestEnvironment = typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'test';

export const getEnvVar = (key: string, defaultValue?: string): string => {
  // In test environment, use process.env
  if (isTestEnvironment) {
    return process.env[key] || defaultValue || '';
  }
  
  // In browser (Vite) environment, use import.meta.env
  // Use dynamic import to avoid TypeScript errors in Jest
  try {
    // @ts-expect-error - import.meta is available in Vite but not in Jest
    const importMeta = (globalThis as { import?: { meta?: { env?: Record<string, string> } } }).import?.meta;
    if (importMeta && importMeta.env) {
      return importMeta.env[key] || defaultValue || '';
    }
  } catch (e) {
    // Fall through to process.env
  }
  
  // Fallback to process.env
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || defaultValue || '';
  }
  
  return defaultValue || '';
};

export const isDevelopment = (): boolean => {
  // In test environment
  if (isTestEnvironment) {
    return true;
  }
  
  // In browser (Vite) environment
  try {
    // @ts-expect-error - import.meta is available in Vite but not in Jest
    const importMeta = (globalThis as { import?: { meta?: { env?: { DEV?: boolean } } } }).import?.meta;
    if (importMeta && importMeta.env) {
      return importMeta.env.DEV || false;
    }
  } catch (e) {
    // Fall through to process.env
  }
  
  // Fallback to process.env
  if (typeof process !== 'undefined' && process.env) {
    return process.env.NODE_ENV === 'development';
  }
  
  return false;
};

export const isProduction = (): boolean => {
  // In test environment
  if (isTestEnvironment) {
    return false;
  }
  
  // In browser (Vite) environment
  try {
    // @ts-expect-error - import.meta is available in Vite but not in Jest
    const importMeta = (globalThis as { import?: { meta?: { env?: { PROD?: boolean } } } }).import?.meta;
    if (importMeta && importMeta.env) {
      return importMeta.env.PROD || false;
    }
  } catch (e) {
    // Fall through to process.env
  }
  
  // Fallback to process.env
  if (typeof process !== 'undefined' && process.env) {
    return process.env.NODE_ENV === 'production';
  }
  
  return false;
};

export const getMode = (): string => {
  // In test environment
  if (isTestEnvironment) {
    return 'test';
  }
  
  // In browser (Vite) environment
  try {
    // @ts-expect-error - import.meta is available in Vite but not in Jest
    const importMeta = (globalThis as { import?: { meta?: { env?: { MODE?: string } } } }).import?.meta;
    if (importMeta && importMeta.env) {
      return importMeta.env.MODE || 'development';
    }
  } catch (e) {
    // Fall through to process.env
  }
  
  // Fallback to process.env
  if (typeof process !== 'undefined' && process.env) {
    return process.env.NODE_ENV || 'development';
  }
  
  return 'development';
};

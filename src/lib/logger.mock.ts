// Mock logger for Jest tests
export const logger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  isDevelopment: true
};

export default logger;

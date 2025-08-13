import { Alert } from 'react-native';

export interface ErrorInfo {
  message: string;
  code?: string;
  details?: any;
}

export class AppError extends Error {
  code?: string;
  details?: any;

  constructor(message: string, code?: string, details?: any) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.details = details;
  }
}

export const ErrorCodes = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  PDF_GENERATION_ERROR: 'PDF_GENERATION_ERROR',
  IMAGE_LOAD_ERROR: 'IMAGE_LOAD_ERROR',
  STORAGE_ERROR: 'STORAGE_ERROR',
  PERMISSION_ERROR: 'PERMISSION_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export const ErrorMessages = {
  [ErrorCodes.NETWORK_ERROR]: 'Network connection failed. Please check your internet connection and try again.',
  [ErrorCodes.VALIDATION_ERROR]: 'Please check your input and try again.',
  [ErrorCodes.PDF_GENERATION_ERROR]: 'Failed to generate PDF. Please try again.',
  [ErrorCodes.IMAGE_LOAD_ERROR]: 'Failed to load image.',
  [ErrorCodes.STORAGE_ERROR]: 'Failed to save data. Please try again.',
  [ErrorCodes.PERMISSION_ERROR]: 'Permission denied. Please check app permissions.',
  [ErrorCodes.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.',
} as const;

export const handleError = (error: unknown, context?: string): AppError => {
  console.error(`Error in ${context || 'unknown context'}:`, error);

  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    // Try to categorize the error based on the message
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('connection') || message.includes('fetch')) {
      return new AppError(ErrorMessages.NETWORK_ERROR, ErrorCodes.NETWORK_ERROR, error);
    }
    
    if (message.includes('permission') || message.includes('denied')) {
      return new AppError(ErrorMessages.PERMISSION_ERROR, ErrorCodes.PERMISSION_ERROR, error);
    }
    
    if (message.includes('pdf') || message.includes('document')) {
      return new AppError(ErrorMessages.PDF_GENERATION_ERROR, ErrorCodes.PDF_GENERATION_ERROR, error);
    }
    
    return new AppError(error.message, ErrorCodes.UNKNOWN_ERROR, error);
  }

  return new AppError(ErrorMessages.UNKNOWN_ERROR, ErrorCodes.UNKNOWN_ERROR, error);
};

export const showErrorAlert = (
  error: unknown, 
  context?: string,
  onRetry?: () => void
): void => {
  const appError = handleError(error, context);
  
  const buttons = [
    { text: 'OK', style: 'default' as const }
  ];
  
  if (onRetry) {
    buttons.unshift({ text: 'Retry', onPress: onRetry });
  }

  Alert.alert(
    'Error',
    appError.message,
    buttons
  );
};

export const logError = (error: unknown, context?: string, additionalInfo?: any): void => {
  const appError = handleError(error, context);
  
  const logData = {
    timestamp: new Date().toISOString(),
    context,
    error: {
      name: appError.name,
      message: appError.message,
      code: appError.code,
      stack: appError.stack,
    },
    additionalInfo,
  };

  console.error('Error Log:', JSON.stringify(logData, null, 2));
  
  // In a production app, you would send this to your logging service
  // Example: crashlytics().recordError(appError);
  // Example: Sentry.captureException(appError, { extra: additionalInfo });
};

export const withErrorHandling = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context?: string
) => {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      const appError = handleError(error, context);
      logError(appError, context, { args });
      throw appError;
    }
  };
};

export const safeAsync = async <T>(
  promise: Promise<T>,
  fallback?: T
): Promise<T | undefined> => {
  try {
    return await promise;
  } catch (error) {
    console.warn('Safe async operation failed:', error);
    return fallback;
  }
};
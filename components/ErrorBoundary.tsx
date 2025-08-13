import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // In a production app, you might want to log this to a crash reporting service
    // like Crashlytics, Sentry, or Bugsnag
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
      }

      return <DefaultErrorFallback error={this.state.error} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}

const DefaultErrorFallback: React.FC<{ error?: Error; resetError: () => void }> = ({ 
  error, 
  resetError 
}) => {
  const handleReportError = () => {
    Alert.alert(
      'Report Error',
      'Would you like to report this error to help us improve the app?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Report', 
          onPress: () => {
            // In a real app, you would send the error to your logging service
            console.log('Error reported:', error?.message);
            Alert.alert('Thank you', 'Error report sent successfully.');
          }
        }
      ]
    );
  };

  return (
    <View className="flex-1 justify-center items-center bg-white px-6">
      <View className="items-center mb-8">
        <View className="w-20 h-20 bg-red-100 rounded-full justify-center items-center mb-4">
          <Ionicons name="alert-circle" size={40} color="#EF4444" />
        </View>
        
        <Text className="text-xl font-bold text-gray-800 text-center mb-2">
          Oops! Something went wrong
        </Text>
        
        <Text className="text-gray-600 text-center mb-6">
          We encountered an unexpected error. Please try again or contact support if the problem persists.
        </Text>

        {__DEV__ && error && (
          <View className="bg-gray-100 p-4 rounded-lg mb-6 w-full">
            <Text className="text-sm text-gray-700 font-mono">
              {error.message}
            </Text>
          </View>
        )}
      </View>

      <View className="w-full space-y-3">
        <TouchableOpacity
          className="bg-blue-600 rounded-2xl px-6 py-3 flex-row justify-center items-center"
          onPress={resetError}
        >
          <Ionicons name="refresh" size={20} color="#fff" />
          <Text className="text-white font-bold text-lg ml-2">Try Again</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-gray-200 rounded-2xl px-6 py-3 flex-row justify-center items-center"
          onPress={handleReportError}
        >
          <Ionicons name="bug" size={20} color="#374151" />
          <Text className="text-gray-700 font-bold text-lg ml-2">Report Error</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ErrorBoundary;
export { DefaultErrorFallback };

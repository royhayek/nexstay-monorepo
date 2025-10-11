import { Component, type ReactNode, type ErrorInfo } from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

// ----------------------------------------------------------------------

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

/**
 * Error Boundary for Dynamic Form components
 * Catches and handles errors gracefully within form components
 */
export class DynamicFormErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('DynamicForm Error:', error, errorInfo);
    
    this.setState({
      hasError: true,
      error,
      errorInfo,
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      if (fallback) {
        return fallback;
      }

      return (
        <Box sx={{ p: 3 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Form Error
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              {error?.message || 'An unexpected error occurred while rendering the form.'}
            </Typography>
            <Button 
              variant="outlined" 
              size="small" 
              onClick={this.handleRetry}
              sx={{ mt: 1 }}
            >
              Try Again
            </Button>
          </Alert>
        </Box>
      );
    }

    return children;
  }
}
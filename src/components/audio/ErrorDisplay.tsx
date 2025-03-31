
import React from 'react';
import { AlertTriangle, XCircle, Info } from 'lucide-react';

export interface ErrorDisplayProps {
  /**
   * The error message to display
   */
  error?: string | null;
  
  /**
   * Severity level of the error
   * - error: Critical errors that prevent operation
   * - warning: Important but non-critical issues
   * - info: Informational messages
   */
  severity?: 'error' | 'warning' | 'info';
  
  /**
   * Optional title for the error message
   */
  title?: string;
  
  /**
   * Optional class name for additional styling
   */
  className?: string;
  
  /**
   * Whether to show a retry button
   */
  showRetry?: boolean;
  
  /**
   * Callback function when retry button is clicked
   */
  onRetry?: () => void;
  
  /**
   * Whether to show a dismiss button
   */
  showDismiss?: boolean;
  
  /**
   * Callback function when dismiss button is clicked
   */
  onDismiss?: () => void;
  
  /**
   * Auto-dismissal timeout in milliseconds (if provided)
   */
  timeout?: number;
  
  /**
   * Whether the error is dismissable by timeout or dismiss button
   */
  dismissable?: boolean;
}

/**
 * Component for displaying error messages with appropriate styling
 */
const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  severity = 'error',
  title,
  className = '',
  showRetry = false,
  onRetry,
  showDismiss = false,
  onDismiss,
  timeout,
  dismissable = false,
}) => {
  // State to track if error has been dismissed
  const [dismissed, setDismissed] = React.useState(false);
  
  // Use useEffect to handle timeout-based dismissal
  React.useEffect(() => {
    if (timeout && error && dismissable && !dismissed) {
      const timer = setTimeout(() => setDismissed(true), timeout);
      return () => clearTimeout(timer);
    }
  }, [error, dismissed, timeout, dismissable]);
  
  // If no error or already dismissed, don't render anything
  if (!error || dismissed) return null;
  
  // Handle dismiss action
  const handleDismiss = () => {
    setDismissed(true);
    if (onDismiss) {
      onDismiss();
    }
  };
  
  // Determine icon, colors, and title based on severity
  const getIconAndColors = () => {
    switch (severity) {
      case 'error':
        return {
          icon: <XCircle className="h-5 w-5" />,
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
          iconColor: 'text-red-500',
          title: title || 'Error',
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="h-5 w-5" />,
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          textColor: 'text-amber-800',
          iconColor: 'text-amber-500',
          title: title || 'Warning',
        };
      case 'info':
        return {
          icon: <Info className="h-5 w-5" />,
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-800',
          iconColor: 'text-blue-500',
          title: title || 'Information',
        };
      default:
        return {
          icon: <XCircle className="h-5 w-5" />,
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
          iconColor: 'text-red-500',
          title: title || 'Error',
        };
    }
  };
  
  const { icon, bgColor, borderColor, textColor, iconColor, title: defaultTitle } = getIconAndColors();

  // Process the error message to provide helpful context
  let displayError = error;
  let additionalMessage = "";
  
  // Pattern matching for common error types (case-insensitive)
  const normalizedError = error.toLowerCase();
  
  if (normalizedError.includes("corrupt") || normalizedError.includes("unsupported data")) {
    additionalMessage = "Deepgram couldn't process this audio file. Please ensure your file is in a supported format like MP3, WAV, or FLAC and is not corrupted. You can try converting your file to a different format using a tool like FFmpeg or Audacity.";
  } else if (normalizedError.includes("invalid_auth") || normalizedError.includes("authentication failed") || normalizedError.includes("invalid api key")) {
    additionalMessage = "Your Deepgram API key appears to be invalid. Please check that you've entered the correct key and that it has sufficient permissions.";
  } else if (normalizedError.includes("insufficient_permissions")) {
    additionalMessage = "Your API key doesn't have the necessary permissions to use this feature. You might need to upgrade your Deepgram account or enable this feature in your Deepgram dashboard.";
  } else if (normalizedError.includes("exceeds") && normalizedError.includes("limit")) {
    additionalMessage = "The audio file exceeds Deepgram's size limits. Please reduce the file size or split the audio into smaller segments.";
  } else if (normalizedError.includes("failed to fetch") || normalizedError.includes("network")) {
    additionalMessage = "Couldn't connect to the Deepgram API. Please check your internet connection or try again later. If you're using the proxy server, ensure it's running correctly.";
  } else if (normalizedError.includes("cors") || normalizedError.includes("cross-origin")) {
    additionalMessage = "Your browser is blocking direct API calls to Deepgram due to CORS restrictions. Please use the proxy server included with this application to avoid this issue. See server/README.md for setup instructions.";
  } else if (normalizedError.includes("rate limit") || normalizedError.includes("429")) {
    additionalMessage = "You've hit Deepgram's rate limiting. Wait a few minutes before trying again, or reduce the frequency of your requests.";
  }
  
  // Log detailed error to console for debugging
  console.error("Error details:", {
    originalError: error,
    severity,
    timestamp: new Date().toISOString()
  });
  
  return (
    <div className={`${bgColor} ${borderColor} border rounded-md p-4 ${className}`}>
      <div className="flex">
        <div className={`flex-shrink-0 ${iconColor}`}>
          {icon}
        </div>
        <div className="ml-3 flex-1">
          <h3 className={`text-sm font-medium ${textColor}`}>{defaultTitle}</h3>
          <div className={`mt-2 text-sm ${textColor} whitespace-pre-wrap`}>
            <p>{displayError}</p>
            {additionalMessage && (
              <p className="mt-2 text-xs">{additionalMessage}</p>
            )}
          </div>
          
          {/* Render buttons if needed */}
          {(showRetry || (showDismiss || dismissable)) && (
            <div className="mt-4">
              <div className="-mx-2 -my-1.5 flex">
                {showRetry && (
                  <button
                    type="button"
                    onClick={onRetry}
                    className={`rounded-md px-2 py-1.5 text-sm font-medium ${textColor} hover:bg-${severity === 'error' ? 'red' : severity === 'warning' ? 'amber' : 'blue'}-100 focus:outline-none focus:ring-2 focus:ring-${severity === 'error' ? 'red' : severity === 'warning' ? 'amber' : 'blue'}-600 focus:ring-offset-2`}
                  >
                    Retry
                  </button>
                )}
                
                {(showDismiss || dismissable) && (
                  <button
                    type="button"
                    onClick={handleDismiss}
                    className="ml-2 rounded-md bg-transparent px-2 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2"
                  >
                    Dismiss
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorDisplay;


import React, { ErrorInfo, ReactNode } from 'react';
import { HolographicScanner } from './Loaders';

interface ErrorBoundaryProps {
  children?: ReactNode;
  componentName?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Uncaught error in ${this.props.componentName}:`, error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full min-h-[200px] flex flex-col items-center justify-center p-6 bg-brand-surface/50 border border-brand-accent/30 rounded-lg backdrop-blur-sm animate-fade-in">
          <div className="text-brand-accent font-orbitron text-xl mb-4 animate-pulse">
            SYSTEM FAILURE DETECTED
          </div>
          <div className="text-brand-text-muted text-center mb-6 max-w-md">
            Component <span className="text-white font-bold">{this.props.componentName || 'Unknown'}</span> encountered a critical error.
            <br />
            <span className="text-xs font-mono mt-2 block opacity-70">
              {this.state.error?.message}
            </span>
          </div>
          <HolographicScanner text="ATTEMPTING RECOVERY" />
          <button
            onClick={this.handleReset}
            className="mt-6 px-6 py-2 bg-brand-accent/20 hover:bg-brand-accent/40 border border-brand-accent text-brand-text font-orbitron text-sm rounded transition-all hover:shadow-[0_0_15px_rgba(225,29,72,0.4)]"
          >
            REBOOT MODULE
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

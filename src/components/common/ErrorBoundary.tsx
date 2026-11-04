import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { logErrorToFirestore } from '../../utils/analyticsTracker';

interface Props {
  children: ReactNode;
  fallbackRoute?: string;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMessage: '',
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message || 'An unexpected error occurred.' };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[React ErrorBoundary caught error]:', error, errorInfo);
    logErrorToFirestore(
      `[React Component Boundary] ${error.message}`,
      error.stack || errorInfo.componentStack || undefined,
      'error',
      this.props.fallbackRoute || window.location.pathname
    );
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="glass-panel rounded-3xl p-8 text-center max-w-lg mx-auto my-12 space-y-4 border border-rose-500/30">
          <div className="p-3.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 w-14 h-14 flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold font-display text-white">Something Went Wrong</h3>
          <p className="text-xs text-slate-400">{this.state.errorMessage}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs transition flex items-center gap-2 mx-auto cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reload Page</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

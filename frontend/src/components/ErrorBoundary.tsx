import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#F8F9FA',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: 'var(--font-sans)',
          color: '#111827'
        }}>
          <div style={{
            maxWidth: 480,
            width: '100%',
            backgroundColor: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: 6,
            padding: '24px',
            boxShadow: '0 4px 12px rgba(16, 24, 40, 0.08)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: 16
          }}>
            <div style={{
              width: 40,
              height: 40,
              backgroundColor: '#FEF2F2',
              color: '#DC2626',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
              border: '1px solid #FECACA'
            }}>
              <AlertTriangle size={20} />
            </div>
            
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: '#111827', margin: '0 0 4px 0' }}>
                Application Exception Encountered
              </h2>
              <p style={{ fontSize: 12, color: '#4B5563', margin: 0 }}>
                An unexpected UI rendering error occurred. The application state has been preserved safely.
              </p>
            </div>

            {this.state.error && (
              <div style={{
                padding: '10px',
                backgroundColor: '#F9FAFB',
                border: '1px solid #E5E7EB',
                borderRadius: 4,
                textAlign: 'left',
                fontSize: 11,
                fontFamily: 'var(--font-mono)',
                color: '#991B1B',
                overflowX: 'auto'
              }}>
                {this.state.error.toString()}
              </div>
            )}

            <button
              onClick={this.handleReload}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '8px 16px',
                backgroundColor: '#1D4ED8',
                color: '#FFFFFF',
                fontWeight: 500,
                fontSize: 12,
                borderRadius: 4,
                border: 'none',
                cursor: 'pointer',
                margin: '0 auto'
              }}
            >
              <RotateCw size={14} />
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

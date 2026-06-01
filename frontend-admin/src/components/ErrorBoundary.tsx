/**
 * ErrorBoundary.tsx — Boundary de errores para componentes React
 *
 * Atrapa errores de renderizado con getDerivedStateFromError.
 * Muestra un mensaje de error con el detalle y un botón "Reintentar"
 * que resetea el estado y vuelve a renderizar los hijos.
 */

import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="p-6 text-center">
          <p className="text-error font-semibold text-lg">
            Algo salió mal al cargar esta sección.
          </p>
          <p className="text-on-surface-variant text-sm mt-2">
            {this.state.error?.message || 'Error desconocido'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-4 px-4 py-2 bg-primary-container text-on-primary rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Reintentar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

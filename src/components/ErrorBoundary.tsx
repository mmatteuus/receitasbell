import { Component, type ErrorInfo, type PropsWithChildren } from "react";
import { AlertTriangle } from "lucide-react";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

type ErrorWithRequestId = Error & { requestId?: string };

export class ErrorBoundary extends Component<PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-7 w-7 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold">Algo deu errado</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Ocorreu um erro inesperado. Tente recarregar a página ou clique no botão abaixo.
          </p>
          <button
            onClick={this.handleReset}
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            Tentar novamente
          </button>
          {(() => {
            const requestId = (this.state.error as ErrorWithRequestId | null)?.requestId;
            if (!this.state.error || (!import.meta.env.DEV && !requestId)) {
              return null;
            }
            return (
            <div className="mt-4 flex flex-col gap-2">
              {requestId && (
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest opacity-60">
                  ID do Pedido: {requestId}
                </p>
              )}
              {import.meta.env.DEV && (
                <pre className="max-w-xl overflow-auto rounded-lg bg-muted p-4 text-left text-xs text-muted-foreground">
                  {this.state.error.message}
                </pre>
              )}
            </div>
          );
          })()}
        </div>
      );
    }

    return this.props.children;
  }
}

import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props { children: ReactNode; fallback?: ReactNode }
interface State { hasError: boolean; error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="flex flex-col items-center justify-center p-12 text-center gap-2" role="alert">
          <div className="text-[28px] text-red-400" aria-hidden="true">
            <i className="ti ti-alert-triangle" />
          </div>
          <div className="text-[15px] font-medium text-gray-700">Something went wrong</div>
          <p className="text-[13px] text-gray-400 max-w-xs">
            {this.state.error?.message ?? 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-2 px-4 py-2 text-[13px] border border-gray-300 rounded-lg bg-white text-gray-600 hover:bg-gray-50 cursor-pointer"
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

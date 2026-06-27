import { Component, type ReactNode, type ErrorInfo } from 'react'
import styles from './ErrorBoundary.module.css'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

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
        <div className={styles.error} role="alert">
          <div className={styles.icon} aria-hidden="true">
            <i className="ti ti-alert-triangle" />
          </div>
          <div className={styles.title}>Something went wrong</div>
          <p className={styles.desc}>
            {this.state.error?.message ?? 'An unexpected error occurred.'}
          </p>
          <button
            className={styles.retry}
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

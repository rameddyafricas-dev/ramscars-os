import { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
    this.setState({ errorInfo })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="card max-w-lg w-full p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Something went wrong</h1>
            <p className="text-gray-600 mb-4">
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>

            <details className="text-left mb-6 bg-gray-100 rounded-lg p-3">
              <summary className="text-sm font-medium text-gray-700 cursor-pointer">Error details</summary>
              <pre className="mt-3 text-xs text-gray-600 overflow-auto max-h-48 whitespace-pre-wrap">
                {this.state.error?.stack || 'No stack trace available'}
              </pre>
            </details>

            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700"
              >
                Try again
              </button>
              <button
                onClick={this.handleReload}
                className="flex-1 bg-gray-200 text-gray-800 px-5 py-2.5 rounded-xl hover:bg-gray-300"
              >
                Reload app
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary

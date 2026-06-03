import { Component, type ReactNode } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-100 p-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-modal p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-danger-light flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7 text-danger" />
            </div>
            <h1 className="text-xl font-bold text-neutral-900 mb-2">Đã xảy ra lỗi</h1>
            <p className="text-sm text-neutral-600 mb-6">
              Ứng dụng gặp sự cố không mong muốn. Vui lòng tải lại trang để thử lại.
            </p>
            {this.state.error && (
              <div className="mb-6 p-3 bg-neutral-50 rounded-md text-left">
                <p className="text-xs font-mono text-danger break-all">
                  {this.state.error.toString()}
                </p>
              </div>
            )}
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 h-10 px-5 bg-primary hover:bg-primary-hover text-white rounded-md font-medium transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Tải lại trang
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

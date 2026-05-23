import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center bg-gray-50">
          <p className="text-5xl">⚠️</p>
          <h1 className="text-lg font-semibold text-gray-800 mt-4">Something went wrong</h1>
          <p className="text-sm text-gray-500 mt-2">Please try refreshing the page.</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-primary text-white px-6 py-2.5 rounded-xl font-medium text-sm mt-6"
          >
            Refresh
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;

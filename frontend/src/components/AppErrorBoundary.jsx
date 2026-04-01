import React from 'react';

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App render error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <section className="mx-auto max-w-4xl p-10">
          <div className="rounded-[32px] border border-rose-200 bg-rose-50 p-8 shadow-soft">
            <h1 className="text-3xl font-semibold text-rose-950">Page Error</h1>
            <p className="mt-4 text-rose-900">
              The page hit a runtime error while rendering. Refresh the page after the latest restart. If this persists, the error details are shown below.
            </p>
            <pre className="mt-6 overflow-auto rounded-2xl bg-white p-4 text-sm text-rose-900">
              {String(this.state.error?.stack || this.state.error?.message || this.state.error || 'Unknown error')}
            </pre>
          </div>
        </section>
      );
    }

    return this.props.children;
  }
}

export default AppErrorBoundary;

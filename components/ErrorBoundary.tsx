"use client";

import React from "react";

type Props = { children: React.ReactNode };
type State = { hasError: boolean };

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: unknown) {
    // Log to console for now; production should send to an error tracking service
    console.error("ErrorBoundary caught an error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-black text-green-200">
          <div className="max-w-lg text-center">
            <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
            <p className="mb-4 text-sm text-gray-300">
              An unexpected error occurred. Try refreshing the page or come back
              later.
            </p>
            <div className="space-x-3">
              <a
                href="/"
                className="inline-block px-4 py-2 bg-green-700 text-white rounded"
              >
                Go home
              </a>
              <button
                onClick={() => location.reload()}
                className="inline-block px-4 py-2 bg-gray-800 text-white rounded"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

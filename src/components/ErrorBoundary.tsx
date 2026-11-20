import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || 'একটি অপ্রত্যাশিত সমস্যা হয়েছে।',
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Application ErrorBoundary:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#EDF4FF] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl border border-[#DDDDEF] shadow-lg p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#F5F3FF] text-[#663CBC] flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h1 className="text-lg font-extrabold text-[#081149]">
              দুঃখিত, একটি সমস্যা হয়েছে
            </h1>
            <p className="text-xs text-[#5E6484] leading-relaxed break-words">
              পেজটি পুনরায় লোড করে আবার চেষ্টা করুন।
            </p>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, message: '' });
                window.location.reload();
              }}
              className="ot-gradient-btn inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-xs font-bold cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>পুনরায় চেষ্টা করুন</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-red-50/50 rounded-3xl border border-red-100 m-8">
                    <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                        <AlertTriangle size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-red-900 mb-2">Bir Hata Oluştu</h2>
                    <p className="text-red-700 mb-6 max-w-md">
                        Sayfa yüklenirken beklenmedik bir sorun oluştu. Teknik ekip bilgilendirildi.
                    </p>

                    <div className="bg-white p-4 rounded-xl border border-red-100 text-left w-full max-w-lg overflow-auto mb-6 shadow-sm">
                        <p className="font-mono text-xs text-red-600 font-bold mb-2">{this.state.error?.toString()}</p>
                        <pre className="font-mono text-[10px] text-gray-500 whitespace-pre-wrap">
                            {this.state.errorInfo?.componentStack}
                        </pre>
                    </div>

                    <Button
                        onClick={() => window.location.reload()}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl"
                    >
                        Sayfayı Yenile
                    </Button>
                </div>
            );
        }

        return this.props.children;
    }
}

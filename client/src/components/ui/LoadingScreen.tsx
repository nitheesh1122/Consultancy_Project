import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingScreen: React.FC = () => {
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-canvas backdrop-blur-sm transition-opacity duration-500">
            <div className="relative flex flex-col items-center justify-center p-8">
                <div className="absolute inset-0 bg-brand-primary/10 rounded-full blur-[60px] animate-pulse" />
                <div className="relative z-10 flex flex-col items-center gap-5">
                    <h1 className="text-xl md:text-2xl font-bold text-primary text-center">
                        Golden <span className="text-brand-primary">Textile</span> Dyers
                    </h1>
                    <Loader2 className="h-8 w-8 text-brand-primary animate-spin" />
                </div>
            </div>
        </div>
    );
};

export default LoadingScreen;

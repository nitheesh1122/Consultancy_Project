import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingScreen: React.FC = () => {
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-canvas backdrop-blur-md transition-opacity duration-500">
            <div className="relative flex flex-col items-center justify-center p-8">
                {/* Outer Glow Effect */}
                <div className="absolute inset-0 bg-brand-primary/10 rounded-full blur-[80px] animate-pulse"></div>

                {/* Core Brand Text */}
                <div className="relative z-10 flex flex-col items-center gap-4 animate-pulse">
                    <h1 className="text-3xl md:text-4xl font-black tracking-widest text-primary font-display uppercase italic text-center">
                        GOLDEN <span className="text-brand-primary">TEXTILE</span> DYERS
                    </h1>
                </div>

                {/* Subtle Loading Space underneath */}
                <div className="mt-8 flex items-center justify-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-brand-primary animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-brand-primary/70 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-brand-primary/40 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
            </div>
        </div>
    );
};

export default LoadingScreen;

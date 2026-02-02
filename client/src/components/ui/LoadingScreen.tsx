import React from 'react';
import { motion } from 'framer-motion';

const LoadingScreen: React.FC = () => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50">
            <div className="text-center">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="mb-8"
                >
                    <h1 className="text-3xl font-bold text-slate-900 font-heading tracking-tight">
                        Golden Textile Dyers
                    </h1>
                    <p className="text-slate-500 text-sm font-medium tracking-wide mt-2 uppercase">
                        Operational Intelligence System
                    </p>
                </motion.div>

                <motion.div
                    className="h-1 w-48 bg-slate-200 mx-auto rounded-full overflow-hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                >
                    <motion.div
                        className="h-full bg-slate-800"
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 1.5, ease: "easeInOut", repeat: Infinity }}
                    />
                </motion.div>
            </div>
        </div>
    );
};

export default LoadingScreen;

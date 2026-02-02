import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../lib/api';
import { Lock, User, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/Button';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const { data } = await api.post('/auth/login', { username, password });
            login(data);
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-slate-200 to-transparent opacity-50"></div>
            </div>

            <div className="z-10 w-full max-w-md px-4">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold font-heading text-slate-900 tracking-tight">Golden Textile Dyers</h1>
                    <p className="text-slate-500 text-sm font-medium tracking-wide mt-2 uppercase">Operational Intelligence System</p>
                </div>

                <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200">
                    <h2 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
                        <span className="w-1 h-6 bg-slate-800 rounded-sm"></span>
                        Sign In
                    </h2>

                    {error && (
                        <div className="mb-6 p-4 rounded-md bg-rose-50 border border-rose-200 text-sm text-rose-700 font-medium">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1">
                            <label className="block text-sm font-bold text-slate-700">Username</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-slate-400 group-focus-within:text-slate-600 transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:bg-white transition-all text-sm font-medium"
                                    placeholder="Enter Employee ID"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="block text-sm font-bold text-slate-700">Password</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-slate-600 transition-colors" />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:bg-white transition-all text-sm font-medium"
                                    placeholder="Enter Password"
                                    required
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full mt-4 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3"
                            isLoading={isLoading}
                        >
                            {!isLoading && (
                                <span className="flex items-center">
                                    Access System <ArrowRight className="ml-2 h-4 w-4" />
                                </span>
                            )}
                        </Button>
                    </form>
                </div>

                <p className="text-center text-xs text-slate-400 mt-8">
                    &copy; {new Date().getFullYear()} Golden Textile Dyers. All rights reserved.
                </p>
            </div>
        </div>
    );
};

export default Login;

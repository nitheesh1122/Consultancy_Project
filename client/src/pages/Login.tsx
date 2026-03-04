import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../lib/api';
import { Lock, User, ArrowRight, Factory } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

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
        <div className="min-h-screen flex flex-col items-center justify-center bg-canvas weave-pattern transition-colors duration-300 relative overflow-hidden">
            <div className="z-10 w-full max-w-md px-4">
                <div className="text-center mb-8 flex flex-col items-center">
                    <div className="w-16 h-16 rounded-xl bg-brand-primary/10 flex items-center justify-center border border-brand-primary/20 mb-6 shrink-0 shadow-[0_0_15px_rgba(79,70,229,0.15)]">
                        <Factory className="w-8 h-8 text-brand-primary" />
                    </div>
                    <h1 className="text-3xl font-bold font-heading text-primary tracking-tight">Golden Textile Dyers</h1>
                    <p className="text-brand-primary text-sm font-semibold tracking-wider mt-2 uppercase font-mono">Operational Intelligence System</p>
                </div>

                <div className="bg-card p-8 rounded-xl shadow-2xl border border-subtle backdrop-blur-sm bg-card/90">
                    <h2 className="text-lg font-semibold text-primary mb-6 flex items-center gap-2">
                        <span className="w-1 h-6 bg-brand-primary rounded-sm"></span>
                        Secure Access
                    </h2>

                    {error && (
                        <div className="mb-6 p-4 rounded-md bg-status-critical/10 border border-status-critical/30 text-sm text-status-critical font-medium">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-primary">Employee ID</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-muted group-focus-within:text-brand-primary transition-colors" />
                                </div>
                                <Input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="pl-10 h-12 text-base"
                                    placeholder="Enter Employee ID"
                                    isMonospace
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-primary">Password</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-muted group-focus-within:text-brand-primary transition-colors" />
                                </div>
                                <Input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-10 h-12 text-base"
                                    placeholder="Enter your security token"
                                    isMonospace
                                    required
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            className="w-full mt-4 h-12 text-lg"
                            isLoading={isLoading}
                        >
                            {!isLoading && (
                                <span className="flex items-center">
                                    Access System <ArrowRight className="ml-2 h-5 w-5" />
                                </span>
                            )}
                        </Button>
                    </form>
                </div>

                <p className="text-center text-xs text-muted mt-8 font-mono">
                    &copy; {new Date().getFullYear()} Golden Textile Dyers. All rights reserved.
                </p>
            </div>
        </div>
    );
};

export default Login;

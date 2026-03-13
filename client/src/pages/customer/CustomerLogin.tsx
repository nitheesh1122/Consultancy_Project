import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../lib/api';
import { Lock, User, ArrowRight, Factory } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

const CustomerLogin = () => {
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
            if (data.role !== 'CUSTOMER') {
                setError('This login is for customers only');
                return;
            }
            login(data);
            navigate('/customer/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-canvas relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-transparent pointer-events-none" />
            <div className="z-10 w-full max-w-md px-4">
                <div className="text-center mb-8 flex flex-col items-center">
                    <div className="w-16 h-16 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm mb-6 shrink-0">
                        <Factory className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold font-heading text-primary tracking-tight">Customer Portal</h1>
                    <p className="text-blue-600 text-sm font-semibold tracking-wider mt-2 uppercase font-mono">Golden Textile Dyers</p>
                </div>

                <div className="bg-card p-8 rounded-lg border border-subtle shadow-md">
                    <h2 className="text-lg font-semibold text-primary mb-6 flex items-center gap-2">
                        <span className="w-1 h-5 bg-blue-600 rounded-full" />
                        Customer Login
                    </h2>

                    {error && (
                        <div className="mb-6 p-4 rounded-lg bg-status-danger/10 border border-status-danger/30 text-sm text-status-danger font-medium">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-primary">Username</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-muted group-focus-within:text-blue-600 transition-colors" />
                                </div>
                                <Input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                                    className="pl-10 h-11 text-base rounded-lg" placeholder="Enter username" isMonospace required />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-primary">Password</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-muted group-focus-within:text-blue-600 transition-colors" />
                                </div>
                                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                                    className="pl-10 h-11 text-base rounded-lg" placeholder="Enter password" isMonospace required />
                            </div>
                        </div>
                        <Button type="submit" variant="primary" className="w-full mt-4 h-11 rounded-lg" isLoading={isLoading}>
                            {!isLoading && (
                                <span className="flex items-center justify-center gap-2">
                                    Access Portal <ArrowRight className="h-5 w-5" />
                                </span>
                            )}
                        </Button>
                    </form>
                </div>
                <p className="text-center text-xs text-muted mt-8 font-mono">&copy; {new Date().getFullYear()} Golden Textile Dyers</p>
            </div>
        </div>
    );
};

export default CustomerLogin;

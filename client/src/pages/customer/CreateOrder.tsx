import React, { useState } from 'react';
import api from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ShoppingCart, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CreateOrder = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [form, setForm] = useState({
        fabricType: '',
        fabricGSM: '',
        color: '',
        shadeCode: '',
        quantity: '',
        deliveryDate: '',
        specialInstructions: '',
        pricePerKg: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await api.post('/customer/orders', {
                ...form,
                fabricGSM: form.fabricGSM ? Number(form.fabricGSM) : undefined,
                quantity: Number(form.quantity),
                pricePerKg: Number(form.pricePerKg),
            });
            toast.success('Order placed successfully!');
            navigate('/customer/dashboard');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to place order');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-4 border-b border-subtle pb-6">
                <button onClick={() => navigate('/customer/dashboard')} className="p-2 rounded-lg hover:bg-elevated transition-colors">
                    <ArrowLeft className="h-5 w-5 text-secondary" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold font-heading text-primary tracking-tight">Place New Order</h1>
                    <p className="text-secondary mt-1 text-sm">Submit a dyeing order</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-card rounded-xl border border-subtle shadow-sm p-8 max-w-3xl space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-primary">Fabric Type *</label>
                        <select name="fabricType" value={form.fabricType} onChange={handleChange} required
                            className="w-full h-11 px-3 rounded-lg border border-subtle bg-canvas text-primary text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary">
                            <option value="">Select fabric type</option>
                            <option value="COTTON">Cotton</option>
                            <option value="POLYESTER">Polyester</option>
                            <option value="SILK">Silk</option>
                            <option value="BLEND">Blend</option>
                            <option value="VISCOSE">Viscose</option>
                            <option value="NYLON">Nylon</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-primary">GSM</label>
                        <Input type="number" name="fabricGSM" value={form.fabricGSM} onChange={handleChange}
                            placeholder="e.g. 180" className="h-11" />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-primary">Color *</label>
                        <Input type="text" name="color" value={form.color} onChange={handleChange}
                            placeholder="e.g. Navy Blue" required className="h-11" />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-primary">Shade Code</label>
                        <Input type="text" name="shadeCode" value={form.shadeCode} onChange={handleChange}
                            placeholder="e.g. PAN-2847" className="h-11" />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-primary">Quantity (KG) *</label>
                        <Input type="number" name="quantity" value={form.quantity} onChange={handleChange}
                            placeholder="e.g. 500" required className="h-11" />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-primary">Price per KG (₹) *</label>
                        <Input type="number" name="pricePerKg" value={form.pricePerKg} onChange={handleChange}
                            placeholder="e.g. 120" required className="h-11" />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-primary">Delivery Date *</label>
                        <Input type="date" name="deliveryDate" value={form.deliveryDate} onChange={handleChange}
                            required className="h-11" />
                    </div>
                </div>

                {form.quantity && form.pricePerKg && (
                    <div className="p-4 bg-elevated rounded-lg border border-subtle">
                        <p className="text-sm text-secondary">
                            Total Order Value: <span className="text-xl font-bold text-brand-primary ml-2">₹{(Number(form.quantity) * Number(form.pricePerKg)).toLocaleString()}</span>
                        </p>
                    </div>
                )}

                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-primary">Special Instructions</label>
                    <textarea name="specialInstructions" value={form.specialInstructions} onChange={handleChange}
                        rows={3} placeholder="Any special requirements..." 
                        className="w-full px-3 py-2 rounded-lg border border-subtle bg-canvas text-primary text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary" />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => navigate('/customer/dashboard')}>Cancel</Button>
                    <Button type="submit" variant="primary" isLoading={isLoading}>
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Place Order
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default CreateOrder;

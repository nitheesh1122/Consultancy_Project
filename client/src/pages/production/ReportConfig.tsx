import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings as SettingsIcon, Save, Zap, Droplet, Flame, Mail, Target } from 'lucide-react';
import api from '../../lib/api';

const ReportConfig = () => {
 const queryClient = useQueryClient();
 const [msg, setMsg] = useState({ type: '', text: '' });

 const [formData, setFormData] = useState({
 targetYieldPercentage: 90,
 utilityRates: {
 powerPerKwh: 0,
 waterPerLiter: 0,
 steamPerKg: 0
 },
 dailyReportEmails: [] as string[],
 emailInput: ''
 });

 const { data: settings = null, isLoading } = useQuery({
 queryKey: ['settings'],
 queryFn: async () => {
 const res = await api.get('/settings');
 return res.data;
 }
 });

 useEffect(() => {
 if (settings) {
 setFormData({
 targetYieldPercentage: settings.targetYieldPercentage || 90,
 utilityRates: settings.utilityRates || { powerPerKwh: 0, waterPerLiter: 0, steamPerKg: 0 },
 dailyReportEmails: settings.dailyReportEmails || [],
 emailInput: ''
 });
 }
 }, [settings]);

 const updateMutation = useMutation({
 mutationFn: (payload: any) => api.put('/settings', payload),
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ['settings'] });
 setMsg({ type: 'success', text: 'Settings updated successfully!' });
 setTimeout(() => setMsg({ type: '', text: '' }), 3000);
 },
 onError: (err: any) => {
 setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to update settings' });
 }
 });

 const handleEmailAdd = () => {
 if (formData.emailInput && !formData.dailyReportEmails.includes(formData.emailInput)) {
 setFormData(prev => ({
 ...prev,
 dailyReportEmails: [...prev.dailyReportEmails, formData.emailInput.trim()],
 emailInput: ''
 }));
 }
 };

 const handleEmailRemove = (email: string) => {
 setFormData(prev => ({
 ...prev,
 dailyReportEmails: prev.dailyReportEmails.filter(e => e !== email)
 }));
 };

 const handleSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 updateMutation.mutate({
 targetYieldPercentage: Number(formData.targetYieldPercentage),
 utilityRates: {
 powerPerKwh: Number(formData.utilityRates.powerPerKwh),
 waterPerLiter: Number(formData.utilityRates.waterPerLiter),
 steamPerKg: Number(formData.utilityRates.steamPerKg)
 },
 dailyReportEmails: formData.dailyReportEmails
 });
 };

 if (isLoading) return <div className="p-8 text-center text-secondary">Loading Configuration...</div>;

 return (
 <div className="max-w-4xl mx-auto space-y-6">
 <div>
 <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
 <SettingsIcon className="h-6 w-6 text-primary" />
 Production Settings & Configuration
 </h2>
 <p className="text-secondary">Manage plant targets, utility costs, and automated reporting</p>
 </div>

 {msg.text && (
 <div className={`p-4 rounded-lg font-medium border ${msg.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-danger/10 text-red-700 border-danger/30'}`}>
 {msg.text}
 </div>
 )}

 <form onSubmit={handleSubmit} className="space-y-6">

 {/* Targets */}
 <div className="bg-surface p-6 rounded-xl shadow-sm border border-border">
 <h3 className="text-lg font-bold text-primary flex items-center gap-2 mb-4 border-b pb-2">
 <Target className="h-5 w-5 text-blue-500" /> Plant Yield Targets
 </h3>
 <div className="max-w-xs">
 <label className="block text-sm font-medium text-primary mb-2" htmlFor="target-yield">Target Yield (%)</label>
 <div className="relative">
 <input
 id="target-yield"
 type="number" step="0.1" min="0" max="100"
 value={formData.targetYieldPercentage}
 onChange={e => setFormData({ ...formData, targetYieldPercentage: Number(e.target.value) })}
 className="w-full border-border rounded-lg pr-8 focus:ring-primary focus:border-primary shadow-sm"
 aria-label="Target yield percentage"
 />
 <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
 <span className="text-secondary">%</span>
 </div>
 </div>
 <p className="mt-2 text-xs text-secondary">Batches falling below this target will be flagged in reports.</p>
 </div>
 </div>

 {/* Utility Rates */}
 <div className="bg-surface p-6 rounded-xl shadow-sm border border-border">
 <h3 className="text-lg font-bold text-primary flex items-center gap-2 mb-4 border-b pb-2">
 <Zap className="h-5 w-5 text-yellow-500" /> Standard Utility Cost Rates
 </h3>
 <p className="text-sm text-secondary mb-6">These baseline rates are used to estimate the daily operating cost of dyeing batches.</p>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 <div>
 <label className="flex items-center gap-1 text-sm font-medium text-primary mb-2" htmlFor="power-per-kwh">
 <Zap className="h-4 w-4 text-yellow-500" /> Power (per kWh)
 </label>
 <div className="flex items-center gap-2">
 <span className="text-secondary font-medium font-mono">₹</span>
 <input
 id="power-per-kwh"
 type="number" step="0.1" min="0"
 value={formData.utilityRates.powerPerKwh}
 onChange={e => setFormData({
 ...formData,
 utilityRates: { ...formData.utilityRates, powerPerKwh: Number(e.target.value) }
 })}
 className="w-full border-border rounded-lg focus:ring-primary focus:border-primary shadow-sm"
 aria-label="Power cost per kWh"
 />
 </div>
 </div>
 <div>
 <label className="flex items-center gap-1 text-sm font-medium text-primary mb-2" htmlFor="water-per-liter">
 <Droplet className="h-4 w-4 text-blue-500" /> Water (per L)
 </label>
 <div className="flex items-center gap-2">
 <span className="text-secondary font-medium font-mono">₹</span>
 <input
 id="water-per-liter"
 type="number" step="0.01" min="0"
 value={formData.utilityRates.waterPerLiter}
 onChange={e => setFormData({
 ...formData,
 utilityRates: { ...formData.utilityRates, waterPerLiter: Number(e.target.value) }
 })}
 className="w-full border-border rounded-lg focus:ring-primary focus:border-primary shadow-sm"
 aria-label="Water cost per liter"
 />
 </div>
 </div>
 <div>
 <label className="flex items-center gap-1 text-sm font-medium text-primary mb-2" htmlFor="steam-per-kg">
 <Flame className="h-4 w-4 text-orange-500" /> Steam (per Kg)
 </label>
 <div className="flex items-center gap-2">
 <span className="text-secondary font-medium font-mono">₹</span>
 <input
 id="steam-per-kg"
 type="number" step="0.1" min="0"
 value={formData.utilityRates.steamPerKg}
 onChange={e => setFormData({
 ...formData,
 utilityRates: { ...formData.utilityRates, steamPerKg: Number(e.target.value) }
 })}
 className="w-full border-border rounded-lg focus:ring-primary focus:border-primary shadow-sm"
 aria-label="Steam cost per kg"
 />
 </div>
 </div>
 </div>
 </div>

 {/* Email Reporting */}
 <div className="bg-surface p-6 rounded-xl shadow-sm border border-border">
 <h3 className="text-lg font-bold text-primary flex items-center gap-2 mb-4 border-b pb-2">
 <Mail className="h-5 w-5 text-success" /> Automated Daily Reports
 </h3>
 <p className="text-sm text-secondary mb-4">Add email addresses that should receive the automated 6 PM PDF production report.</p>

 <div className="flex gap-2 mb-4 max-w-md">
 <input
 type="email" placeholder="manager@factory.com"
 value={formData.emailInput}
 onChange={e => setFormData({ ...formData, emailInput: e.target.value })}
 onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleEmailAdd())}
 className="flex-1 border-border rounded-lg focus:ring-primary focus:border-primary shadow-sm"
 />
 <button
 type="button"
 onClick={handleEmailAdd}
 className="bg-surface-highlight hover:bg-surface-highlight text-primary px-4 py-2 rounded-lg font-medium transition"
 >
 Add
 </button>
 </div>

 <div className="flex flex-wrap gap-2">
 {formData.dailyReportEmails.length === 0 && <span className="text-sm text-muted italic">No recipients configured.</span>}
 {formData.dailyReportEmails.map((email) => (
 <div key={email} className="flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 px-3 py-1.5 rounded-full text-sm font-medium">
 {email}
 <button type="button" onClick={() => handleEmailRemove(email)} className="text-primary hover:text-primary font-bold">&times;</button>
 </div>
 ))}
 </div>
 </div>

 <div className="flex justify-end">
 <button
 type="submit"
 disabled={updateMutation.isPending}
 className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-8 py-3 rounded-lg font-bold shadow-md transition disabled:opacity-50"
 >
 <Save className="h-5 w-5" />
 {updateMutation.isPending ? 'Saving...' : 'Save Configuration'}
 </button>
 </div>
 </form>
 </div>
 );
};

export default ReportConfig;

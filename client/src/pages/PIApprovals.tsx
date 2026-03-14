import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import StatusBadge from '../components/ui/StatusBadge';
import { CheckCircle, XCircle, ShoppingCart, FileText, RotateCcw } from 'lucide-react';

const PIApprovals = () => {
	const [tab, setTab] = useState<'rfq' | 'pi'>('rfq');

	// PI state
	const [pis, setPis] = useState<any[]>([]);
	const [piLoading, setPiLoading] = useState(true);
	const [approvalRemarks, setApprovalRemarks] = useState<Record<string, string>>({});
	const [piSubmitting, setPiSubmitting] = useState(false);

	// RFQ approval state
	const [rfqs, setRfqs] = useState<any[]>([]);
	const [rfqLoading, setRfqLoading] = useState(true);
	const [selectedQuotation, setSelectedQuotation] = useState<Record<string, string>>({});
	const [rfqRemarks, setRfqRemarks] = useState<Record<string, string>>({});
	const [rfqSubmitting, setRfqSubmitting] = useState(false);

	useEffect(() => {
		fetchPIs();
		fetchPendingRFQs();
	}, []);

	const fetchPIs = async () => {
		try {
			const { data } = await api.get('/pi');
			setPis(data);
		} catch { /* ignore */ } finally { setPiLoading(false); }
	};

	const fetchPendingRFQs = async () => {
		try {
			const { data } = await api.get('/supplier/rfq/pending-approval');
			setRfqs(data);
		} catch { /* ignore */ } finally { setRfqLoading(false); }
	};

	const handlePIStatus = async (id: string, status: 'APPROVED' | 'REJECTED') => {
		if (!window.confirm(`Are you sure you want to ${status.toLowerCase()} this request?`)) return;
		setPiSubmitting(true);
		try {
			await api.put(`/pi/${id}/status`, { status, approvalRemarks: approvalRemarks[id] || '' });
			toast.success(`PI ${status.toLowerCase()}`);
			fetchPIs();
		} catch (err: any) {
			toast.error(err.response?.data?.message || 'Failed to update');
		} finally { setPiSubmitting(false); }
	};

	const handleRFQApprove = async (rfqId: string) => {
		const quotationId = selectedQuotation[rfqId];
		if (!quotationId) { toast.error('Select a quotation to approve'); return; }
		setRfqSubmitting(true);
		try {
			await api.put(`/supplier/rfq/${rfqId}/manager-approve`, { quotationId, remarks: rfqRemarks[rfqId] || '' });
			toast.success('RFQ approved — store manager will now generate the PO');
			fetchPendingRFQs();
		} catch (err: any) {
			toast.error(err.response?.data?.message || 'Failed to approve');
		} finally { setRfqSubmitting(false); }
	};

	const handleRFQSendBack = async (rfqId: string) => {
		setRfqSubmitting(true);
		try {
			await api.put(`/supplier/rfq/${rfqId}/manager-reject`, { remarks: rfqRemarks[rfqId] || '' });
			toast.success('RFQ sent back to store manager');
			fetchPendingRFQs();
		} catch (err: any) {
			toast.error(err.response?.data?.message || 'Failed to send back');
		} finally { setRfqSubmitting(false); }
	};

	const raisedPIs = pis.filter((p: any) => p.status === 'RAISED');

	return (
		<div className="space-y-6 animate-fade-in">
			<div className="flex justify-between items-end border-b border-subtle pb-6">
				<div>
					<h1 className="text-2xl font-bold font-heading text-primary tracking-tight">Approvals</h1>
					<p className="text-secondary mt-1 text-sm">Review and approve procurement requests and purchase indents</p>
				</div>
			</div>

			{/* Tabs */}
			<div className="flex gap-1 p-1 bg-elevated rounded-lg w-fit border border-subtle">
				<button onClick={() => setTab('rfq')} className={`px-4 py-2 text-sm font-semibold rounded-md transition-all flex items-center gap-2 ${tab === 'rfq' ? 'bg-card shadow-sm text-primary' : 'text-secondary hover:text-primary'}`}>
					<FileText className="h-4 w-4" />RFQ Approvals
					{rfqs.length > 0 && <span className="ml-1 bg-amber-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold">{rfqs.length}</span>}
				</button>
				<button onClick={() => setTab('pi')} className={`px-4 py-2 text-sm font-semibold rounded-md transition-all flex items-center gap-2 ${tab === 'pi' ? 'bg-card shadow-sm text-primary' : 'text-secondary hover:text-primary'}`}>
					<ShoppingCart className="h-4 w-4" />Purchase Indents
					{raisedPIs.length > 0 && <span className="ml-1 bg-amber-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold">{raisedPIs.length}</span>}
				</button>
			</div>

			{/* ── RFQ APPROVALS TAB ── */}
			{tab === 'rfq' && (
				rfqLoading ? (
					<div className="flex items-center justify-center py-12">
						<div className="h-6 w-6 border-2 border-subtle border-t-brand-primary rounded-full animate-spin" />
						<p className="text-secondary ml-3">Loading RFQ approvals...</p>
					</div>
				) : rfqs.length === 0 ? (
					<div className="text-center p-12 bg-canvas rounded-xl border-2 border-dashed border-subtle">
						<FileText className="h-12 w-12 text-muted mx-auto mb-4" />
						<p className="text-primary font-heading font-bold text-lg">No RFQs pending approval</p>
						<p className="text-sm text-secondary mt-2">Store manager hasn't submitted any quotations for review yet.</p>
					</div>
				) : (
					<div className="space-y-6">
						{rfqs.map((rfq: any) => (
							<div key={rfq._id} className="bg-card rounded-xl shadow-sm border border-subtle overflow-hidden">
								<div className="px-6 py-4 border-b border-subtle flex flex-wrap justify-between items-center bg-canvas/50 gap-3">
									<div>
										<div className="flex items-center gap-3 flex-wrap">
											<h3 className="text-lg font-bold text-primary font-mono">{rfq.rfqNumber}</h3>
											{rfq.isReRequest && (
												<span className="flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-300">
													<RotateCcw className="h-3 w-3" />RE-REQUEST{rfq.reRequestCount > 1 ? ` #${rfq.reRequestCount}` : ''}
												</span>
											)}
											<span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-300">PENDING APPROVAL</span>
										</div>
										<p className="text-xs text-secondary mt-1.5">Submitted by {rfq.createdBy?.username} · {rfq.submittedQuotations?.length || 0} quotation(s) selected for review</p>
									</div>
									<p className="text-xs text-muted">{rfq.items?.length} material item(s)</p>
								</div>
								<div className="p-6 space-y-4">
									<p className="text-sm font-semibold text-primary">Select one supplier to approve:</p>
									{!rfq.submittedQuotations?.length ? (
										<p className="text-sm text-secondary italic">No quotations attached to this submission.</p>
									) : (
										<div className="space-y-3">
											{rfq.submittedQuotations.map((q: any) => (
												<label key={q._id} className={`flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-all ${selectedQuotation[rfq._id] === q._id ? 'border-brand-primary bg-brand-primary/5' : 'border-subtle bg-canvas hover:border-brand-primary/40'}`}>
													<input type="radio" name={`rfq-${rfq._id}`} value={q._id}
														checked={selectedQuotation[rfq._id] === q._id}
														onChange={() => setSelectedQuotation(prev => ({ ...prev, [rfq._id]: q._id }))}
														className="mt-1 accent-brand-primary"
													/>
													<div className="flex-1 min-w-0">
														<div className="flex justify-between items-start gap-4">
															<div>
																<p className="font-bold text-primary">{q.supplierId?.name || 'Supplier'}</p>
																<p className="text-xs text-secondary mt-0.5">
																	Delivery: {q.deliveryDays} days{q.paymentTerms && ` · Terms: ${q.paymentTerms}`}{q.supplierId?.rating ? ` · ⭐ ${q.supplierId.rating.toFixed(1)}` : ''}
																</p>
															</div>
															<p className="text-xl font-bold text-brand-primary shrink-0">₹{q.totalPrice?.toLocaleString()}</p>
														</div>
														<div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1">
															{q.items?.map((item: any, i: number) => (
																<p key={i} className="text-xs text-secondary">• {item.materialId?.name || 'Material'} — ₹{item.unitPrice}/unit × {item.quantity} {item.materialId?.unit || ''}</p>
															))}
														</div>
														{q.remarks && <p className="text-xs text-muted mt-1 italic">"{q.remarks}"</p>}
													</div>
												</label>
											))}
										</div>
									)}
									<div className="border-t border-subtle pt-4 space-y-3">
										<div>
											<label className="text-xs font-semibold text-secondary uppercase tracking-wider">Remarks (optional)</label>
											<input type="text" placeholder="Add remarks for store manager..."
												value={rfqRemarks[rfq._id] || ''}
												onChange={(e) => setRfqRemarks(prev => ({ ...prev, [rfq._id]: e.target.value }))}
												className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-subtle bg-canvas text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
											/>
										</div>
										<div className="flex justify-end gap-3">
											<button onClick={() => handleRFQSendBack(rfq._id)} disabled={rfqSubmitting}
												className="flex items-center px-4 py-2 text-sm font-semibold rounded-lg border border-subtle text-secondary hover:border-status-danger/50 hover:text-status-danger transition-colors">
												<XCircle className="h-4 w-4 mr-2" />Send Back
											</button>
											<button onClick={() => handleRFQApprove(rfq._id)} disabled={rfqSubmitting || !selectedQuotation[rfq._id]}
												className="flex items-center px-4 py-2 text-sm font-semibold rounded-lg bg-brand-primary text-white hover:bg-brand-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
												<CheckCircle className="h-4 w-4 mr-2" />Approve Selected Supplier
											</button>
										</div>
									</div>
								</div>
							</div>
						))}
					</div>
				)
			)}

			{/* ── PI APPROVALS TAB ── */}
			{tab === 'pi' && (
				piLoading ? (
					<div className="flex items-center justify-center py-12">
						<div className="h-6 w-6 border-2 border-subtle border-t-brand-primary rounded-full animate-spin" />
						<p className="text-secondary ml-3">Loading purchase indents...</p>
					</div>
				) : pis.length === 0 ? (
					<div className="text-center p-12 bg-canvas rounded-xl border-2 border-dashed border-subtle">
						<ShoppingCart className="h-12 w-12 text-muted mx-auto mb-4" />
						<p className="text-primary font-heading font-bold text-lg">No purchase indents found</p>
					</div>
				) : (
					<div className="space-y-4">
						{pis.map((pi: any) => (
							<div key={pi._id} className="bg-card rounded-xl shadow-sm border border-subtle overflow-hidden">
								<div className="px-6 py-4 border-b border-subtle flex justify-between items-center bg-canvas/50">
									<div>
										<h3 className="font-bold text-primary">
											Raised by <span className="font-mono">{pi.storeManagerId?.username}</span>
											{pi.supplierId?.name && <span className="text-secondary font-normal"> for {pi.supplierId.name}</span>}
										</h3>
										<p className="text-xs text-secondary mt-1">{new Date(pi.createdAt).toLocaleDateString()} · {pi.reason || 'No reason given'}</p>
									</div>
									<span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${pi.status === 'RAISED' ? 'bg-amber-100 text-amber-800' : pi.status === 'APPROVED' ? 'bg-green-100 text-green-800' : pi.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>{pi.status}</span>
								</div>
								<div className="p-6">
									<table className="w-full text-sm mb-4">
										<thead><tr className="text-xs text-secondary uppercase"><th className="text-left py-2">Material</th><th className="text-right py-2">Quantity</th></tr></thead>
										<tbody className="divide-y divide-subtle">
											{pi.items?.map((item: any) => (
												<tr key={item._id}>
													<td className="py-2 font-medium text-primary">{item.materialId?.name}</td>
													<td className="py-2 text-right font-mono">{item.quantity} {item.materialId?.unit}</td>
												</tr>
											))}
										</tbody>
									</table>
									{pi.status === 'RAISED' && (
										<div className="border-t border-subtle pt-4 space-y-3">
											<input type="text" placeholder="Approval remarks (optional)"
												className="w-full px-3 py-2 text-sm rounded-lg border border-subtle bg-canvas text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
												value={approvalRemarks[pi._id] || ''}
												onChange={(e) => setApprovalRemarks(prev => ({ ...prev, [pi._id]: e.target.value }))}
											/>
											<div className="flex justify-end gap-3">
												<button onClick={() => handlePIStatus(pi._id, 'REJECTED')} disabled={piSubmitting}
													className="flex items-center px-4 py-2 text-sm font-semibold rounded-lg border border-red-300 text-red-700 hover:bg-red-50 transition-colors">
													<XCircle className="h-4 w-4 mr-2" />Reject
												</button>
												<button onClick={() => handlePIStatus(pi._id, 'APPROVED')} disabled={piSubmitting}
													className="flex items-center px-4 py-2 text-sm font-semibold rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors">
													<CheckCircle className="h-4 w-4 mr-2" />Approve
												</button>
											</div>
										</div>
									)}
									{pi.status !== 'RAISED' && (pi as any).approvalRemarks && (
										<div className="mt-4 pt-4 border-t">
											<p className="text-xs text-secondary font-medium uppercase">Approval Remarks</p>
											<p className="text-sm text-primary mt-1">{(pi as any).approvalRemarks}</p>
										</div>
									)}
								</div>
							</div>
						))}
					</div>
				)
			)}
		</div>
	);
};

export default PIApprovals;

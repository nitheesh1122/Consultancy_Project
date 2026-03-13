import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { ArrowLeft } from 'lucide-react';
import OrderPipeline, { ORDER_STAGES } from '../../components/OrderPipeline';

const OrderTracking = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrder();
    }, [id]);

    const fetchOrder = async () => {
        try {
            const { data } = await api.get(`/customer/orders/${id}`);
            setOrder(data);
        } catch (error) {
            console.error('Error fetching order', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !order) return null;

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex items-center gap-4 border-b border-subtle pb-6">
                <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-elevated transition-colors">
                    <ArrowLeft className="h-5 w-5 text-secondary" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold font-heading text-primary tracking-tight">Order {order.orderNumber}</h1>
                    <p className="text-secondary mt-1 text-sm">Track your order progress</p>
                </div>
            </div>

            {/* Pipeline Visualization */}
            <OrderPipeline stages={ORDER_STAGES} currentStatus={order.status} />

            {/* Order Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-card rounded-xl border border-subtle shadow-sm p-6 space-y-4">
                    <h3 className="text-sm font-bold text-primary uppercase tracking-wide">Order Details</h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between"><span className="text-muted">Fabric Type</span><span className="font-semibold text-primary">{order.fabricType}</span></div>
                        <div className="flex justify-between"><span className="text-muted">Color</span><span className="font-semibold text-primary">{order.color}</span></div>
                        {order.shadeCode && <div className="flex justify-between"><span className="text-muted">Shade Code</span><span className="font-mono text-primary">{order.shadeCode}</span></div>}
                        {order.fabricGSM && <div className="flex justify-between"><span className="text-muted">GSM</span><span className="font-mono text-primary">{order.fabricGSM}</span></div>}
                        <div className="flex justify-between"><span className="text-muted">Quantity</span><span className="font-bold text-primary">{order.quantity} KG</span></div>
                    </div>
                </div>

                <div className="bg-card rounded-xl border border-subtle shadow-sm p-6 space-y-4">
                    <h3 className="text-sm font-bold text-primary uppercase tracking-wide">Pricing & Delivery</h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between"><span className="text-muted">Price / KG</span><span className="font-mono text-primary">₹{order.pricePerKg}</span></div>
                        <div className="flex justify-between"><span className="text-muted">Total Value</span><span className="font-bold text-xl text-brand-primary">₹{order.totalValue?.toLocaleString()}</span></div>
                        <div className="flex justify-between"><span className="text-muted">Delivery Date</span><span className="font-semibold text-primary">{new Date(order.deliveryDate).toLocaleDateString()}</span></div>
                        <div className="flex justify-between"><span className="text-muted">Placed On</span><span className="text-secondary">{new Date(order.createdAt).toLocaleDateString()}</span></div>
                    </div>
                </div>
            </div>

            {order.specialInstructions && (
                <div className="bg-card rounded-xl border border-subtle shadow-sm p-6">
                    <h3 className="text-sm font-bold text-primary uppercase tracking-wide mb-3">Special Instructions</h3>
                    <p className="text-secondary text-sm">{order.specialInstructions}</p>
                </div>
            )}

            {order.remarks && (
                <div className="bg-card rounded-xl border border-subtle shadow-sm p-6">
                    <h3 className="text-sm font-bold text-primary uppercase tracking-wide mb-3">Manager Remarks</h3>
                    <p className="text-secondary text-sm">{order.remarks}</p>
                </div>
            )}
        </div>
    );
};

export default OrderTracking;

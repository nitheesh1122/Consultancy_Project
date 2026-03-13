import React from 'react';
import { CheckCircle, Clock, Truck, Package, Factory as FactoryIcon, Droplets } from 'lucide-react';

export const ORDER_STAGES = [
    { key: 'PLACED', label: 'Order Placed', icon: Package },
    { key: 'APPROVED', label: 'Approved', icon: CheckCircle },
    { key: 'FABRIC_RECEIVED', label: 'Fabric Received', icon: Droplets },
    { key: 'IN_PRODUCTION', label: 'In Production', icon: FactoryIcon },
    { key: 'COMPLETED', label: 'Completed', icon: CheckCircle },
    { key: 'DISPATCHED', label: 'Dispatched', icon: Truck },
    { key: 'DELIVERED', label: 'Delivered', icon: CheckCircle },
];

export const BATCH_STAGES = [
    { key: 'SCHEDULED', label: 'Scheduled', icon: Clock },
    { key: 'IN_PROGRESS', label: 'In Progress', icon: FactoryIcon },
    { key: 'COMPLETED', label: 'Completed', icon: CheckCircle },
];

interface OrderPipelineProps {
    stages: { key: string; label: string; icon: React.ComponentType<any> }[];
    currentStatus: string;
    compact?: boolean;
}

const OrderPipeline: React.FC<OrderPipelineProps> = ({ stages, currentStatus, compact = false }) => {
    const currentIndex = stages.findIndex(s => s.key === currentStatus);
    const progress = stages.length > 1 ? (Math.max(0, currentIndex) / (stages.length - 1)) * 100 : 0;

    return (
        <div className={`flex items-start justify-between relative ${compact ? '' : 'py-4'}`}>
            {/* Background line */}
            <div className="absolute h-0.5 bg-gray-200" style={{ top: compact ? '16px' : '20px', left: '20px', right: '20px' }} />
            <div className="absolute h-0.5 bg-brand-primary transition-all duration-700 ease-out"
                style={{ top: compact ? '16px' : '20px', left: '20px', width: `calc(${progress}% - 40px)` }} />

            {stages.map((stage, idx) => {
                const isComplete = idx <= currentIndex;
                const isCurrent = idx === currentIndex;
                const Icon = stage.icon;
                const size = compact ? 'w-8 h-8' : 'w-10 h-10';
                const iconSize = compact ? 'h-3.5 w-3.5' : 'h-4 w-4';

                return (
                    <div key={stage.key} className="flex flex-col items-center relative z-10 flex-1">
                        <div className={`${size} rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                            isComplete ? 'bg-brand-primary border-brand-primary text-white' :
                            'bg-white border-gray-300 text-gray-400'
                        } ${isCurrent ? 'ring-4 ring-brand-primary/20 scale-110' : ''}`}>
                            <Icon className={iconSize} />
                        </div>
                        <p className={`${compact ? 'text-[10px] mt-1' : 'text-xs mt-2'} font-medium text-center leading-tight ${
                            isComplete ? 'text-brand-primary' : 'text-muted'
                        }`}>{stage.label}</p>
                    </div>
                );
            })}
        </div>
    );
};

export default OrderPipeline;

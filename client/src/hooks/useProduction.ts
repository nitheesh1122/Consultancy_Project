import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import api from '../lib/api';
import { withRetry } from '../utils/apiRetry';
import { useSocket } from '../context/SocketContext';

// --- Hooks ---
export const useCreateBatch = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: any) => {
            return await withRetry(() => api.post('/production-batches', data));
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['production-batches'] });
        }
    });
};

export const useBatchUpdates = () => {
    const queryClient = useQueryClient();
    const { socket } = useSocket();

    useEffect(() => {
        if (!socket) return;

        const handleBatchUpdate = (data: any) => {
            // Update individual batch cache
            if (data.batchId) {
                // If we also track batches individually, update them here:
                queryClient.setQueryData(['batch', data.batchId], (oldData: any) => {
                    if (!oldData) return undefined;
                    return { ...oldData, status: data.status, yieldPercentage: data.yieldPercentage, ...data };
                });
            }
            // Invalidate lists to ensure Monitor and Tables are fresh
            queryClient.invalidateQueries({ queryKey: ['production-batches'] });
            queryClient.invalidateQueries({ queryKey: ['monitor-dashboard'] });
            queryClient.invalidateQueries({ queryKey: ['available-workers'] });
        };

        socket.on('batchStatusUpdate', handleBatchUpdate);

        return () => {
            socket.off('batchStatusUpdate', handleBatchUpdate);
        };
    }, [queryClient, socket]);
};

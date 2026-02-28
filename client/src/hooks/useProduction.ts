import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import api from '../lib/api';
import { withRetry } from '../utils/apiRetry';

// --- Socket Connection ---
let socket: Socket | null = null;
export const getSocket = () => {
    if (!socket) {
        socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000');
    }
    return socket;
};

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

    useEffect(() => {
        const s = getSocket();

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

        s.on('batchStatusUpdate', handleBatchUpdate);

        return () => {
            s.off('batchStatusUpdate', handleBatchUpdate);
        };
    }, [queryClient]);
};

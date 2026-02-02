import React, { createContext, useEffect, useState, useContext, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../hooks/useAuth';

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({ socket: null, isConnected: false });

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const { user } = useAuth(); // Assuming useAuth gives us the current user

    useEffect(() => {
        // Connect to the server. Adjust URL for production if needed.
        // In Vite dev, proxy usually handles /api, but socket.io needs dedicated port or proxy config.
        // Assuming server allows CORS from * as set in socket.ts
        const newSocket = io('http://localhost:3000'); // TODO: Make env variable

        newSocket.on('connect', () => {
            console.log('Socket connected');
            setIsConnected(true);
        });

        newSocket.on('disconnect', () => {
            console.log('Socket disconnected');
            setIsConnected(false);
        });

        setSocket(newSocket);

        return () => {
            newSocket.close();
        };
    }, []);

    useEffect(() => {
        if (socket && user && user.role) {
            // Join a room based on role (e.g., 'ADMIN', 'STORE_MANAGER')
            socket.emit('join_role', user.role);

            // Also join user specific room if needed
            socket.emit('join_role', user.id);
        }
    }, [socket, user]);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};

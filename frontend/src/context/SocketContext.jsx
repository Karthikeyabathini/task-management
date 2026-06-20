import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    let socketInstance;

    if (user && user._id) {
      // Connect socket when user is logged in
      socketInstance = io(SOCKET_URL, {
        transports: ['websocket'],
      });

      socketInstance.on('connect', () => {
        console.log('Socket connected:', socketInstance.id);
        // Join the private room based on user ID
        socketInstance.emit('join', user._id);
      });

      setSocket(socketInstance);
    } else {
      // Disconnect socket when logged out
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    }

    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [user]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  return useContext(SocketContext);
};

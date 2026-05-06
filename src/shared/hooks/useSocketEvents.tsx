import {
    useEffect,
    useRef
} from 'react';
import {
    useSocket
} from '../context/socket.context';

export const useSocketEvents = (eventName: string, callback: () => void) => {
    const socket = useSocket();
    const callbackRef = useRef(callback);

    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    useEffect(() => {
        if (!socket) return;

        const handler = () => {
            if (callbackRef.current) callbackRef.current();
        };

        socket.on(eventName, handler);

        return () => {
            socket.off(eventName, handler);
        };
    }, [socket, eventName]);
};

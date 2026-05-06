import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactElement
} from "react";
import {
    io,
    Socket
} from "socket.io-client";
import usePermissions from "../hooks/usePermissions";
import { getAccessToken } from "../helpers/auth";

const SocketContext = createContext<Socket<any> | null>(null);

interface PropTypes {
    children: ReactElement;
}

export const SocketProvider = (props: PropTypes) => {
    const { children } = props;
    const { user } = usePermissions();
    const [socket, setSocket] = useState<Socket<any> | null>(null);

    useEffect(() => {
        if (!user) return;

        const token = getAccessToken();
        if (!token) return;

        const newSocket = io(`${import.meta.env.VITE_SERVER_HOST}/`, {
            auth: { token },
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 2000,
            timeout: 10000
        });

        newSocket.on('connect', () => {
            console.log('✅ Socket connected successfully!', newSocket.id);
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
            setSocket(null);
        };
    }, [user]);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => useContext(SocketContext);

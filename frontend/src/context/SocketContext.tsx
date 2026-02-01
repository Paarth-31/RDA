import React,{createContext, useMemo, useContext} from 'react';
import {io,Socket} from 'socket.io-client';

const SocketContext=createContext<Socket|null>(null);
export const useSocket=()=>{
    return useContext(SocketContext);
}

export const SocketProvider:React.FC<{children:React.ReactNode}>=({children})=>{
    const socket=useMemo(()=>{
        return io("http://localhost:8080");
    },[]);
    return(
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    )
}
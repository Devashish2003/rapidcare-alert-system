import {useCallback, useEffect, useRef, useState} from 'react';

const WS_BASE = (import.meta.env.VITE_WS_URL || 'ws://localhost:8000');

export function useAmbulanceStatus(ambulanceId, onMessage) {
    const [connected, setConnected] = useState(false);
    const wsRef = useRef(null);
    const retryDelay = useRef(1000);
    const retryTimer = useRef(null);
    const unmounted = useRef(false);
    const connectRef = useRef(null);

    const connect = useCallback(() => {
        if (unmounted.current || !ambulanceId) return;
        const token = localStorage.getItem('access_token');
        if (!token) return;

        const ws = new WebSocket(`${WS_BASE}/ws/ambulance/${ambulanceId}/status/?token=${token}`);
        wsRef.current = ws;

        ws.onopen = () => {
            setConnected(true);
            retryDelay.current = 1000;
        };
        ws.onmessage = (evt) => {
            try { onMessage?.(JSON.parse(evt.data)); } catch { /* ignore */ }
        };
        ws.onclose = () => {
            setConnected(false);
            if (!unmounted.current) {
                retryTimer.current = setTimeout(() => {
                    retryDelay.current = Math.min(retryDelay.current * 2, 30_000);
                    connectRef.current?.();
                }, retryDelay.current);
            }
        };
        ws.onerror = () => ws.close();
    }, [ambulanceId, onMessage]);

    useEffect(() => { connectRef.current = connect; }, [connect]);

    useEffect(() => {
        unmounted.current = false;
        connect();
        return () => {
            unmounted.current = true;
            clearTimeout(retryTimer.current);
            wsRef.current?.close();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [connect]);

    return {connected};
}

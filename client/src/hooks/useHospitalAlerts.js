import {useCallback, useEffect, useRef, useState} from 'react';

const WS_BASE = (import.meta.env.VITE_WS_URL || 'ws://localhost:8000');

/**
 * Opens a WebSocket to /ws/hospital/{hospitalId}/alerts/
 * and calls onMessage whenever a push arrives.
 *
 * Returns { connected } so callers can show a live indicator.
 * Auto-reconnects with exponential back-off up to 30 s.
 */
export function useHospitalAlerts(hospitalId, onMessage) {
    const [connected, setConnected] = useState(false);
    const wsRef = useRef(null);
    const retryDelay = useRef(1000);
    const retryTimer = useRef(null);
    const unmounted = useRef(false);
    const connectRef = useRef(null);

    const connect = useCallback(() => {
        if (unmounted.current || !hospitalId) return;

        const token = localStorage.getItem('access_token');
        if (!token) return;

        const url = `${WS_BASE}/ws/hospital/${hospitalId}/alerts/?token=${token}`;
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
            setConnected(true);
            retryDelay.current = 1000;
        };

        ws.onmessage = (evt) => {
            try {
                const payload = JSON.parse(evt.data);
                onMessage(payload);
            } catch { /* malformed frame — ignore */
            }
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
    }, [hospitalId, onMessage]);

    useEffect(() => {
        connectRef.current = connect;
    }, [connect]);

    useEffect(() => {
        unmounted.current = false;
        connect();
        return () => {
            unmounted.current = true;
            clearTimeout(retryTimer.current);
            wsRef.current?.close();
        };
    }, [connect]);

    return {connected};
}

import {useCallback, useEffect, useRef, useState} from 'react';

const WS_BASE = (import.meta.env.VITE_WS_URL || 'ws://localhost:8000');
const SEND_INTERVAL_MS = 5000; // push GPS every 5 seconds

/**
 * Streams real-time GPS via WebSocket to /ws/ambulance/{ambulanceId}/location/
 * Saves location to DB through the consumer (no extra REST call needed).
 *
 * Returns { connected, position } where position = { latitude, longitude } | null
 */
export function useAmbulanceLocation(ambulanceId) {
    const [connected, setConnected] = useState(false);
    const [position, setPosition] = useState(null);

    const wsRef = useRef(null);
    const retryDelay = useRef(1000);
    const retryTimer = useRef(null);
    const sendTimer = useRef(null);
    const unmounted = useRef(false);
    const posRef = useRef(null); // latest geolocation result

    const sendLocation = useCallback(() => {
        if (!posRef.current || wsRef.current?.readyState !== WebSocket.OPEN) return;
        const {latitude, longitude, speed, heading} = posRef.current;
        wsRef.current.send(JSON.stringify({latitude, longitude, speed, heading, address: ''}));
    }, []);

    const connect = useCallback(() => {
        if (unmounted.current || !ambulanceId) return;

        const token = localStorage.getItem('access_token');
        if (!token) return;

        const url = `${WS_BASE}/ws/ambulance/${ambulanceId}/location/?token=${token}`;
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
            setConnected(true);
            retryDelay.current = 1000;
            sendTimer.current = setInterval(sendLocation, SEND_INTERVAL_MS);
        };

        ws.onmessage = (evt) => {
            try {
                const data = JSON.parse(evt.data);
                // Reflect back our own position from the server echo if needed
                if (data.latitude && data.longitude) {
                    setPosition({latitude: data.latitude, longitude: data.longitude});
                }
            } catch { /* ignore */
            }
        };

        ws.onclose = () => {
            setConnected(false);
            clearInterval(sendTimer.current);
            if (!unmounted.current) {
                retryTimer.current = setTimeout(() => {
                    retryDelay.current = Math.min(retryDelay.current * 2, 30_000);
                    connect();
                }, retryDelay.current);
            }
        };

        ws.onerror = () => ws.close();
    }, [ambulanceId, sendLocation]);

    // Watch GPS
    useEffect(() => {
        if (!navigator.geolocation) return;
        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const {latitude, longitude, speed, heading} = pos.coords;
                posRef.current = {latitude, longitude, speed, heading};
                setPosition({latitude, longitude});
            },
            null,
            {enableHighAccuracy: true, maximumAge: 4000},
        );
        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    // Manage WS lifecycle
    useEffect(() => {
        unmounted.current = false;
        connect();
        return () => {
            unmounted.current = true;
            clearTimeout(retryTimer.current);
            clearInterval(sendTimer.current);
            wsRef.current?.close();
        };
    }, [connect]);

    return {connected, position};
}

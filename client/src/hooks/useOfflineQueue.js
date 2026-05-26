import {useEffect, useRef} from 'react';
import {getAllQueuedRequests, deleteQueuedRequest} from '../utils/db';
import {useOnlineStatus} from './useOnlineStatus';

/**
 * Watches for the app to come back online and replays any queued requests.
 * Calls onReplay(results) when done so callers can refresh their data.
 */
export function useOfflineQueue(onReplay) {
    const isOnline = useOnlineStatus();
    const replayingRef = useRef(false);
    const onReplayRef = useRef(onReplay);
    onReplayRef.current = onReplay;

    useEffect(() => {
        if (!isOnline || replayingRef.current) return;

        const replay = async () => {
            replayingRef.current = true;
            try {
                const queued = await getAllQueuedRequests();
                if (queued.length === 0) return;

                const token = localStorage.getItem('access_token');
                const results = [];

                for (const req of queued) {
                    try {
                        const res = await fetch(req.url, {
                            method: req.method,
                            headers: {
                                'Content-Type': 'application/json',
                                Authorization: token ? `Bearer ${token}` : '',
                                ...req.headers,
                            },
                            body: req.data ? JSON.stringify(req.data) : undefined,
                        });
                        if (res.ok) {
                            await deleteQueuedRequest(req.id);
                            results.push({req, response: await res.json()});
                        }
                    } catch {
                        // Still offline or request failed — leave in queue
                    }
                }

                if (results.length > 0 && onReplayRef.current) {
                    onReplayRef.current(results);
                }
            } finally {
                replayingRef.current = false;
            }
        };

        replay();
    }, [isOnline]);
}

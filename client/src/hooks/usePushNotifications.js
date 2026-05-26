import {useEffect, useState} from 'react';
import apiService from '../services/api';

// Must match VAPID_PUBLIC_KEY in server/config/settings.py
const VAPID_PUBLIC_KEY = 'BEV4kmHTlUjNlqUK8s6P19gMaxb5bTv0frob6YheaXVO8oerkt7phI-9_yowck63f_qUHNY-6N501p7j6CA8TgA';

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

const isPushSupported =
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window;

export function usePushNotifications() {
    const [permission, setPermission] = useState(
        isPushSupported ? Notification.permission : 'denied'
    );
    const [subscribed, setSubscribed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!isPushSupported) return;
        (async () => {
            try {
                const reg = await navigator.serviceWorker.ready;
                const sub = await reg.pushManager.getSubscription();
                setSubscribed(!!sub);
            } catch { /* silently ignore */
            }
        })();
    }, []);

    const subscribe = async () => {
        if (!isPushSupported) {
            setError('Push notifications are not supported in this browser.');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const perm = await Notification.requestPermission();
            setPermission(perm);
            if (perm !== 'granted') {
                setError('Notification permission was denied. Please allow it in your browser settings.');
                return;
            }
            const reg = await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
            });
            await apiService.pushSubscribe(sub.toJSON());
            setSubscribed(true);
        } catch (e) {
            setError('Failed to enable push notifications. ' + (e.message || ''));
        } finally {
            setLoading(false);
        }
    };

    const unsubscribe = async () => {
        setLoading(true);
        setError(null);
        try {
            const reg = await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.getSubscription();
            if (sub) {
                await apiService.pushUnsubscribe({endpoint: sub.endpoint});
                await sub.unsubscribe();
            }
            setSubscribed(false);
        } catch (e) {
            setError('Failed to disable push notifications.');
        } finally {
            setLoading(false);
        }
    };

    return {isPushSupported, permission, subscribed, loading, error, subscribe, unsubscribe};
}

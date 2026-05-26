/**
 * Play a short alert beep using the Web Audio API.
 * priority: 'high' → 880 Hz (urgent), 'medium' → 660 Hz, 'low' → 440 Hz
 * No external library needed.
 */
export function playAlertSound(priority = 'high') {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();

        const frequencies = {high: [880, 1100, 880], medium: [660, 660], low: [440]};
        const pulses = frequencies[priority] ?? frequencies.high;

        let startTime = ctx.currentTime;
        pulses.forEach((freq) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = 'sine';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.25, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);

            osc.start(startTime);
            osc.stop(startTime + 0.25);
            startTime += 0.3;
        });
    } catch {
        // AudioContext not available (e.g. test environment) — silently ignore
    }
}

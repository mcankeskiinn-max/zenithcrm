export type AnomalySignal = {
    key: string;
    threshold: number;
    value: number;
    window: string;
};

export const detectAnomalies = (metrics: Record<string, number>, thresholds: Record<string, number>): AnomalySignal[] => {
    const signals: AnomalySignal[] = [];
    for (const [key, threshold] of Object.entries(thresholds)) {
        const value = metrics[key] || 0;
        if (value >= threshold) {
            signals.push({ key, threshold, value, window: '1h' });
        }
    }
    return signals;
};

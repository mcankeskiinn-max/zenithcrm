import React from 'react';
import { Target } from 'lucide-react';

interface TargetData {
    month: number;
    year: number;
    target: number;
    actual: number;
    percentage: number;
}

interface TargetProgressProps {
    data: TargetData | null;
}

export const TargetProgress: React.FC<TargetProgressProps> = ({ data }) => {
    if (!data) return null;

    const percentage = Math.min(data.percentage, 100);
    const isSuccess = data.percentage >= 100;

    return (
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl shadow-lg p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Target className="w-32 h-32" />
            </div>

            <div className="relative z-10">
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <p className="text-indigo-200 text-sm font-medium mb-1">Aylık Hedef Durumu</p>
                        <h3 className="text-3xl font-bold">
                            {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(data.actual)}
                        </h3>
                        <p className="text-indigo-200 text-sm">
                            Hedef: {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(data.target)}
                        </p>
                    </div>
                    <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm">
                        <span className="text-xl font-bold">{data.percentage.toFixed(1)}%</span>
                    </div>
                </div>

                <div className="w-full bg-black/20 rounded-full h-3 mb-2">
                    <div
                        className={`h-3 rounded-full transition-all duration-1000 ease-out ${isSuccess ? 'bg-green-400' : 'bg-white'}`}
                        style={{ width: `${percentage}%` }}
                    />
                </div>

                <p className="text-xs text-indigo-200 text-right">
                    {data.year} / {data.month}. Ay Performansı
                </p>
            </div>
        </div>
    );
};

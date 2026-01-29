import React from 'react';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface ChurnRisk {
    id: string;
    customerName: string;
    policyNumber: string | null;
    endDate: string | null;
    amount: number;
    daysLeft: number;
}

interface ChurnRiskWidgetProps {
    risks: ChurnRisk[];
}

export const ChurnRiskWidget: React.FC<ChurnRiskWidgetProps> = ({ risks }) => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Churn Riski (30 Gün)</h3>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">{risks.length} Riskli Müşteri</span>
            </div>

            <div className="space-y-3">
                {risks.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">Riskli müşteri bulunmamaktadır. 🎉</p>
                ) : (
                    risks.slice(0, 5).map((risk) => (
                        <div key={risk.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                            <div>
                                <h4 className="font-medium text-gray-900 dark:text-gray-200">{risk.customerName}</h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {risk.policyNumber || 'Poliçe No Yok'} • Bitiş: {risk.endDate ? format(new Date(risk.endDate), 'dd MMM yyyy', { locale: tr }) : '-'}
                                </p>
                            </div>
                            <div className="text-right">
                                <span className="block text-sm font-semibold text-red-600 dark:text-red-400">
                                    {risk.daysLeft} Gün Kaldı
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(risk.amount)}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {risks.length > 5 && (
                <button className="w-full mt-4 flex items-center justify-center gap-1 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium p-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20">
                    Tümünü Gör <ArrowRight className="w-4 h-4" />
                </button>
            )}
        </div>
    );
};

import React from 'react';
import { Award, TrendingUp } from 'lucide-react';

interface CustomerProfitability {
    id: string;
    name: string;
    totalRevenue: number;
    saleCount: number;
    segment: 'Gold' | 'Silver' | 'Bronze';
}

interface ProfitabilityTableProps {
    data: CustomerProfitability[];
}

export const ProfitabilityTable: React.FC<ProfitabilityTableProps> = ({ data }) => {
    const getSegmentColor = (segment: string) => {
        switch (segment) {
            case 'Gold': return 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700';
            case 'Silver': return 'text-gray-500 bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600';
            default: return 'text-orange-700 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700';
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    Müşteri Karlılık Analizi (LTV)
                </h3>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700/30">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Müşteri</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Segment</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Poliçe Adedi</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Toplam Ciro</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {data.slice(0, 10).map((customer) => (
                            <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="font-medium text-gray-900 dark:text-gray-100">{customer.name}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getSegmentColor(customer.segment)}`}>
                                        <Award className="w-3 h-3" />
                                        {customer.segment}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500 dark:text-gray-400">
                                    {customer.saleCount}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900 dark:text-gray-100">
                                    {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(customer.totalRevenue)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

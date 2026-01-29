import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { RevenueTrendChart } from '../components/revenue/RevenueTrendChart';
import { ProfitabilityTable } from '../components/revenue/ProfitabilityTable';
import { ChurnRiskWidget } from '../components/revenue/ChurnRiskWidget';
import { TargetProgress } from '../components/revenue/TargetProgress';
import { LayoutDashboard, Download } from 'lucide-react';

const RevenuePage: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [trends, setTrends] = useState([]);
    const [profitability, setProfitability] = useState([]);
    const [risks, setRisks] = useState([]);
    const [target, setTarget] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                const headers = { Authorization: `Bearer ${token}` };

                const [resTrends, resProf, resRisks, resTarget] = await Promise.all([
                    axios.get(`${import.meta.env.VITE_API_URL}/api/revenue/trends`, { headers }),
                    axios.get(`${import.meta.env.VITE_API_URL}/api/revenue/profitability`, { headers }),
                    axios.get(`${import.meta.env.VITE_API_URL}/api/revenue/churn-risks`, { headers }),
                    axios.get(`${import.meta.env.VITE_API_URL}/api/revenue/targets`, { headers })
                ]);

                setTrends(resTrends.data);
                setProfitability(resProf.data);
                setRisks(resRisks.data);
                setTarget(resTarget.data);
            } catch (error) {
                console.error('Error fetching revenue data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <LayoutDashboard className="w-8 h-8 text-orange-600" />
                        Finansal Büyüme Paneli
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Şirketinizin finansal sağlığı ve büyüme metrikleri
                    </p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <Download className="w-4 h-4" />
                    Rapor İndir
                </button>
            </div>

            {/* Top Row: Chart & Widgets */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Trend Chart - Takes 2 cols */}
                <div className="lg:col-span-2">
                    <RevenueTrendChart data={trends} />
                </div>

                {/* Right Column: Target & Risk */}
                <div className="space-y-6">
                    <TargetProgress data={target} />
                    <ChurnRiskWidget risks={risks} />
                </div>
            </div>

            {/* Bottom Row: Profitability Table */}
            <div>
                <ProfitabilityTable data={profitability} />
            </div>
        </div>
    );
};

export default RevenuePage;

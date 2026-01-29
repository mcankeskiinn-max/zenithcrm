import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { FileText, Check, Download, X, Plus } from 'lucide-react';

interface Sale {
    id: string;
    customerName: string;
    amount: string;
    branch: { name: string };
    policyType: { name: string };
    startDate: string;
    endDate: string;
    status: string;
}

const QuoteComparisonPage = () => {
    const [offers, setOffers] = useState<Sale[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const fetchOffers = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/dashboard/sales`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Filter only OFFERS locally for now
            const allSales = response.data;
            setOffers(allSales.filter((s: Sale) => s.status === 'OFFER'));
        } catch (error) {
            console.error('Failed to fetch offers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
            formData.append('files', files[i]);
        }

        setUploading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${import.meta.env.VITE_API_URL}/api/quotes/upload`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            alert('Teklifler başarıyla yüklendi ve analiz edildi.');
            fetchOffers(); // Refresh list
        } catch (error) {
            console.error('Upload failed', error);
            alert('Yükleme sırasında hata oluştu.');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    useEffect(() => {
        fetchOffers();
    }, []);

    const toggleSelection = (id: string) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(sid => sid !== id));
        } else {
            if (selectedIds.length < 4) {
                setSelectedIds([...selectedIds, id]);
            } else {
                alert("En fazla 4 teklif karşılaştırabilirsiniz.");
            }
        }
    };

    const downloadPDF = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/quotes/compare/pdf`,
                { saleIds: selectedIds },
                {
                    headers: { Authorization: `Bearer ${token}` },
                    responseType: 'blob'
                }
            );

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'teklif_karsilastirma.pdf');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('PDF Download failed', error);
            alert('PDF oluşturulamadı.');
        }
    };

    const selectedOffers = offers.filter(o => selectedIds.includes(o.id));

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Teklif Karşılaştırma</h1>
                <div className="flex gap-3">
                    <input
                        type="file"
                        multiple
                        accept=".pdf,.png,.jpg,.jpeg"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                        {uploading ? (
                            <span className="animate-spin">⌛</span>
                        ) : (
                            <Plus size={20} />
                        )}
                        {uploading ? 'İşleniyor...' : 'Teklif Yükle (OCR)'}
                    </button>

                    {selectedIds.length > 0 && (
                        <button
                            onClick={downloadPDF}
                            className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                        >
                            <Download size={20} />
                            PDF İndir ({selectedIds.length})
                        </button>
                    )}
                </div>
            </div>

            {/* Selection List */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm h-fit">
                    <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Teklif Seçimi</h2>
                    {loading ? (
                        <p className="text-gray-500">Yükleniyor...</p>
                    ) : offers.length === 0 ? (
                        <p className="text-gray-500">Henüz teklif statüsünde kayıt yok.</p>
                    ) : (
                        <div className="space-y-3">
                            {offers.map(offer => (
                                <div
                                    key={offer.id}
                                    onClick={() => toggleSelection(offer.id)}
                                    className={`p-3 rounded-lg border cursor-pointer flex justify-between items-center transition-colors ${selectedIds.includes(offer.id)
                                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">{offer.customerName}</p>
                                        <p className="text-sm text-gray-500">{offer.policyType.name} - {Number(offer.amount).toLocaleString('tr-TR')} ₺</p>
                                    </div>
                                    {selectedIds.includes(offer.id) && <Check size={20} className="text-orange-600" />}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Comparison Grid */}
                <div className="lg:col-span-2">
                    {selectedIds.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center p-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                            <FileText size={48} className="text-gray-300 mb-4" />
                            <p className="text-gray-500">Karşılaştırmak için soldan en az bir teklif seçin.</p>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="bg-gray-50 dark:bg-gray-700/50">
                                            <th className="p-4 font-semibold text-gray-500 dark:text-gray-400">Özellik</th>
                                            {selectedOffers.map((offer, idx) => (
                                                <th key={offer.id} className="p-4 font-bold text-gray-900 dark:text-white min-w-[200px]">
                                                    <div className="flex justify-between items-start">
                                                        <span>Seçenek {idx + 1}</span>
                                                        <button onClick={() => toggleSelection(offer.id)} className="text-gray-400 hover:text-red-500">
                                                            <X size={16} />
                                                        </button>
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        <tr>
                                            <td className="p-4 font-medium text-gray-600 dark:text-gray-300">Müşteri</td>
                                            {selectedOffers.map(offer => (
                                                <td key={offer.id} className="p-4 text-gray-900 dark:text-white">{offer.customerName}</td>
                                            ))}
                                        </tr>
                                        <tr>
                                            <td className="p-4 font-medium text-gray-600 dark:text-gray-300">Sigorta Şirketi</td>
                                            {selectedOffers.map(offer => (
                                                <td key={offer.id} className="p-4 text-gray-900 dark:text-white">{offer.branch.name}</td>
                                            ))}
                                        </tr>
                                        <tr>
                                            <td className="p-4 font-medium text-gray-600 dark:text-gray-300">Ürün</td>
                                            {selectedOffers.map(offer => (
                                                <td key={offer.id} className="p-4 text-gray-900 dark:text-white">{offer.policyType.name}</td>
                                            ))}
                                        </tr>
                                        <tr>
                                            <td className="p-4 font-medium text-gray-600 dark:text-gray-300">Tarihler</td>
                                            {selectedOffers.map(offer => (
                                                <td key={offer.id} className="p-4 text-gray-900 dark:text-white">
                                                    {offer.startDate ? format(new Date(offer.startDate), 'dd.MM.yyyy') : '-'} <br />
                                                    <span className="text-gray-400 text-xs text-center block w-4">↓</span>
                                                    {offer.endDate ? format(new Date(offer.endDate), 'dd.MM.yyyy') : '-'}
                                                </td>
                                            ))}
                                        </tr>
                                        <tr className="bg-orange-50/50 dark:bg-orange-900/10">
                                            <td className="p-4 font-bold text-gray-800 dark:text-gray-200">FİYAT</td>
                                            {selectedOffers.map(offer => {
                                                const isCheapest = offer.amount === String(Math.min(...selectedOffers.map(o => Number(o.amount))));
                                                return (
                                                    <td key={offer.id} className={`p-4 font-bold text-lg ${isCheapest ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                                                        {Number(offer.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                                        {isCheapest && <span className="block text-xs font-normal text-green-600 mt-1">En Uygun</span>}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QuoteComparisonPage;

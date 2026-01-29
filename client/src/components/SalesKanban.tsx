import { MoreVertical, User, FileText, Building2, Upload } from 'lucide-react';

interface SalesKanbanProps {
    sales: any[];
    onStatusChange: (saleId: string, newStatus: string) => void;
    onEdit: (sale: any) => void;
    onShowDocs: (saleId: string) => void;
}

const statusColumns = [
    { id: 'LEAD', label: 'Müşteri Adayı', color: 'bg-blue-500' },
    { id: 'OFFER', label: 'Teklif Verildi', color: 'bg-orange-500' },
    { id: 'ACTIVE', label: 'Aktif Poliçe', color: 'bg-emerald-500' },
    { id: 'LOST', label: 'Kaybedildi', color: 'bg-red-500' },
    { id: 'CANCELLED', label: 'İptal Edildi', color: 'bg-gray-500' },
];

export default function SalesKanban({ sales, onStatusChange, onEdit, onShowDocs }: SalesKanbanProps) {
    const handleDragStart = (e: React.DragEvent, saleId: string) => {
        e.dataTransfer.setData('saleId', saleId);
    };

    const handleDrop = (e: React.DragEvent, newStatus: string) => {
        const saleId = e.dataTransfer.getData('saleId');
        onStatusChange(saleId, newStatus);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    return (
        <div className="flex gap-6 h-full min-h-[600px] p-6 bg-gray-50/30 overflow-x-auto">
            {statusColumns.map((column) => (
                <div
                    key={column.id}
                    className="flex-1 flex flex-col min-w-[320px]"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, column.id)}
                >
                    <div className="flex items-center justify-between mb-4 px-2">
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${column.color}`}></div>
                            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widest">{column.label}</h3>
                            <span className="bg-white border border-gray-100 text-gray-500 px-2 py-0.5 rounded-lg text-xs font-bold shadow-sm">
                                {sales.filter(s => s.status === column.id).length}
                            </span>
                        </div>
                        <button className="text-gray-400 hover:text-gray-600 transition-colors">
                            <MoreVertical size={16} />
                        </button>
                    </div>

                    <div className="flex-1 space-y-4 min-h-[500px]">
                        {sales
                            .filter((sale) => sale.status === column.id)
                            .map((sale) => (
                                <div
                                    key={sale.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, sale.id)}
                                    onClick={() => onEdit(sale)}
                                    className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-grab active:cursor-grabbing group"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                                                <FileText size={20} />
                                            </div>
                                            <div>
                                                <h4
                                                    className="font-bold text-gray-900 leading-tight hover:text-emerald-600 cursor-pointer"
                                                    onClick={(e) => { e.stopPropagation(); window.location.href = `/customers/${sale.customer?.id || ''}` }}
                                                >
                                                    {sale.customer?.name || sale.customerName}
                                                </h4>
                                                <p className="text-[11px] text-gray-400 font-medium mt-1">{sale.policyNumber}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onShowDocs(sale.id); }}
                                            className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors relative"
                                            title="Belgeler"
                                        >
                                            <Upload size={14} />
                                            {sale._count && sale._count.documents > 0 && (
                                                <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[8px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center border border-white">
                                                    {sale._count.documents}
                                                </span>
                                            )}
                                        </button>
                                    </div>

                                    <div className="mb-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-lg font-extrabold text-gray-900">₺{sale.amount.toLocaleString()}</span>
                                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                                                {sale.policyType?.name || 'Genel'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-600">
                                                <Building2 size={12} className="text-gray-400" />
                                                {sale.branch?.name}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[9px] font-medium text-gray-500 italic">
                                                <User size={12} className="text-gray-400" />
                                                {sale.employee?.name}
                                            </div>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-gray-50 border-2 border-white flex items-center justify-center text-[10px] font-bold text-gray-500">
                                            {sale.employee?.name?.charAt(0) || 'U'}
                                        </div>
                                    </div>
                                </div>
                            ))}

                        {/* Placeholder for empty column */}
                        {sales.filter(s => s.status === column.id).length === 0 && (
                            <div className="h-32 border-2 border-dashed border-gray-100 rounded-3xl flex items-center justify-center text-gray-300 text-xs font-medium bg-gray-50/50">
                                Buraya sürükleyin
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

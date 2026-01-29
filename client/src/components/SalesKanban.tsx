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
        <div className="flex gap-6 h-full min-h-[600px] p-6 bg-background/50 overflow-x-auto">
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
                            <h3 className="text-sm font-bold text-foreground/70 uppercase tracking-widest">{column.label}</h3>
                            <span className="bg-card border border-border text-muted-foreground px-2 py-0.5 rounded-lg text-xs font-bold shadow-sm">
                                {sales.filter(s => s.status === column.id).length}
                            </span>
                        </div>
                        <button className="text-muted-foreground hover:text-foreground transition-colors">
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
                                    className="bg-card p-5 rounded-2xl border border-border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-grab active:cursor-grabbing group"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-emerald-500/10 group-hover:text-emerald-500 transition-colors">
                                                <FileText size={20} />
                                            </div>
                                            <div>
                                                <h4
                                                    className="font-bold text-foreground leading-tight hover:text-emerald-500 cursor-pointer"
                                                    onClick={(e) => { e.stopPropagation(); window.location.href = `/customers/${sale.customer?.id || ''}` }}
                                                >
                                                    {sale.customer?.name || sale.customerName}
                                                </h4>
                                                <p className="text-[11px] text-muted-foreground font-medium mt-1">{sale.policyNumber}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onShowDocs(sale.id); }}
                                            className="p-1.5 text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors relative"
                                            title="Belgeler"
                                        >
                                            <Upload size={14} />
                                            {sale._count && sale._count.documents > 0 && (
                                                <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[8px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center border border-card">
                                                    {sale._count.documents}
                                                </span>
                                            )}
                                        </button>
                                    </div>

                                    <div className="mb-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-lg font-extrabold text-foreground">₺{sale.amount.toLocaleString()}</span>
                                            <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg">
                                                {sale.policyType?.name || 'Genel'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-border flex items-center justify-between">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground/80">
                                                <Building2 size={12} className="text-muted-foreground/50" />
                                                {sale.branch?.name}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[9px] font-medium text-muted-foreground italic">
                                                <User size={12} className="text-muted-foreground/50" />
                                                {sale.employee?.name}
                                            </div>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-muted border-2 border-card flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                                            {sale.employee?.name?.charAt(0) || 'U'}
                                        </div>
                                    </div>
                                </div>
                            ))}

                        {/* Placeholder for empty column */}
                        {sales.filter(s => s.status === column.id).length === 0 && (
                            <div className="h-32 border-2 border-dashed border-border rounded-3xl flex items-center justify-center text-muted-foreground/20 text-xs font-medium bg-muted/30">
                                Buraya sürükleyin
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

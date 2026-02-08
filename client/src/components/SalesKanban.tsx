import { useNavigate } from 'react-router-dom';
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    useDroppable,
    defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FileText, Building2, Upload, GripVertical } from 'lucide-react';
import { useState } from 'react';

interface SalesKanbanProps {
    sales: any[];
    onStatusChange: (saleId: string, newStatus: string) => void;
    onEdit: (sale: any) => void;
    onShowDocs: (saleId: string) => void;
}

const statusColumns = [
    { id: 'LEAD', label: 'Müşteri Adayı', color: 'bg-blue-500', glow: 'shadow-blue-500/20' },
    { id: 'OFFER', label: 'Teklif Verildi', color: 'bg-orange-500', glow: 'shadow-orange-500/20' },
    { id: 'ACTIVE', label: 'Aktif Poliçe', color: 'bg-emerald-500', glow: 'shadow-emerald-500/20' },
    { id: 'LOST', label: 'Kaybedildi', color: 'bg-red-500', glow: 'shadow-red-500/20' },
    { id: 'CANCELLED', label: 'İptal Edildi', color: 'bg-gray-500', glow: 'shadow-gray-500/20' },
];

function DroppableColumn({
    id,
    children,
    isEmpty
}: {
    id: string;
    children: React.ReactNode;
    isEmpty: boolean;
}) {
    const { setNodeRef, isOver } = useDroppable({
        id,
        data: { status: id }
    });

    return (
        <div
            ref={setNodeRef}
            id={id}
            className={
                `flex-1 space-y-4 p-3 rounded-3xl bg-muted/40 border border-border/50 transition-colors ` +
                (isOver ? 'ring-2 ring-emerald-400/60 bg-emerald-500/5' : '')
            }
        >
            {children}
            {isEmpty && (
                <div className="h-32 border-2 border-dashed border-border/40 rounded-3xl flex items-center justify-center text-muted-foreground/30 text-[10px] font-bold uppercase tracking-widest bg-card/20 group">
                    Buraya Bırakın
                </div>
            )}
        </div>
    );
}

function SortableSaleCard({ sale, onEdit, onShowDocs }: { sale: any, onEdit: (s: any) => void, onShowDocs: (id: string) => void }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: sale.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
    };

    const navigate = useNavigate();

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="group bg-card/60 backdrop-blur-sm p-4 rounded-2xl border border-border shadow-sm hover:shadow-md hover:border-emerald-500/30 transition-all cursor-default"
            onClick={() => onEdit(sale)}
        >
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded-md transition-colors">
                        <GripVertical size={16} className="text-muted-foreground/40" />
                    </div>
                    <div>
                        <h4
                            className="font-bold text-foreground leading-tight hover:text-emerald-600 cursor-pointer text-sm"
                            onClick={(e) => { e.stopPropagation(); navigate(`/app/customers/${sale.customer?.id || ''}`) }}
                        >
                            {sale.customer?.name || sale.customerName}
                        </h4>
                        <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{sale.policyNumber}</p>
                    </div>
                </div>
                <button
                    onClick={(e) => { e.stopPropagation(); onShowDocs(sale.id); }}
                    className="p-1.5 text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors relative"
                    title="Belgeler"
                >
                    <Upload size={14} />
                    {sale._count && sale._count.documents > 0 && (
                        <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[8px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center border border-card shadow-sm">
                            {sale._count.documents}
                        </span>
                    )}
                </button>
            </div>

            <div className="flex items-center justify-between mb-3">
                <span className="text-base font-extrabold text-foreground">₺{sale.amount?.toLocaleString() || '0'}</span>
                <span className="text-[9px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    {sale.policyType?.name || 'Genel'}
                </span>
            </div>

            <div className="pt-3 border-t border-border/50 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <Building2 size={12} className="opacity-50" />
                    <span className="font-medium truncate max-w-[100px]">{sale.branch?.name}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-muted-foreground/60">{sale.employee?.name?.split(' ')[0]}</span>
                    <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-[10px] font-bold text-emerald-700 border border-emerald-200">
                        {sale.employee?.name?.charAt(0) || 'U'}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function SalesKanban({ sales, onStatusChange, onEdit, onShowDocs }: SalesKanbanProps) {
    const [activeId, setActiveId] = useState<string | null>(null);
    const activeSale = activeId ? sales.find(s => s.id === activeId) : null;

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const saleId = active.id as string;
        const overId = over.id as string;

        // Prefer droppable column status
        const overStatus = (over.data?.current as any)?.status as string | undefined;
        if (overStatus) {
            if (activeSale && activeSale.status !== overStatus) {
                onStatusChange(saleId, overStatus);
            }
            return;
        }

        // If dropped over another card, use that card's status
        const overSale = sales.find(s => s.id === overId);
        if (overSale && activeSale && activeSale.status !== overSale.status) {
            onStatusChange(saleId, overSale.status);
        }
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="flex gap-6 h-full p-6 bg-muted/20 overflow-x-auto min-h-[calc(100vh-320px)] custom-scrollbar">
                {statusColumns.map((column) => (
                    <div
                        key={column.id}
                        id={column.id}
                        className="flex-1 flex flex-col min-w-[300px] max-w-[350px]"
                    >
                        <div className="flex items-center justify-between mb-4 px-2">
                            <div className="flex items-center gap-2.5">
                                <div className={`w-3 h-3 rounded-full ${column.color} ${column.glow} shadow-lg ring-4 ring-white`}></div>
                                <h3 className="text-[11px] font-extrabold text-foreground/80 uppercase tracking-widest">{column.label}</h3>
                                <div className="bg-card/80 backdrop-blur-sm border border-border text-foreground px-2 py-0.5 rounded-lg text-[10px] font-black shadow-sm">
                                    {sales.filter(s => s.status === column.id).length}
                                </div>
                            </div>
                        </div>

                        <DroppableColumn
                            id={column.id}
                            isEmpty={sales.filter(s => s.status === column.id).length === 0}
                        >
                            <SortableContext
                                id={column.id}
                                items={sales.filter(s => s.status === column.id).map(s => s.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                {sales
                                    .filter((sale) => sale.status === column.id)
                                    .map((sale) => (
                                        <SortableSaleCard
                                            key={sale.id}
                                            sale={sale}
                                            onEdit={onEdit}
                                            onShowDocs={onShowDocs}
                                        />
                                    ))}
                            </SortableContext>
                        </DroppableColumn>
                    </div>
                ))}
            </div>

            <DragOverlay dropAnimation={{
                sideEffects: defaultDropAnimationSideEffects({
                    styles: {
                        active: {
                            opacity: '0.5',
                        },
                    },
                }),
            }}>
                {activeSale ? (
                    <div className="bg-card p-4 rounded-2xl border-2 border-emerald-500 shadow-2xl rotate-2 scale-105 cursor-grabbing opacity-90 backdrop-blur-md">
                        <div className="flex items-center gap-3 mb-2">
                            <FileText size={18} className="text-emerald-500" />
                            <h4 className="font-bold text-sm">{activeSale.customer?.name || activeSale.customerName}</h4>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-base font-black">₺{activeSale.amount?.toLocaleString()}</span>
                            <span className="text-[9px] font-bold uppercase text-muted-foreground">{activeSale.policyNumber}</span>
                        </div>
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}

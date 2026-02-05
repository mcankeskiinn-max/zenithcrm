import { X } from 'lucide-react';
import QRCode from 'react-qr-code';

interface QRCodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    customerName: string;
    phone: string;
}

export function QRCodeModal({ isOpen, onClose, customerName, phone }: QRCodeModalProps) {
    if (!isOpen) return null;

    // Format phone for different protocols
    const formattedPhone = phone.replace(/\D/g, '');
    const internationalPhone = formattedPhone.startsWith('0')
        ? '90' + formattedPhone.substring(1)
        : formattedPhone.startsWith('90')
            ? formattedPhone
            : '90' + formattedPhone;

    const whatsappUrl = `https://wa.me/${internationalPhone}`;
    const smsUrl = `sms:+${internationalPhone}`;
    const telUrl = `tel:+${internationalPhone}`;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-card rounded-[32px] border border-border shadow-2xl max-w-2xl w-full p-8 animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-black text-foreground">Mobil Cihazınızla İletişim Kur</h2>
                        <p className="text-sm text-muted-foreground font-medium mt-1">
                            {customerName} ile iletişime geçmek için QR kodu taratın
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-muted rounded-xl transition-colors"
                    >
                        <X size={24} className="text-muted-foreground" />
                    </button>
                </div>

                {/* QR Codes Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* WhatsApp QR */}
                    <div className="flex flex-col items-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl border border-green-100">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white mb-4 shadow-lg shadow-green-500/20">
                            <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                            </svg>
                        </div>
                        <div className="bg-white p-4 rounded-2xl shadow-sm mb-4">
                            <QRCode value={whatsappUrl} size={140} />
                        </div>
                        <p className="text-sm font-bold text-green-700">WhatsApp</p>
                        <p className="text-xs text-green-600 text-center mt-1">Mesaj göndermek için taratın</p>
                    </div>

                    {/* SMS QR */}
                    <div className="flex flex-col items-center p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-3xl border border-blue-100">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white mb-4 shadow-lg shadow-blue-500/20">
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                        </div>
                        <div className="bg-white p-4 rounded-2xl shadow-sm mb-4">
                            <QRCode value={smsUrl} size={140} />
                        </div>
                        <p className="text-sm font-bold text-blue-700">SMS</p>
                        <p className="text-xs text-blue-600 text-center mt-1">SMS göndermek için taratın</p>
                    </div>

                    {/* Phone QR */}
                    <div className="flex flex-col items-center p-6 bg-gradient-to-br from-orange-50 to-amber-50 rounded-3xl border border-orange-100">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white mb-4 shadow-lg shadow-orange-500/20">
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                        </div>
                        <div className="bg-white p-4 rounded-2xl shadow-sm mb-4">
                            <QRCode value={telUrl} size={140} />
                        </div>
                        <p className="text-sm font-bold text-orange-700">Telefon</p>
                        <p className="text-xs text-orange-600 text-center mt-1">Aramak için taratın</p>
                    </div>
                </div>

                {/* Instructions */}
                <div className="mt-6 p-4 bg-muted/50 rounded-2xl border border-border">
                    <p className="text-xs font-bold text-muted-foreground text-center">
                        📱 Telefonunuzun kamera uygulamasını açın ve QR kodu taratın
                    </p>
                </div>
            </div>
        </div>
    );
}


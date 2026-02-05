import { GoogleGenerativeAI } from '@google/generative-ai';
import { SUPPORT_AGENT_PROMPT } from '../config/ai-agent-prompt';
import { SupportService } from './support.service';
import { SupportStatus } from '@prisma/client';

export class AISupportService {
    private static genAI: GoogleGenerativeAI | null = null;
    private static model: any = null;

    private static init() {
        const apiKey = process.env.GOOGLE_AI_API_KEY;
        if (apiKey) {
            this.genAI = new GoogleGenerativeAI(apiKey);
            this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        }
    }

    static async processSupportMessage(messageId: string) {
        if (!this.model) this.init();

        const supportMessage = await SupportService.getMessageById(messageId);
        if (!supportMessage) return;

        // Update status to processing
        await SupportService.updateStatus(messageId, SupportStatus.PROCESSING);

        try {
            let aiResponse = "";

            if (this.model) {
                const prompt = `${SUPPORT_AGENT_PROMPT}\n\nKullanıcı Mesajı: ${supportMessage.message}\n\nKullanıcı Bilgileri: ${JSON.stringify({
                    id: supportMessage.user.id,
                    name: supportMessage.user.name,
                    role: supportMessage.user.role,
                    tenantId: supportMessage.user.tenantId
                })}\n\nLütfen bu sorunu analiz et ve bir çözüm öner.`;

                const result = await this.model.generateContent(prompt);
                aiResponse = result.response.text();
            } else {
                // Mock response if API key is missing
                aiResponse = "⚠️ [SİSTEM NOTU: Google AI API anahtarı ayarlanmamış. Bu simüle edilmiş bir yanıttır.]\n\nMerhaba! Destek talebiniz alındı. ZenithCRM teknik destek asistanı olarak size yardımcı olmaya hazırım. Belirttiğiniz sorun ('" + supportMessage.message + "') inceleniyor. Lütfen .env dosyasında GOOGLE_AI_API_KEY değişkeninin ayarlı olduğundan emin olun.";
            }

            // Update with response
            await SupportService.updateMessageResponse(messageId, aiResponse, SupportStatus.RESOLVED);
        } catch (error) {
            console.error('AI Processing Error:', error);
            await SupportService.updateMessageResponse(
                messageId,
                "Üzgünüm, talebinizi işlerken bir hata oluştu. Lütfen daha sonra tekrar deneyin veya sistem yöneticisine başvurun.",
                SupportStatus.FAILED
            );
        }
    }
}

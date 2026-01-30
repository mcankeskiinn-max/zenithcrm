export class EmailService {
    static async sendResetPasswordEmail(email: string, token: string) {
        const baseUrl = process.env.CLIENT_URL || process.env.CORS_ORIGIN || 'http://localhost:5173';
        const resetUrl = `${baseUrl}/reset-password?token=${token}`;
        const apiKey = process.env.SMTP_PASS || ''; // Resend API key is stored in SMTP_PASS

        const htmlContent = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #059669;">ZenithCRM Şifre Sıfırlama</h2>
                <p>Merhaba,</p>
                <p>Hesabınız için bir şifre sıfırlama talebi aldık. Şifrenizi sıfırlamak için aşağıdaki butona tıklayın:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetUrl}" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Şifremi Sıfırla</a>
                </div>
                <p>Bu buton çalışmıyorsa aşağıdaki bağlantıyı tarayıcınıza kopyalayabilirsiniz:</p>
                <p style="word-break: break-all; color: #666; font-size: 14px;">${resetUrl}</p>
                <p style="margin-top: 30px; font-size: 12px; color: #999;">Bu talebi siz yapmadıysanız bu e-postayı görmezden gelebilirsiniz. Link 1 saat boyunca geçerlidir.</p>
            </div>
        `;

        // Development fallback
        if (process.env.NODE_ENV !== 'production' && !apiKey) {
            console.log('--- DEVELOPMENT MODE: Email Reset URL ---');
            console.log(`Email to: ${email}`);
            console.log(`Reset link: ${resetUrl}`);
            console.log('-----------------------------------------');
            return { messageId: 'dev-mock-id' };
        }

        try {
            console.log('Attempting to send email via Resend API to:', email);
            const response = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    from: 'ZenithCRM <onboarding@resend.dev>',
                    to: [email],
                    subject: 'Şifre Sıfırlama İsteği - ZenithCRM',
                    html: htmlContent,
                }),
            });

            const result = await response.json();
            console.log('Resend API Response Status:', response.status);
            console.log('Resend API Response Body:', result);

            if (!response.ok) {
                throw new Error(`Resend API Error: ${JSON.stringify(result)}`);
            }

            return result;
        } catch (error) {
            console.error('EmailService Error:', error);
            throw error;
        }
    }
}

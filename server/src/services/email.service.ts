import nodemailer from 'nodemailer';

export class EmailService {
    private static transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.ethereal.email',
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER || '',
            pass: process.env.SMTP_PASS || '',
        },
    });

    static async sendResetPasswordEmail(email: string, token: string) {
        const baseUrl = process.env.CLIENT_URL || process.env.CORS_ORIGIN || 'http://localhost:5173';
        const resetUrl = `${baseUrl}/reset-password?token=${token}`;

        const mailOptions = {
            from: '"ZenithCRM" <noreply@zenithcrm.com>',
            to: email,
            subject: 'Şifre Sıfırlama İsteği - ZenithCRM',
            html: `
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
            `,
        };

        // If we are in development and no SMTP is set, use Ethereal
        if (process.env.NODE_ENV !== 'production' && !process.env.SMTP_USER) {
            console.log('--- DEVELOPMENT MODE: Email Reset URL ---');
            console.log(`Email to: ${email}`);
            console.log(`Reset link: ${resetUrl}`);
            console.log('-----------------------------------------');
            return { messageId: 'dev-mock-id' };
        }

        return this.transporter.sendMail(mailOptions);
    }
}

import { Request, Response } from 'express';
import { SupportService } from '../services/support.service';
import { AISupportService } from '../services/ai-support.service';
import { SupportStatus } from '@prisma/client';

export class SupportController {
    static async createMessage(req: Request, res: Response) {
        try {
            const { message, metadata } = req.body;
            const userId = (req as any).user.id;

            if (!message) {
                return res.status(400).json({ error: 'Mesaj alanı boş bırakılamaz' });
            }

            const supportMessage = await SupportService.createMessage(userId, message, metadata);

            // Trigger AI processing in the background
            AISupportService.processSupportMessage(supportMessage.id).catch(err => {
                console.error('Background AI processing failed:', err);
            });

            res.status(201).json(supportMessage);
        } catch (error) {
            console.error('Support creation error:', error);
            res.status(500).json({ error: 'Destek talebi oluşturulurken bir hata oluştu' });
        }
    }

    static async getMessages(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const messages = await SupportService.getMessages(userId);
            res.json(messages);
        } catch (error) {
            console.error('Support fetch error:', error);
            res.status(500).json({ error: 'Destek talepleri getirilirken bir hata oluştu' });
        }
    }

    static async getMessageById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const currentUser = (req as any).user;
            const message = await SupportService.getMessageById(
                id,
                currentUser.role === "ADMIN" ? undefined : currentUser.id
            );

            if (!message) {
                return res.status(404).json({ error: 'Mesaj bulunamadı' });
            }

            // Check if user owns the message or is admin
            if (message.userId !== currentUser.id && currentUser.role !== 'ADMIN') {
                return res.status(403).json({ error: 'Bu mesaja erişim yetkiniz yok' });
            }

            res.json(message);
        } catch (error) {
            console.error('Support detail fetch error:', error);
            res.status(500).json({ error: 'Destek talebi detayı getirilirken bir hata oluştu' });
        }
    }
}

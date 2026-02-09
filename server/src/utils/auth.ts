import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET missing');
    }
    if (process.env.NODE_ENV === 'production' && secret.length < 64) {
        throw new Error('JWT_SECRET too short');
    }
    return secret;
};

export const hashPassword = async (password: string) => {
    return await bcrypt.hash(password, 10);
};

export const comparePassword = async (password: string, hash: string) => {
    return await bcrypt.compare(password, hash);
};

export const generateToken = (payload: Record<string, unknown>) => {
    const secret = getJwtSecret();
    return jwt.sign(payload, secret, { expiresIn: '1d' });
};

export const verifyToken = (token: string) => {
    const secret = getJwtSecret();
    return jwt.verify(token, secret);
};

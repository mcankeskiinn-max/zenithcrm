import { v2 as cloudinary } from 'cloudinary';

const cloudName = process.env.CLOUDINARY_CLOUD_NAME || '';
const apiKey = process.env.CLOUDINARY_API_KEY || '';
const apiSecret = process.env.CLOUDINARY_API_SECRET || '';
const folder = process.env.CLOUDINARY_FOLDER || 'zenithcrm';

let configured = false;
const ensureConfig = () => {
    if (configured) return;
    if (!cloudName || !apiKey || !apiSecret) {
        throw new Error('Cloudinary config missing: CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET');
    }
    cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret
    });
    configured = true;
};

export const uploadFile = async (filePath: string, mimetype: string, tenantId: string) => {
    ensureConfig();
    const isPdf = mimetype.includes('pdf');
    const resourceType = isPdf ? 'raw' : 'image';
    const publicIdPrefix = `${folder}/${tenantId}`;

    const result = await cloudinary.uploader.upload(filePath, {
        resource_type: resourceType,
        folder: publicIdPrefix,
        use_filename: true,
        unique_filename: true
    });

    return {
        url: result.secure_url,
        publicId: result.public_id,
        resourceType
    };
};

export const deleteFile = async (publicId: string, mimetype: string) => {
    ensureConfig();
    const isPdf = mimetype.includes('pdf');
    const resourceType = isPdf ? 'raw' : 'image';
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
};

import {Request} from "express";
import sharp from "sharp";
import Logger from "../../config/logger";
const baseImagesPath =  "storage/images/";

const saveFileToStorage = async (req: Request): Promise<string[]> => {
    try {
        const imageData = await sharp(req.body);
        const metadata = await sharp(req.body).metadata();
        const imageName = `user_${Date.now()}.` + metadata.format;
        if (["jpeg","gif","jpg","png"].includes(metadata.format)) {
            await imageData.toFile(baseImagesPath + imageName);
        }
        return [imageName, metadata.format];
    } catch (err) {
        Logger.error(err);
        return null;
    }
}

export {
    saveFileToStorage
}
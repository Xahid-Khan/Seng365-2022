import {Request, Response} from "express";
import * as auctionCRUD from "../models/auction.model"
import Logger from "../../config/logger";
import * as File from "mz/fs";
const baseImagesPath =  "storage/images/";
import * as imageProcessing from "../middleware/imageService";


/**
 * This method will get auction image provided auction id.
 * @param req http request body
 * @param res http response body
 */
const getAuctionImageById = async (req: Request, res: Response) : Promise<void> => {
    try {
        const auctionId = parseInt(req.params.id, 10);
        const imageName = await auctionCRUD.getAuctionImageById(auctionId);
        if (imageName.length > 0 && imageName[0].image_filename !== 'null') {
            const photo = await File.readFile(baseImagesPath + imageName[0].image_filename);
            res.status(200)
                .contentType(imageName[0].image_filename.split(".")[1])
                .send(photo);
        } else {
            res.status(404)
                .send("No image found.")
        }
        return;
    } catch (err) {
        Logger.error(err);
        res.status(500)
            .send("Internal Server Error.");
        return;
    }
}


/**
 * This method will UPDATE auction image provided auction id. Allowed Types are JPEG, GIF, JPG, PNG
 * @param req http request body
 * @param res http response body
 */
const addAuctionImage = async (req: Request, res: Response) : Promise<void> => {
    try {
        const auctionId = parseInt(req.params.id, 10);
        const auction = await auctionCRUD.getAuctionById(auctionId);
        if (auction.title.length > 0) {
            if (req.body.authenticatedUserId === auction.sellerId) {
                const fileDetails = await imageProcessing.saveFileToStorage(req);
                if (fileDetails !== null && ["jpeg", "gif", "jpg", "png"].includes(fileDetails[1])) {
                    if (auction.image_filename !== 'null') {
                        await auctionCRUD.updateAuctionImage(fileDetails[0], auctionId);
                        res.status(200)
                            .json("Updated A File"); return ;
                    } else {
                        await auctionCRUD.updateAuctionImage(fileDetails[0], auctionId);
                        res.status(201)
                            .json("Added A File"); return ;
                    }
                } else {
                    res.status(400)
                        .json("Invalid File Type."); return ;
                }
            } else {
                res.status(403)
                    .json("Forbidden - You cannot make changes to others' auctions."); return ;
            }
        } else {
            res.status(404)
                .json("Invalid Auction Id."); return ;
        }
    } catch (err) {
        Logger.error(err);
        res.status(500)
            .json("Internal Server Error."); return;
    }
}


export {
    getAuctionImageById,
    addAuctionImage
}
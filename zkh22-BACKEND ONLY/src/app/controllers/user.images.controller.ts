import {Request, Response} from "express";
import * as userCRUD from "../models/users.model";
import Logger from "../../config/logger";
import * as File from "mz/fs";
const baseImagesPath =  "storage/images/";
import * as imageProcessing from "../middleware/imageService";

/**
 * This method will query the database for user-photo.
 * @param req http request body
 * @param res http response body
 */
const getUsersPhoto = async (req: Request, res: Response) : Promise<void> => {
    try {
        const userId = req.params.id;
        const fileName = await userCRUD.getPhotoOfUser(Number(userId));

        if (fileName == null) {
            Logger.error(`User ID - ${userId} Does Not Exist In The Database`);
            res.status(404)
                .json("Invalid User ID - User does not exist in the database."); return ;
        } else if (fileName.userPhoto === null) {
            res.status(404)
                .json("Photo does not exist in the database."); return ;
        } else {
            Logger.info("User photo was retrieved using user ID " + userId);

            const photo = await File.readFile(baseImagesPath + fileName.userPhoto);

            res.status(200)
                .contentType(fileName.userPhoto.split(".")[1])
                .send(photo);
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
 * This method will make sure that user is logged in before he/she can make any changes. User can update/remote photo
 * from his/her file.
 * @param req http request body
 * @param res http response body
 */
const updateUserPhotoById = async (req: Request, res: Response) : Promise<any> => {
    try {
        const paramId = parseInt(req.params.id, 10);
        const user = await userCRUD.getUserById(paramId);
        let imageName = null;
        if (req.body.authenticatedUserId === user[0].id) {
            if (req.header("Content-type") !== undefined) {
                const aboutFile = await imageProcessing.saveFileToStorage(req);
                if (aboutFile !== null && ["jpeg","gif","jpg","png"].includes(aboutFile[1])) {
                    imageName = "'" + aboutFile[0] + "'";
                } else {
                    res.status(400)
                        .json("Invalid File Type"); return ;
                }
            }
            const updateOutcome = await userCRUD.updateUserById(`UPDATE user SET image_filename = ${imageName} WHERE id = ${paramId}`);
            if (updateOutcome) {
                if (imageName != null) {
                    res.status(201)
                        .json('Successful'); return ;
                } else {
                    res.status(200)
                        .json('Successful'); return ;
                }
            } else {
                res.status(400)
                    .json("Invalid Request"); return ;
            }
        } else {
            res.status(403)
                .json("Forbidden Request"); return ;
        }
    } catch (err) {
        Logger.error(err);
        res.status(500)
            .send("Internal Server Error")
    }
}





export {
    getUsersPhoto,
    updateUserPhotoById
}
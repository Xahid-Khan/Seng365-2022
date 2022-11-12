import {NextFunction, Request, Response} from "express";
import * as userCRUD from "../models/users.model";
import Logger from "../../config/logger";
import * as Console from "console";

const authenticateLogin = async (req: Request, res: Response, next: NextFunction) : Promise<any> => {
    const token = req.header("X-Authorization");
    try {
        const dbUser = await userCRUD.getUserByToken(token);
        if (token === 'null' || dbUser.length === 0) {
            res.statusMessage = "Unauthorised";
            res.status(401)
                .send("Login Required");
        } else {
            req.body.authenticatedUserId = dbUser[0].id;
            next();
        }
    } catch (err) {
        Logger.error(err);
        res.status(500)
            .send("Internal Server Error");
    }
}

export {
    authenticateLogin
}
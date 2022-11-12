import {rootUrl} from "./base.routes";
import {Express} from "express";
import * as userImages from "../controllers/user.images.controller";
import {authenticateLogin} from "../middleware/user.authentication";

module.exports = (app: Express) => {
    app.route(rootUrl + "/users/:id/image")
        .get(userImages.getUsersPhoto);
    app.route(rootUrl + '/users/:id/image')
        .delete(authenticateLogin, userImages.updateUserPhotoById);
    app.route(rootUrl + '/users/:id/image')
        .put(authenticateLogin, userImages.updateUserPhotoById);
}
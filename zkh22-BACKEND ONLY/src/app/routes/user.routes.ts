import {rootUrl} from "./base.routes";
import {Express} from "express";
import * as authenticate from "../middleware/user.authentication";

import * as users from "../controllers/users.controller"

module.exports = (app: Express) => {
    app.route(rootUrl + "/users/register")
        .post(users.registerNewUser);
    app.route(rootUrl + "/users/login")
        .post(users.loginConfirmation);
    app.route((rootUrl + "/users/logout"))
        .post(authenticate.authenticateLogin, users.logoutUser)
    app.route(rootUrl + "/users/:id")
        .get(authenticate.authenticateLogin, users.getUserById);
    app.route(rootUrl + '/users/:id')
        .patch(authenticate.authenticateLogin, users.updateUserById);
};
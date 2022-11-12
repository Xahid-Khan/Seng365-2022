import {rootUrl} from "./base.routes";
import {Express} from "express";

import * as auctions from "../controllers/auction.controller";
import {authenticateLogin} from "../middleware/user.authentication";

module.exports = (app: Express) => {
    app.route(rootUrl + '/auctions')
        .get(auctions.getAllAuctions);
    app.route(rootUrl + "/auctions/categories")
        .get(auctions.getAuctionCategories)
    app.route(rootUrl + '/auctions/:id')
        .get(auctions.getDetailsOfAuctionById);
    app.route(rootUrl + '/auctions')
        .post(authenticateLogin, auctions.createNewAuction);
    app.route(rootUrl + '/auctions/:id')
        .delete(authenticateLogin, auctions.deleteAuctionById);
    app.route(rootUrl + "/auctions/:id")
        .patch(authenticateLogin, auctions.updateAuctionById);

}

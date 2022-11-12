import {Express} from "express";
import {rootUrl} from "./base.routes";
import * as auctionImages from "../controllers/auction.images.controller"
import {authenticateLogin} from "../middleware/user.authentication";

module.exports = (app: Express) => {
    app.route(rootUrl + "/auctions/:id/image")
        .get(auctionImages.getAuctionImageById);
    app.route((rootUrl + "/auctions/:id/image"))
        .put(authenticateLogin, auctionImages.addAuctionImage);
}
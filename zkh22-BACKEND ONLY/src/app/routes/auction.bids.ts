import {Express} from "express";
import {rootUrl} from "./base.routes";
import * as bidController from "../controllers/aucitonBidController";
import {authenticateLogin} from "../middleware/user.authentication";

module.exports = (app: Express) => {
    app.route(rootUrl + '/auctions/:id/bids')
        .get(bidController.getAllBidsById);
    app.route(rootUrl + '/auctions/:id/bids')
        .post(authenticateLogin, bidController.bidOnAuction)
}
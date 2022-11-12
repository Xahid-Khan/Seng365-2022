import {Request, Response} from "express";
import Logger from "../../config/logger";
import * as userCRUD from "../models/users.model";
import * as auctionCRUD from "../models/auction.model";
import * as auctionBidCRUD from "../models/auction.bid.model";
import * as Console from "console";


const getAllBidsById = async (req: Request, res: Response) : Promise<void> => {
    try {
        const param = req.params.id;
        const listOfBids = await auctionBidCRUD.getBidsById(param);
        if (listOfBids.length > 0) {
            res.status(200)
                .json(listOfBids);
        } else {
            res.status(404)
                .json("Invalid auction ID or There are no bids on this auction."); return;
        }
        return ;
    } catch (err) {
        Logger.error(err);
        res.status(500)
            .json("Internal Server Error."); return;
        return ;
    }
}



const bidOnAuction = async (req: Request, res: Response): Promise<any> => {
    try {
        const auctionId = parseInt(req.params.id, 10);
        const bidderId = req.body.authenticatedUserId;
        const auctionDetails = await auctionCRUD.getAuctionById(auctionId);

        if (auctionDetails != null) {
            if (bidderId !== auctionDetails.sellerId) {
                const currentDate = new Date();
                const bidAmount = parseInt(req.body.amount, 10);

                if (bidAmount <= auctionDetails.highestBid) {
                    res.status(400)
                        .json("Bid amount needs to be more then current bid."); return;
                } else if (auctionDetails.endDate <= currentDate) {
                    res.status(400)
                        .json("Auction has been closed"); return;
                } else {
                    const bidOutcome = await auctionBidCRUD.putOnABid(bidAmount, auctionId, bidderId, currentDate );
                    if (bidOutcome) {
                        res.status(201)
                            .json("Bid Placed successfully"); return;
                    } else {
                        res.status(400)
                            .json("Bid must be higher than the current bid"); return;
                    }
                    return;
                }
            } else {
                res.status(403)
                    .json("You can not bid on your own auction"); return;
            }
        } else {
            res.status(404)
                .json("Auction does not exist"); return;
        }
    } catch (err) {
        Logger.log(err);
        res.status(500)
            .json("Internal Server Error")
    }
    return null;
}


export {
    getAllBidsById,
    bidOnAuction
}
import * as auctionEntity from "../models/auction.model";
import {Request, Response} from "express";
import type {Auction, AuctionList} from "../dataTypes";
import * as Mapper from "../middleware/auction.mapper"
import Logger from "../../config/logger";
import * as Console from "console";


/**
 * This method retrieves all the auctions, with maximum bid and total number of bids.
 * @param req HTTP request
 * @param res HTTP response
 */
const getAllAuctions = async (req: Request, res: Response) : Promise<void> => {
    try {
        const url = new URL(req.url, "http://localhost");
        const params = url.searchParams;

        const sqlConditions = await checkQueryConditions(params);
        if (sqlConditions) {
            const allAuctions = await auctionEntity.getAuctions(sqlConditions[0], sqlConditions[1]);

            let auctionList: Auction[];
            if (sqlConditions[0].length === 0) {
                auctionList = await Mapper.mapToGenericAuction(allAuctions);
            } else {
                auctionList = await Mapper.mapToFilteredAuciton(allAuctions);
            }

            let startIndex = 0;
            let totalItems = auctionList.length;

            if (params.has("count") && !isNaN(Number(params.get("count")))) {
                totalItems = parseInt(params.get("count"), 10);
            }
            if (params.has("startIndex") && !isNaN(Number(params.get("startIndex")))) {
                startIndex = parseInt(params.get("startIndex"), 10);
                startIndex = startIndex <= totalItems ? startIndex : 0;
            }

            const resultedAuctionsList: AuctionList = {
                auctions: auctionList.slice(startIndex, totalItems),
                count: totalItems
            };
            Logger.info("List of all the auctions with Following Filters: " + sqlConditions.join(" "));
            res.status(200)
                .json(resultedAuctionsList);
            return;
        } else {
            res.status(400)
                .json("Invalid Parameter Value"); return ;
        }
    } catch (err) {
        Logger.error(err);
        res.status(500)
            .json("Internal Server Error."); return;
    }
}

/**
 * This method will check for the required conditions in with provided parameters and build the sql accordingly.
 * @param params - List of parameters from URL/Query body
 */
const checkQueryConditions = async (params: any) : Promise<string[]> => {
    try {
        let sqlConditions = "";
        let subCondition = "";
        if (params.has("q")) {
            sqlConditions += `WHERE title LIKE '%${params.get('q')}%'`;
        }
        if (params.has("categoryIds")) {
            if (sqlConditions.length > 0) {
                sqlConditions += ` AND `;
            } else {
                sqlConditions += " WHERE";
            }
            if (parseInt(params.get("categoryIds"), 10)) {
                sqlConditions += ` category_id = ${params.get('categoryIds')}`;
            } else {
                return null;
            }
        }

        if (params.has("sellerId")) {
            if (sqlConditions.length > 0) {
                sqlConditions += ` AND `;
            } else {
                sqlConditions += " WHERE";
            }
            if (parseInt(params.get("sellerId"), 10)) {
                sqlConditions += ` seller_id = ${params.get('sellerId')}`;
            } else {
                return null;
            }
        }
        if (params.has('bidderId')) {
            if (sqlConditions.length > 0) {
                sqlConditions += ` AND `;
            } else {
                sqlConditions += " WHERE";
            }
            if (parseInt(params.get("bidderId"), 10)) {
                sqlConditions += `  ${params.get('bidderId')} IN (SELECT user_id FROM auctionBidView WHERE auctionBidView.auction_id = auctionView.id) `;
            } else {
                return null;
            }
        }

        if (params.has("sortBy") && params.get("sortBy").split("_")[0] in ["ALPHABETICAL", "CLOSING", "BIDS", "RESERVE"]) {
            const sortBy: string[] = params.get('sortBy').split("_");
            if (sortBy.includes('ALPHABETICAL')) {
                subCondition += ' ORDER BY auctionView.title ' + sortBy[1];
            } else if (sortBy.includes('CLOSING')) {
                if (sortBy.includes('SOON')) {
                    subCondition += ' ORDER BY auctionView.end_date DESC ';
                } else {
                    subCondition += ' ORDER BY auctionView.end_date ASC ';
                }
            } else if (sortBy.includes('BIDS')) {
                subCondition += ` ORDER BY maxBid ` + sortBy[1];
            } else {
                subCondition += ' ORDER BY ' + sortBy.join(" ");
            }
        } else {
            subCondition += ' ORDER BY auctionView.end_date, auctionView.id ASC'
        }
        return [sqlConditions, subCondition];
    }  catch (err) {
        Logger.error(err); return;
    }
}

/**
 * This method will request all the categories from the database.
 * @param req HTTP request
 * @param res HTTP response
 */
const getAuctionCategories = async (req: Request, res:Response): Promise<any> => {
    try {
        const listOfCategories = await auctionEntity.getAllCategories();
        if (listOfCategories.length > 0) {
            Logger.info("List of all the categories is sent to the User")
            res.status(200)
                .json(listOfCategories); return;
        } else {
            res.status(400)
                .json("Invalid Request"); return;
        }
    } catch (err) {
        Logger.error(err);
        res.status(500)
            .json("Internal Server Error"); return;
    }
}

/**
 * get all the details of an auction included total number of bids and highest bid.
 * @param req HTTP request
 * @param res HTTP response
 */
const getDetailsOfAuctionById = async (req: Request, res: Response) : Promise<void> => {
    try {
        const params = req.params.id;
        const auctionDetails = await auctionEntity.getAuctionById(parseInt(params, 10));
        if (auctionDetails !== undefined && auctionDetails !== 'null') {
            Logger.info(`Auction ID: ${params} was retrieved.`);
            res.status(200)
                .json(auctionDetails); return ;
        } else {
            Logger.info("Auction view was requested with Invalid Auction ID - " + params);
            res.status(400)
                .json("Invalid Auction ID"); return ;
        }
    } catch (err) {
        Logger.error(err);
        res.status(500)
            .json("Internal Server Error."); return ;
    }
}


/**
 *
 */
const createNewAuction = async (req: Request, res: Response) : Promise<any> => {
    Logger.http("Request to create a new auction");
    try {
        const auctionData = req.body;
        if (auctionData.hasOwnProperty("title") && auctionData.hasOwnProperty("description") &&
            auctionData.hasOwnProperty("endDate") && auctionData.hasOwnProperty("categoryId")) {

            const checkTitleInDB = await auctionEntity.getAuctions(` WHERE title LIKE '${auctionData.title}' `, "");
            const today = new Date();
            const expiry = new Date(auctionData.endDate);
            if (checkTitleInDB.length === 0) {
                Logger.info("There was not matching title / clash");
                if (auctionData.title.trim().length > 0 && auctionData.description.trim().length > 0 &&
                    auctionData.categoryId > 0 && expiry > today) {
                    let reserve = 1;
                    let fileImage = null;
                    if (auctionData.hasOwnProperty("reserve") && auctionData.reserve > 0) {
                        reserve = auctionData.reserve;
                    }
                    if (auctionData.hasOwnProperty("auctionImage") && auctionData.reserve > 0) {
                        fileImage = auctionData.auctionImage;
                    }

                    const newAuctionId = await auctionEntity.insertNewAuction(auctionData.title, auctionData.description,
                                                                            auctionData.endDate, auctionData.categoryId,
                                                                            req.body.authenticatedUserId, reserve, fileImage);
                    if (newAuctionId) {
                        Logger.info("New Auction has been created.");
                        res.status(201)
                            .json({"auctionId": newAuctionId[0].insertId});
                        return;
                    } else {
                        res.status(500)
                            .json("Internal Server Error");
                        return;
                    }

                } else {
                    res.status(400)
                        .json("Title, description, and categoryId can not be empty. End Date needs to be in future");
                    return;
                }
            } else {
                res.status(400)
                    .json("Given Title already exist in the database"); return ;
            }
        } else {
            res.status(400)
                .json("title, description, endDate and categoryId are required fields"); return;
        }
    } catch (err) {
        Logger.error(err);
        res.status(500)
            .json("Internal Server Error"); return ;
    }
}



const deleteAuctionById = async (req: Request, res: Response): Promise<any> => {
    try {
        const auctionId = parseInt(req.params.id, 10);
        const auction = await auctionEntity.getAuctions(` WHERE auctionView.id = ${auctionId} `, "");
        if (auction !== undefined && auction.length > 0) {
            if (auction[0].highestBid !== null) {
                res.status(403)
                    .json("Auction has an active bid, cannot be deleted"); return ;
            } else if (auction[0].sellerId !== req.body.authenticatedUserId) {
                res.status(403)
                    .json("Forbidden"); return ;
            } else {
                await auctionEntity.removeAuction(auctionId);
                res.status(200)
                    .json("Auction Deleted"); return ;
            }
        } else {
            res.status(404)
                .json("Invalid auction ID");
            return;
        }
    } catch (err) {
        res.status(500)
            .json("Internal Server Error"); return ;
    }
}


/**
 *
 * @param req
 * @param res
 */
const updateAuctionById = async (req: Request, res: Response) : Promise<void> => {
    try {
        const auctionId = parseInt(req.params.id, 10);
        const auction = await auctionEntity.getAuctionById(auctionId);
        if (auction !== undefined && auction.title.length > 0) {
            if (req.body.authenticatedUserId === auction.sellerId) {
                if (auction.highestBid === 'null' || auction.highestBid < auction.reserve) {
                    const sqlQuery = updateAuctionQuery(req);
                    const updatedAuction = await auctionEntity.updateAuctionById(sqlQuery, auctionId);
                    res.status(200)
                        .json(updatedAuction); return ;
                } else {
                    res.status(400)
                        .json("Bad Request - Auction has active bid."); return ;
                }
            } else {
                res.status(403)
                    .json("Forbidden - You can only update your auctions"); return ;
            }
        } else {
            res.status(404)
                .json("Invalid Auction ID"); return ;
        }
    } catch (err) {
        Logger.error(err);
        res.status(500)
            .json("Internal Server Error"); return ;
    }

}


const updateAuctionQuery = (req: Request): string => {
    let updateQuery = "";
    if (req.body.hasOwnProperty("title")) {
        updateQuery += " title = '" + req.body.title + "' ";
    }
    if (req.body.hasOwnProperty("description")) {
        if (updateQuery.length > 0) {updateQuery += ", "}
        updateQuery += " description = '" + req.body.description + "' ";
    }
    if (req.body.hasOwnProperty("endDate")) {
        if (updateQuery.length > 0) {updateQuery += ", "}
        updateQuery += " end_date = '" + req.body.endDate + "' ";
    }
    if (req.body.hasOwnProperty("reserve")) {
        if (updateQuery.length > 0) {updateQuery += ", "}
        updateQuery += " reserve = " + req.body.reserve;
    }
    if (req.body.hasOwnProperty("categoryId")) {
        if (updateQuery.length > 0) {updateQuery += ", "}
        updateQuery += " category_id = " + req.body.categoryId;
    }

    return updateQuery;
}



export {
    getAllAuctions,
    getAuctionCategories,
    getDetailsOfAuctionById,
    createNewAuction,
    deleteAuctionById,
    updateAuctionById
}
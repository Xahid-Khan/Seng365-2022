import {getPool} from "../../config/db";
import Logger from "../../config/logger";
import exp from "constants";



/**
 * get all the bids for an auction, including the bidders' details.
 * @param auctionId - Id of the auction
 */
const getBidsById = async (auctionId: string) : Promise<any> => {
    try {
        const connection = await getPool().getConnection();
        const [bidsList] = await connection.query(`SELECT a.user_id AS bidderId, a.amount, u.first_name AS firstName, u.last_name AS lastName, a.timestamp \
                                                    FROM auctionBidView a JOIN userView u ON a.user_id = u.id \
                                                    WHERE auction_id = ${auctionId} ORDER BY amount DESC`);
        return bidsList;
    } catch (err) {
        Logger.error(err);
    }
}



const putOnABid = async (amount: number, auctionId: number, bidderId: number, dateStamp: Date) : Promise<any> => {
    try {
        const connection = await getPool().getConnection();
        await connection.query(`INSERT into auction_bid (auction_id, user_id, amount, timestamp)
                                VALUES (?, ?, ?, ?)`, [auctionId, bidderId, amount, dateStamp]);
        connection.release();
        return true;
    } catch (err) {
        Logger.error(err);
        return false;
    }
}


export {
    getBidsById,
    putOnABid
}
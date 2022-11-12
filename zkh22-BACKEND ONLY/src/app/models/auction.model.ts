import {getPool} from "../../config/db";
import {createDeflateRaw} from "zlib";
import * as Console from "console";
import Logger from "../../config/logger";
import {utimes} from "fs";

/**
 * This method will make sure that we are accessing data from a view not directly from table.
 * Which is secure, so we won't accidentally change any of the data.
 */
export const createViewTable = async (): Promise<void> => {
    try {
        const connection = await getPool().getConnection();

        await connection.query('CREATE OR REPLACE VIEW auctionView AS (SELECT * from auction);\n' +
            'CREATE OR REPLACE VIEW auctionBidView AS (SELECT * from auction_bid);\n' +
            'CREATE OR REPLACE VIEW categoryView AS (SELECT * from category);\n' +
            'CREATE OR REPLACE VIEW userView AS (SELECT id, email, first_name, last_name, image_filename, auth_token from user);');
        connection.release();
    } catch (err) {
    Logger.error(err);
    }
}

/**
 * This Method will retrieve data from the view tables for the user, based on the condition provided in parameteres.
 * @param bidCount - If user wants to see the total number of bids or not otherwise should be an empty string("").
 * @param highestBid - If user we want to show user the current highest bid otherwise should be an empty string("").
 * @param groupBy - column name that user wants to group by otherwise, by default is auciton_id.
 * @param queryConditions - if user wants to filter the data otherwise should be an empty string("").
 * @param sortCondition - specific field user wants to sort by, by default it's auciton end_data.
 */
const getAllAuctionsGeneric = async (bidCount?: string, highestBid?: string, groupBy?: string, queryConditions?: string,
                                     sortCondition?: string): Promise<string> => {
    try {
        const sqlQuery = `SELECT auctionView.id          AS auctionId,
                                 auctionView.title,
                                 auctionView.description,
                                 auctionView.category_id AS categoryId,
                                 auctionView.seller_id   AS sellerId,
                                 userView.first_name     AS sellerFirstName,
                                 userView.last_name      AS sellerLastName,
                                 auctionView.reserve,
                                 auctionView.image_filename,
                                 auctionView.end_date    AS endDate ${bidCount} ${highestBid}
                          FROM auctionView
                                   JOIN categoryView ON auctionView.category_id = categoryView.id
                                   JOiN userView ON auctionView.seller_id = userView.id
                                   LEFT JOIN auctionBidView ON auctionView.id = auctionBidView.auction_id
                              ${queryConditions} ${groupBy} ${sortCondition}`;
        return sqlQuery;
    } catch (err) {
        Logger.error(err);
        return null;
    }
}

/**
 * Query is built depending on parameters and passed on to getAllAucinsGeneric as parameters.
 * @param queryConditions - if there are in WHERE conditions
 * @param subCondition - if there is any sorting condition
 */
const getAuctions = async (queryConditions?: string, subCondition?: string): Promise<any[]> => {
    try {
        await createViewTable();

        const bidCount = `, COUNT(auctionBidView.auction_id) AS numBids`
        const highestBid = `, COALESCE(Max(auctionBidView.amount), null) AS highestBid`;
        const groupBy = ' GROUP BY auctionView.id'
        let sqlQuery = "";
        if (queryConditions.length === 0) {
            sqlQuery = await getAllAuctionsGeneric(bidCount, highestBid, groupBy, "", subCondition);
        } else {
            sqlQuery = await getAllAuctionsGeneric(bidCount, highestBid, groupBy, queryConditions, subCondition);
        }

        const connection = await getPool().getConnection();
        const [allAuctions] = await connection.query(sqlQuery);
        connection.release();
        return allAuctions;
    } catch (err) {
        Logger.error(err);
        return null;
    }
}

/**
 * This method returns a list of all the ids followed by category names.
 */
const getAllCategories = async (): Promise<any> => {
    try {
        const connection = await getPool().getConnection();
        const [allCategories] = await connection.query(`SELECT *
                                                        FROM categoryView`);
        connection.release();
        return allCategories;
    } catch (err) {
        Logger.error(err);
    }
}

/**
 * this method will return the detailed listing of a given auction.
 * @param auctionId - Auction ID of the auction user is interested in.
 */
const getAuctionById = async (auctionId: number) : Promise<any> => {
    try {
        const [auctionDetail] = await getAuctions("WHERE auctionView.id = " + auctionId, "");
        return auctionDetail;
    } catch (err) {
        Logger.error(err);
        return null;
    }
}

/**
 * Find the auction with the given ID and update the image
 * @param imageName
 * @param auctionId
 */
const updateAuctionImage = async (imageName: string, auctionId: number): Promise<any> => {
    try {
        const connection = await getPool().getConnection();
        await connection.query(`UPDATE auction SET image_filename = '${imageName}' WHERE id = ${auctionId}`);
        connection.release();
        return true;
    } catch (err) {
        Logger.error(err);
        return false;
    }
}


/**
 * This method executes the sql statement which returns the name of the image file.
 * @param auctionId - Id of the auction
 */
const getAuctionImageById = async (auctionId: number) : Promise<any> => {
    try {
        const connection = await getPool().getConnection();
        const [imageName] = await connection.query(`SELECT *
                                                    FROM auction
                                                    WHERE id = ${auctionId}`);
        return imageName;
    } catch (err) {
        Logger.error(err);
    }
}


/**
 * This method will execute the sql query to insert a new Auciton into the database.
 * @param title Heading for auction
 * @param description details of an auction
 * @param endDate the last day of the auction which needs to be in future
 * @param categoryId Each auction belongs to one category
 * @param sellerId Id for the User who created an auction
 * @param reserve Minimum selling price
 * @param imageName Photo of the items in an auction
 */
const insertNewAuction = async (title: string, description:string, endDate: any, categoryId: number, sellerId: number, reserve: number, imageName: string): Promise<any> => {
    try {
        const sqlQuery = `INSERT INTO auction
                          (title, description, end_date, category_id, seller_id, reserve, image_filename)
                          VALUES ('${title}', '${description}', "${endDate}", ${categoryId}, ${sellerId}, ${reserve}, "${imageName}")`;
        const connection = await getPool().getConnection();
        const newAuction = await connection.query(sqlQuery);
        connection.release();
        return newAuction;
    } catch (err) {
        Logger.error(err);
        return null;
    }
}

/**
 * Execute Query to delete an Auction with given ID
 * @param auctionId Id of Auction
 */
const removeAuction = async (auctionId: number) : Promise<any> => {
    try {
        const connection = await getPool().getConnection();
        await connection.query(`DELETE FROM auction
                                             WHERE id = ${auctionId}`);
        connection.release();
        return true;
    } catch (err) {
        Logger.error(err)
        return false;
    }
}

/**
 * Check if the acution with given ID exist in the database
 * @param auctionId ID of the Auction
 */
const checkAucitonById = async (auctionId : number) : Promise<void> => {
    try {
        const connection = await getPool().getConnection();
        const [auction] = connection.query(`SELECT * FROM auction WHERE id = ${auctionId}`);
        connection.release();
        return auction;
    } catch (err) {
        Logger.error(err);
        return null;
    }

}

/**
 * Execute SQL Query to update an Auction of given ID
 * @param auctionId Id of an Auciton
 */
const updateAuctionById = async (sqlQuery: string, auctionId: number): Promise<any> => {
    try {
        const connection = await getPool().getConnection();
        await connection.query(`UPDATE auction SET ${sqlQuery} WHERE id = ${auctionId}`);
        const updateAuction = await getAuctionById(auctionId);
        connection.release();
        return updateAuction;
    } catch (err) {
        Logger.error(err);
        return null;
    }
}

/**
 * listed below are the functions, that can be accessed by other modules.
 */
export {
    getAuctions,
    getAllCategories,
    getAuctionById,
    getAuctionImageById,
    insertNewAuction,
    removeAuction,
    updateAuctionImage,
    checkAucitonById,
    updateAuctionById
}
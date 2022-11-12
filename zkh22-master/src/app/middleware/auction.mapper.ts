import {Auction} from "../dataTypes";
import exp from "constants";


const mapToGenericAuction = async (allAuctions: any) : Promise<Auction[]> => {
    const auctionList: Auction[] = [];

    for (const subAuction of allAuctions) {
        const auctionType: Auction = {
            auctionId : subAuction.auctionId,
            title : subAuction.title,
            categories : [subAuction.categoryId],
            sellerId : subAuction.userId,
            sellerFirstName : subAuction.sellerFirstName,
            sellerLastName : subAuction.sellerLastName,
            reserve : subAuction.reserve,
            highestBid : subAuction.highestBid,
            endDate : subAuction.endDate
        }
        auctionList.push(auctionType);
    }
    return auctionList;
}


const mapToFilteredAuciton = async (allAuctions: any) : Promise<Auction[]> => {
    const auctionList: Auction[] = [];

    for (const subAuction of allAuctions) {
        const auctionType: Auction = {
            auctionId : subAuction.auctionId,
            title : subAuction.title,
            description: subAuction.description,
            categoryId : subAuction.categoryId,
            sellerId : subAuction.sellerId,
            sellerFirstName : subAuction.sellerFirstName,
            sellerLastName : subAuction.sellerLastName,
            reserve : subAuction.reserve,
            numBids : subAuction.numBids,
            highestBid : subAuction.highestBid,
            endDate : subAuction.endDate
        }
        auctionList.push(auctionType);
    }
    return auctionList;
}



export {
    mapToGenericAuction,
    mapToFilteredAuciton
}
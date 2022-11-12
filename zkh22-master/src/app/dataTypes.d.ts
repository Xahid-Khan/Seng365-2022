type AuctionList = {
    /**
     * this is list of type auctions.
     */
    auctions: Auction[],

    /**
     * This variable shows the total number of elements in the Auctions List
     */
    count: number
}

type Auction = {
    /**
     * Every auction must have an auction ID if the auction is already in database.
     */
    auctionId?: number,

    /**
     * Every action must have a title.
     */
    title: string,

    /**
     *  Every auction must have some description.
     */
    description?: string,

    /**
     *  Every auction must have at least 1 category, but can relate to multiple categories.
     */
    categories?: number[],

    /**
     *  Every auction has a category ID
     */
    categoryId?: number,

    /**
     * Every auction is listed by a user, hence every auction must have users' ID associated with it.
     */
    sellerId?: number | string,

    /**
     * Every auction is listed by a user, hence every auction must have users' first name associated with it.
     */
    sellerFirstName: string,

    /**
     * Every auction is listed by a user, hence every auction must have users' last name associated with it.
     */
    sellerLastName: string,

    /**
     * reserve is optional as well, as there might be some auctions that does not have any reserve price.
     */
    reserve?: number,

    /**
     * What is the current highest bid, it's an optional field because there might not be any bid currently in which case it would be null
     */
    highestBid?: number,

    /**
     * Total number of bids on this auction
     */
    numBids?: number,

    /**
     * The date and time auction will be closed
     */
    endDate: string

    /**
     * Each auction can have multiple photos
     */
    auctionImage?: string[];
}



type User = {
    /**
     * User ID is optional as it will be available when we get a User, but
     * to create a new user, we won't have any ID associated with user yet.
     */
    userid?: number,

    /**
     * First Name of User will be of type string
     */
    firstName: string,

    /**
     * Last Name of User will be of type string
     */
    lastName: string,

    /**
     * Email of User will be of type string
     */
    email: string,

    /**
     * Password of User will be of type string, and will be hashed later
     */
    password: string,

    /**
     * Every User can have a profile image, but it's not a requirement.
     */
    userPhoto?: string
}

export {
    User,
    Auction,
    AuctionList
}
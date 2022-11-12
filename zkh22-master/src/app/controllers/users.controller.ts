import {Request, Response} from "express";
import {compare, passwordHash} from "../middleware/password.hash";
import * as userCRUD from "../models/users.model";
import * as crypto from "crypto";
import Logger from "../../config/logger";

/**
 * This function will be called when user send a POST request with user data as JSON in body of request.
 * @param req User request from client-end
 * @param res Response to User from server
 */
const registerNewUser = async (req: Request, res: Response) : Promise<void> => {
    try {
        const userData = req.body;
        const checkExistence = await userCRUD.getByEmail(userData.email);

        if (checkExistence == null) {
            if (!userData.hasOwnProperty('firstName') ||
                !userData.hasOwnProperty('lastName') ||
                !userData.hasOwnProperty('email') ||
                !userData.hasOwnProperty('password')) {
                Logger.error("One of the required data flied is missing.");
                res.status(400)
                    .send("To register, you must provide 'firstName', 'lastName', 'email', and 'password'.");
            } else if (userData.firstName.length === 0 || typeof userData.firstName !== "string") {
                Logger.error("First Name is no Filled or is of wrong type.");
                res.status(400)
                    .send("Please enter the Correct First Name.");
            } else if (userData.lastName.length === 0 || typeof userData.lastName !== "string") {
                Logger.error("Last Name is no Filled or is of wrong type.");
                res.status(400)
                    .send("Please enter the Correct Last Name.");
            } else if (!userData.email.includes("@")) {
                res.status(400)
                    .send("Please enter a Valid Email.")
            } else if (userData.password.length === 0) {
                Logger.info("Password is no Filled or is of wrong type.");
                res.status(400)
                    .send("Your password must be minimum of Eight(8) Characters long.");
            } else {
                const insertionOutcome = await userCRUD.insertUser(userData);
                if (insertionOutcome.insertId != null) {
                    res.status(201)
                        .json(JSON.parse('{"userId": ' + insertionOutcome.insertId + '}'));
                } else {
                    res.status(500)
                        .send("Internal Server Error");
                }
            }
        } else {
            res.status(400)
                .send("This Email already exists in the database.");
        }
    } catch (err) {
        Logger.error(err);
        res.status(500)
            .send("Internal Server Error")
    }
};

/**
 * This function will read user email and password from JSON body and validate it.
 * @param req User request from client-end
 * @param res Response to User from server
 */
const loginConfirmation = async (req : Request, res : Response) : Promise<void> => {
    try {
        const userData = req.body;
        const dbUser = await userCRUD.getByEmail(userData.email);
        if (dbUser === null) {
            res.status(400)
                .send("No user found with this email.");
        } else {
            const result = await compare(userData.password, dbUser[0].password);
            if (result) {
                if (dbUser[0].auth_token != null) {
                    res.status(400)
                        .send("User Already Logged In.");
                    return;
                } else {
                    const token = crypto.randomBytes(16).toString("hex");
                    await userCRUD.updateAuthorizationToken(userData.email, token);
                    res.header('X-Authorization', token);
                    req.body.authenticatedUserId = dbUser[0].id;
                    res.status(200)
                        .send(JSON.parse(`{"userId":${dbUser[0].id}, "token": "${token}"}`));
                }
                return;
            } else {
                res.status(400)
                    .send("Invalid User Email or Password.");
                return;
            }
        }
    } catch (err) {
    Logger.error(err);
    res.status(500)
        .send("Internal Server Error");
    return;
    }
}


const logoutUser = async (req: Request, res: Response): Promise<any> => {
    try {
        const token = req.header("X-Authorization");
        const dbUser = await userCRUD.getUserByToken(token);
        await userCRUD.updateAuthorizationToken(dbUser[0].email, null);
        req.body.authenticatedUserId = null;
        res.header("X-Authorization", null);
        res.status(200)
            .send("Logout - Successful");
        return ;
    } catch (err) {
        Logger.error(err);
        res.status(500)
            .send("Internal Server Error.")
    }
}


const getUserById = async (req: Request, res: Response): Promise<any> => {
    try {
        const token = req.header("X-Authorization");
        const paramId = parseInt(req.params.id, 10); // || req.params.user_id;
        const user = await userCRUD.getUserById(paramId);
        if (user.length === 1) {
            let outputData;
            if(req.body.authenticatedUserId === user[0].id){
                outputData = {"firstName" : user[0].first_name, "lastName": user[0].last_name, "email": user[0].email}
            } else {
                outputData = {"firstName" : user[0].first_name, "lastName": user[0].last_name}
            }
            res.status(200)
                .json(outputData);
        } else {
            Logger.info(`Account access request ID - ${paramId}, but user is not logged in.`)
            res.status(404)
                .send("User Does not exist");
        }
    } catch (err) {
        Logger.error(err)
        res.status(500)
            .send("Internal Server Error");
    }
}


const updateUserById = async (req: Request, res: Response) : Promise<any> => {
    try {
        const paramId = parseInt(req.params.id, 10);
        const token = req.header("X-Authorization");
        const data = req.body;
        const user = await userCRUD.getUserById(paramId)
        if (user.length > 0 && user[0].auth_token === token) {
            let sqlQuery = "UPDATE user SET";
            if (data.hasOwnProperty("email") && data.email.includes("@")){
                sqlQuery += ` email = '${data.email}' `;
            }
            if (data.hasOwnProperty("firstName") && data.firstName.length > 0) {
                if (sqlQuery.split(" ").includes('email')) {
                    sqlQuery += ", ";
                }
                sqlQuery += ` first_name = '${data.firstName}' `;
            }
            if (data.hasOwnProperty("lastName") && data.lastName.length > 0){
                const splitSQL = sqlQuery.split(" ");
                if (splitSQL.includes('email') || splitSQL.includes('first_name')) {
                    sqlQuery += ", ";
                }
                sqlQuery += ` last_name = '${data.lastName}' `;
            }
            if (data.hasOwnProperty("currentPassword") && data.hasOwnProperty("password") && data.password.length > 0){
                const splitSQL = sqlQuery.split(" ");
                if (splitSQL.includes('email') || splitSQL.includes('first_name') || splitSQL.includes('last_name')) {
                    sqlQuery += ", ";
                }
                const passwordMatches = await compare(data.currentPassword, user[0].password);
                if (passwordMatches) {
                    sqlQuery += ` password = '${await passwordHash(data.password)}' `;
                } else {
                    res.status(400)
                        .send("password does not match");
                }
                sqlQuery += ` WHERE id = ${paramId}`;

                const updatedUser = await userCRUD.updateUserById(sqlQuery);
                res.status(200)
                    .json(updatedUser); return ;
            }
        } else {
            Logger.error("Attempting to access user ID " + paramId)
            res.status(403)
                .send("Forbidden"); return ;
        }
    } catch (err) {
        Logger.error(err);
        res.status(500)
            .send("Internal Server Error");  return ;
    }
}




export {
    registerNewUser,
    loginConfirmation,
    logoutUser,
    getUserById,
    updateUserById
}
import {getPool} from "../../config/db";
import {passwordHash} from "../middleware/password.hash";
import Logger from '../../config/logger';
import {ResultSetHeader} from "mysql2";

const getUserById = async (userId: number) : Promise<any> => {
    try {
        const connection = await getPool().getConnection();
        const [user] = await connection.query(`SELECT *
                                               FROM user
                                               WHERE id = ?`, [userId]);
        connection.release();
        return user;
    } catch (err) {
        Logger.error(err);
    }
}

const getUserByToken = async (token: string) : Promise<any> => {
    try {
        const connection = await getPool().getConnection();
        const [user] = await connection.query(`SELECT id, email FROM user WHERE auth_token = '${token}'`);
        connection.release();
        return user;
    } catch (err) {
        Logger.error(err);
    }
}

const insertUser = async (data: any): Promise<ResultSetHeader> => {
    try {
        let imageVariable = "";
        let imageName = "";

        if (data.hasOwnProperty("userImage")) {
            imageVariable = ", image_filename";
            imageName = ", '" + data.userImage + "'";
        }

        const connection = await getPool().getConnection();
        data.password = await passwordHash(data.password);
        const sqlQuery = `INSERT INTO user (first_name, last_name, email, password ${imageVariable}) VALUES (?, ?, ?, ? ${imageName})`;
        const [user] = await connection.query(sqlQuery, [data.firstName, data.lastName, data.email, data.password]);
        connection.release();
        Logger.info("New User is successfully added to DB");
        return user;
    } catch (err) {
        Logger.error(err);
        return null;
    }
};

const getByEmail = async (email: string) : Promise<any> => {
    try {
        const sqlQuery = 'SELECT * FROM user WHERE email = (?)';
        const connection = await getPool().getConnection();
        const [user] = await connection.query(sqlQuery, [email]);
        connection.release();
        if (user.length > 0) {
            return user;
        } else {
            Logger.info("Email Does not exist in database.")
            return null;
        }
    } catch (err) {
        Logger.error(err)
    }
}

const updateAuthorizationToken = async (email: string, newToken: string) : Promise<void> => {
    try {
        Logger.info("User Authorization Token has been updated.")
        const sqlQuery = 'UPDATE user set auth_token = ? WHERE email = ?';
        const connection = await getPool().getConnection();
        await connection.query(sqlQuery, [newToken, email]);
        connection.release();
    } catch (err) {
        Logger.error(err);
    }
}

const getPhotoOfUser = async (userId: number) : Promise<any> => {
    try
    {
        const sqlQuery = 'SELECT id AS userId, image_filename AS userPhoto FROM userView Where id = ?';
        const connection = await getPool().getConnection();
        const [fileName] = await connection.query(sqlQuery, [userId]);
        connection.release();

        if (fileName.length > 0) {
            return fileName[0];
        } else {
            Logger.info("User Does Not Exist");
            return null;
        }
    } catch (err) {
        Logger.error(err);
    }
}



const updateUserById = async (sqlQuery: string): Promise<boolean> => {
    try {
        const connection = await getPool().getConnection();
        const updatedUser = await connection.query(sqlQuery);
        connection.release();
        return true;
    } catch (err) {
        Logger.error(err);
        return false
    }
}


export {
    insertUser,
    getByEmail,
    updateAuthorizationToken,
    getPhotoOfUser,
    getUserById,
    getUserByToken,
    updateUserById
}
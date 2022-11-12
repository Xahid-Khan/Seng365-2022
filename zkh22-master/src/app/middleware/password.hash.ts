import bcrypt from 'bcrypt';
import Logger from "../../config/logger";
const SALT_ROUNDS = 10;

const passwordHash = async (password: string) : Promise<string> => {
    return bcrypt.hashSync(password, SALT_ROUNDS);
}

const compare = async (data: string, password: string) : Promise<boolean> => {
    return bcrypt.compareSync(data, password);
}

export {
    passwordHash,
    compare
}

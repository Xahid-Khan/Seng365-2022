import { connect } from './config/db';
import express from './config/express';
import Logger from './config/logger'
import {createViewTable} from "./app/models/auction.model"
const app = express();
const port = process.env.PORT || 4941;

// Connect to MySQL on start
async function main() {
    try {
        await connect();

        // Create Views for all 4 tables
        createViewTable().then(r => Logger.info("View Creation Completed"));

        app.listen(port, () => {
            Logger.info('Listening on port: ' + port)
        });
    } catch (err) {
        Logger.error('Unable to connect to MySQL.')
        process.exit(1);
    }
}

main().catch(err => Logger.error(err));
const mongodb = require("mongodb");

let mongoUrl;

if (process.env.DATABASE_SERVICE_NAME) {
    const mongoServiceName = process.env.DATABASE_SERVICE_NAME.toUpperCase();
    const mongoHost = process.env[mongoServiceName + "_SERVICE_HOST"];
    const mongoPort = process.env[mongoServiceName + "_SERVICE_PORT"];
    const mongoDatabase = process.env[mongoServiceName + "_DATABASE"];
    const mongoPassword = process.env[mongoServiceName + "_PASSWORD"];
    const mongoUser = process.env[mongoServiceName + "_USER"];

    mongoUrl =
        "mongodb://" +
        mongoUser +
        ":" +
        mongoPassword +
        "@" +
        mongoHost +
        ":" +
        mongoPort +
        "/" +
        mongoDatabase;
} else {
    mongoUrl = "mongodb://127.0.0.1:27017/development";
}

let db;

function connect() {
    console.log("Connecting to:", mongoUrl);
    mongodb.connect(mongoUrl, (err, database) => {
        if (err) {
            console.error(err);
            return;
        }

        db = database;
        console.log("Connected to database:", mongoUrl);
    });
}

function close() {
    db.close();
}

function get() {
    return db;
}

const ObjectId = mongodb.ObjectId;

module.exports = {
    connect,
    get,
    close,
    ObjectId
};

const express = require("express");
const morgan = require("morgan");
const mongodb = require("mongodb");

const app = express();

app.use(morgan("combined"));

const PORT = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080;
const IP = process.env.IP || process.env.OPENSHIFT_NODEJS_IP || "0.0.0.0";
let mongoUrl = process.env.OPENSHIFT_MONGODB_DB_URL || process.env.MONGO_URL;

if (!mongoUrl && process.env.DATABASE_SERVICE_NAME) {
    let mongoServiceName = process.env.DATABASE_SERVICE_NAME.toUpperCase();
    let mongoHost = process.env[mongoServiceName + "_SERVICE_HOST"];
    let mongoPort = process.env[mongoServiceName + "_SERVICE_PORT"];
    let mongoDatabase = process.env[mongoServiceName + "_DATABASE"];
    let mongoPassword = process.env[mongoServiceName + "_PASSWORD"];
    let mongoUser = process.env[mongoServiceName + "_USER"];

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
}

let dbo;

mongodb.connect(mongoUrl, (err, db) => {
    if (err) {
        console.error(err);
        return;
    }
    dbo = db;
});

app.get("/", (req, res) => {
    dbo.collection("counts").insert({ ip: req.ip, date: Date.now() });
    dbo.collection("counts")
        .find()
        .toArray((err, result) => {
            res.send(result);
        });
});

app.listen(PORT, IP);

module.exports = app;

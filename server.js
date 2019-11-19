const express = require("express");
const morgan = require("morgan");
const mongodb = require("mongodb");

const app = express();
const { ObjectId } = mongodb;

app.use(morgan("combined"));

const PORT = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080;
const IP = process.env.IP || process.env.OPENSHIFT_NODEJS_IP || "0.0.0.0";
let mongoUrl = process.env.OPENSHIFT_MONGODB_DB_URL || process.env.MONGO_URL;

if (!mongoUrl && process.env.DATABASE_SERVICE_NAME) {
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
}

let db;

mongodb.connect(mongoUrl, (err, database) => {
    if (err) {
        console.error(err);
        return;
    }
    db = database;
    console.log("Connected to MongoDB at: %s", mongoUrl);
});

app.get("/", (req, res) => {
    res.send("Hello");
});

app.get("/events", (req, res) => {
    db.collection("events").insert({ ip: req.ip, date: Date.now() });
    db.collection("events")
        .find()
        .toArray((err, result) => {
            res.send(result);
        });
});

app.get("/event/:id", (req, res) => {
    db.collection("events").findOne(ObjectId(req.params.id), (err, result) =>
        res.send(result)
    );
});

app.listen(PORT, IP);
console.log("Server running on http://%s:%s", IP, PORT);

module.exports = app;

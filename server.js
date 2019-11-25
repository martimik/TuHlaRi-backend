const express = require("express");
const morgan = require("morgan");
const mongodb = require("mongodb");
const session = require("express-session");

const app = express();
const { ObjectId } = mongodb;

app.use(morgan("combined"));

const PORT = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080;
const IP = process.env.IP || process.env.OPENSHIFT_NODEJS_IP || "0.0.0.0";
let mongoUrl = process.env.OPENSHIFT_MONGODB_DB_URL || process.env.MONGO_URL || "mongodb://127.0.0.1:27017/development";

console.log(process.env.MONGO_URL);

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

app.use(session({ secret: 'keyboard cat', cookie: { maxAge: 60000, }}))

app.get("/", (req, res) => {
    res.send("Hello with sessions. :)")
});

app.get("/events", (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    db.collection("events").insert({ ip: req.ip, date: Date.now() });
    db.collection("events")
        .find()
        .toArray((err, result) => {
            res.send(result);
        });
});

app.get("/event/:id", (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    db.collection("events").findOne(ObjectId(req.params.id), (err, result) =>
        res.send(result)
    );
});

app.get("/login/:name.:password", (req, res) => {
    
    
    console.log("name: " + req.params.name);
    console.log("pass: " + req.params.password);

    db.collection("development").findOne({
        "name": req.params.name,
        "password": req.params.password
    }), (err, result) => {
        console.log("ok");
        console.log(result);
        console.log(err);
        if(result != "null"){

            req.session.id = result.id;
            req.session.name = result.name;
            req.session.email = result.email;
            req.session.userGroup = result.userGroup;

            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify({ name: result.name, email: result.email, userGroup: result.userGroup}));
        }
        else{
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify({ error: "Invalid login creditentials."}));
        }
    }
});

app.get("/logout", (req, res) => {
    if (req.session) {
        req.session.destroy(function(err) {
            if(err) {
                return next(err);
            } else {
                req.session = null;
                console.log("logout successful");
                return res.send("Logout");
            }
        });
    }
});

app.listen(PORT, IP);
console.log("Server running on http://%s:%s", IP, PORT);

module.exports = app;


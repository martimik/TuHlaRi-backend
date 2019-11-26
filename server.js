const express = require("express");
const morgan = require("morgan");
const mongodb = require("mongodb");
const session = require("express-session");
const bodyParser = require("body-parser");

const app = express();
const { ObjectId } = mongodb;

app.use(morgan("combined"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(session({ 
    name: 'sessionId',
    secret: 'keyboard cat', 
    cookie: {
        httpOnly: true,
        maxAge: 60000, 
    }
}));

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

app.get("/", (req, res) => {
    res.send(JSON.stringify({ name: req.session.name, email: req.session.email, userGroup: req.session.userGroup}));
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

app.post("/login/", (req, res) => {

    console.log("name: " + req.body.name);
    console.log("pass: " + req.body.password);
    
    db.collection("development").findOne({ name: req.body.name, password: req.body.password}, function(err, result) {

        console.log("ok");
        console.log(result);
        console.log(err);

        if(result != null){

            req.session.id = result.id;
            req.session.name = result.name;
            req.session.email = result.email;
            req.session.userGroup = result.userGroup;

            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify({ name: req.session.name, email: req.session.email, userGroup: req.session.userGroup}));
        }
        else{
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify({ error: "Invalid login creditentials."}));
        }
    });
});

app.get("/logout", (req, res, next) => {
    if (req.session) {
        req.session.destroy(function(err) {
            if(err) {
                next(err);
            } else {
                req.session = null;
                res.write("Logout:");
                res.write(JSON.stringify({ name: req.session.name, email: req.session.email, userGroup: req.session.userGroup}));
                res.send();
            }
        });
    }
});

app.post("/newUser", function(req, res, next) {

    if(req.session.userGroup != 1){
        res.end(JSON.stringify({ error: "Need admin privileges."}));
    } else next();
    }, 
    function(req, res, next){
        if(typeof req.body.name != String || typeof req.body.email != String || typeof req.body.password != String || typeof req.body.userGroup != Int){
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify({ error: "Invalid data :("}));
            res.end();
        } else next();
    },
    function(req, res, next){

    db.collection("development").insert({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        userGroup: req.body.userGroup
    }, function(err, result) {
        if(result.nInserted == 0 || err){
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify({ error: "Insert failed."}));
            next(err);
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.write("Adding user succ :D");
            res.write(JSON.stringify({ name: req.body.name, email: req.body.email, userGroup: req.body.userGroup}));
            res.send();
        }
    });
});

var validateUserData = (req, res, next) => {
    if(typeof req.body.name != String || typeof req.body.email != String || typeof req.body.password != String || typeof req.body.userGroup != Int){
        res.setHeader('Content-Type', 'application/json');
        res.write(JSON.stringify({ error: "Invalid data :("}));
        res.end();
    };
};


app.use(function(err, req, res, next) {
    console.error(err.stack);
    res.status(500).send({ error: err });
})

app.listen(PORT, IP);
console.log("Server running on http://%s:%s", IP, PORT);

module.exports = app;


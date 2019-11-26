const express = require("express");
const morgan = require("morgan");
const mongodb = require("mongodb");
const session = require("express-session");
const cors = require("cors");
const bodyParser = require("body-parser");
const { body, validationResult } = require("express-validator/check");
const sanitizeBody = require("express-validator/filter");
const sha256 = require("sha256");

const app = express();
const { ObjectId } = mongodb;

app.use(morgan("combined"));
app.use(cors());
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

app.post("/login", (req, res) => {

    console.log("name: " + req.body.name);
    console.log("pass: " + req.body.password);

    let passwordHash = sha256(req.body.password);
    
    db.collection("development").findOne({ name: req.body.name, password: passwordHash}, function(err, result) {

        console.log("ok");

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

app.post("/logout", (req, res, next) => {
    if (req.session) {
        req.session.destroy(function(err) {
            if(err) {
                next(err);
            } else {
                req.session = null;
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify({ name: null, email: null, userGroup: null}));
            }
        });
    }
    else {
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({ error: "Session does not exist."}));
    }
});

app.post("/test", 
    [ 
        body('name').isLength({ min: 1 }).isString().escape(),
        body('email').isLength({ min: 1 }).isString().isEmail().escape(),
        body('password').isLength({ min: 1 }).isString().escape(),
        body('userGroup').isLength({ min: 1 }).isString().escape()
    ], function(req, res, next){

    const errors = validationResult(req);
    if(!errors.isEmpty()){
        res.send("error");
    } else {
        res.send("ok");  
    }
}
)

app.post("/newUser",
    [
        body('name').isLength({ min: 1 }).isString().escape(),
        body('email').isLength({ min: 1 }).isString().isEmail().escape(),
        body('password').isLength({ min: 1 }).isString().escape(),
        body('userGroup').isLength({ min: 1 }).isInt().escape()
    ],/*
    function(req, res, next){
        if(req.session.userGroup != "1"){
            res.end(JSON.stringify({ error: "Need admin privileges."}));
        } else next();
    },
*/   function(req, res, next) {

    if(!validationResult(req).isEmpty()){
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({ error: "Invalid form data."}));
    } else next();  
    },
    function(req, res, next){
        console.log(req.body.email)
        db.collection("development").findOne({ email: req.body.email },
        function(err, result) {
            console.log(result);
            if(result != null){
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify({ error: "Email already in use."}));
            } else next();
        }
    )},
    function(req, res, next){

    let passwordHash = sha256(req.body.password);

    db.collection("development").insert({
        name: req.body.name,
        email: req.body.email,
        password: passwordHash,
        userGroup: req.body.userGroup
    }, function(err, result) {
        if(result.nInserted == 0 || err){
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify({ error: "Insert failed."}));
            next(err);
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.write("Adding user succ :D");
            res.write(JSON.stringify({ name: req.body.name, email: req.body.email, password: req.body.password, userGroup: req.body.userGroup}));
            res.send();
        }
    });
});

app.route("/products")
    .post(
        [
            body('productName').isLength({ min: 1 }).isString().escape(),
            body('shortDescription').isLength({ min: 1 }).isString().escape(),
            body('logo').isString().escape().optional(),
            body('longDescription').isString().escape().optional(),
            body('technologies').isString().escape().optional(),
            body('enviromentRequirements').isString().escape().optional(),
            body('customer').isString().escape().optional(),
            body('lifeCycle').isString().escape(),
            body('owner').isString().escape().optional(),
            body('price').isString().escape().optional()
        ], function(req, res, next) {
            console.log("ok?");
            if(!validationResult(req).isEmpty()){
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify({ error: "Invalid form data."}));
            } else next();  
        },/*function(req, res, next) {
            if(req.session.userGroup != ("1" || "2" || "3")){
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: "Insufficient priviledges."}));
            } else next();
        },*/ function(req, res, next) {
            console.log("ok");
            db.collection("development").insert({
                productName: req.body.productName,
                shortDescription: req.body.shortDescription,
                logo: req.body.logo,
                longDescription: req.body.longDescription,
                technologies: req.body.technologies,
                longDescription: req.body.longDescription,
                enviromentRequirements: req.body.enviromentRequirements,
                customer: req.body.customer,
                lifeCycle: req.body.lifeCycle,
                owner: req.body.owner,
                price: req.body.price
            }, function(err, result) {
                if(result.nInserted == 0 || err){
                    res.setHeader('Content-Type', 'application/json');
                    res.send(JSON.stringify({ error: "Insert failed."}));
                    next(err);
                } else {
                    res.setHeader('Content-Type', 'application/json');
                    res.write("Adding product succ :D");
                    res.write(JSON.stringify({ name: req.body.name, shortDescription: req.body.shortDescription}));
                    res.send();
                }
            });
        }
    )

    .get(function (req, res, next) {
        db.collection("development").find({$text: {$search: req.body.search}
        }, function(err, result) {
            if(result == null) {
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify({ error: "Nothing found."}));
                next();
            } else {
                res.setHeader('Content-Type', 'application/json');
                    res.write("Searching product succ :D");
                    console.log(result);
                    res.write(JSON.stringify({
                        productName: result.productName,
                        shortDescription: result.shortDescription,
                        logo: result.logo,
                        longDescription: result.longDescription,
                        technologies: result.technologies,
                        longDescription: result.longDescription,
                        enviromentRequirements: result.enviromentRequirements,
                        customer: result.customer,
                        lifeCycle: result.lifeCycle,
                        owner: result.owner,
                        price: result.price
                    }));
                    res.send();
            }
        }
    );
})

app.use(function(err, req, res, next) {
    console.error(err.stack);
    res.status(500).send({ error: err });
})

app.listen(PORT, IP);
console.log("Server running on http://%s:%s", IP, PORT);

module.exports = app;


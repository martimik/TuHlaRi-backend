const express = require("express");
const fileUpload = require("express-fileupload");
const morgan = require("morgan");
const mongodb = require("mongodb");
const session = require("express-session");
const cors = require("cors");
const bodyParser = require("body-parser");
const { body, validationResult } = require("express-validator/check");
const sha256 = require("sha256");
const auth = require("basic-auth");
const app = express();

const { ObjectId } = mongodb;

const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";

console.log(CORS_ORIGIN);

app.use(morgan("combined"));
app.use(cors({ credentials: true, origin: CORS_ORIGIN }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(fileUpload({ createParentPath: true }));
app.use(express.static(__dirname + "/images"));

app.use(
    session({
        name: "auth",
        secret: "keyboard cat",
        saveUninitialized: false,
        resave: true,
        rolling: true,
        cookie: {
            httpOnly: true,
            maxAge: 1000 * 60 * 30 // 30 minutes
        }
    })
);

const PORT = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080;
const IP = process.env.IP || process.env.OPENSHIFT_NODEJS_IP || "0.0.0.0";

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

mongodb.connect(mongoUrl, (err, database) => {
    console.log(mongoUrl);
    if (err) {
        console.error(err);
        return;
    }
    db = database;
    console.log("Connected to MongoDB at: %s", mongoUrl);
});

app.get("/", (req, res) => {
    res.send("Ok");
});

app.get("/session", (req, res) => {
    res.send({
        name: req.session.name,
        email: req.session.email,
        userGroup: req.session.userGroup
    });
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

app.post("/login", (req, res) => {
    const credentials = auth(req);
    const passwordHash = sha256(credentials.pass);

    db.collection("users").findOne(
        { email: credentials.name, password: passwordHash },
        (err, result) => {
            if (result) {
                req.session.name = result.name;
                req.session.email = result.email;
                req.session.userGroup = result.userGroup;

                res.send({
                    name: req.session.name,
                    email: req.session.email,
                    userGroup: req.session.userGroup
                });
            } else {
                res.send({
                    message: "Invalid credentials",
                    code: "LIF1"
                });
            }
        }
    );
});

app.post("/logout", (req, res, next) => {
    if (req.session) {
        req.session.destroy(err => {
            if (err) {
                next(err);
            } else {
                req.session = null;
                res.setHeader("Content-Type", "application/json");
                res.send({
                    name: null,
                    email: null,
                    userGroup: null
                });
            }
        });
    } else {
        res.setHeader("Content-Type", "application/json");
        res.send(JSON.stringify({ error: "Session does not exist." }));
    }
});

// Adds user to bd with validation of data (change later to valid documentation lenght for password etc.)
app.post(
    "/newUser",
    [
        body("name")
            .isLength({ min: 1 })
            .isString()
            .escape(),
        body("email")
            .isLength({ min: 1 })
            .isString()
            .isEmail()
            .escape(),
        body("password")
            .isLength({ min: 1 })
            .isString()
            .escape(),
        body("userGroup")
            .isLength({ min: 1, max: 1 })
            .isInt()
            .escape()
    ],
    (req, res, next) => {
        if (req.session.userGroup !== "0") {
            res.end(JSON.stringify({ error: "Need admin privileges." }));
        } else next();
    },
    (req, res, next) => {
        if (!validationResult(req).isEmpty()) {
            res.setHeader("Content-Type", "application/json");
            res.status(400);
            res.send({ message: "Failed to create user", code: "NUE1" });
        } else next();
    },
    (req, res, next) => {
        db.collection("users").findOne(
            { email: req.body.email },
            (err, result) => {
                if (result != null) {
                    res.setHeader("Content-Type", "application/json");
                    res.status(400);
                    res.send({
                        message: "Email already in use.",
                        code: "NUE2"
                    });
                } else next();
            }
        );
    },
    (req, res) => {
        const passwordHash = sha256(req.body.password);

        db.collection("users").insert(
            {
                name: req.body.name,
                email: req.body.email,
                password: passwordHash,
                userGroup: req.body.userGroup,
                createdAt: Date.now()
            },
            (err, result) => {
                if (result.nInserted == 0 || err) {
                    res.setHeader("Content-Type", "application/json");
                    res.send(JSON.stringify({ error: "Insert failed." }));
                } else {
                    res.setHeader("Content-Type", "application/json");
                    res.write(JSON.stringify({ message: "New user created." }));
                    res.send();
                }
            }
        );
    }
);

// Finds products with the searchword
app.post(
    "/search",
    [
        body("searchWord")
            .isLength({ min: 1 })
            .isString()
            .escape()
    ],
    (req, res, next) => {
        console.log("searchword is: " + req.body.searchWord);

        if (!validationResult(req).isEmpty()) {
            res.setHeader("Content-Type", "application/json");
            res.send(JSON.stringify({ error: "Invalid form data." }));
        } else next();
    },
    (req, res) => {
        //Searches db with the searchword with indexed values and makes it an array for JSON preparation
        db.collection("products")
            .find({ $text: { $search: req.body.searchWord } })
            .toArray((err, result) => {
                console.log("Hakutulos: " + JSON.stringify(result));
                if (result) {
                    res.setHeader("Content-Type", "application/json");
                    res.write("Searching product");
                    res.send();
                } else {
                    res.setHeader("Content-Type", "application/json");
                    res.send(JSON.stringify({ error: "Nothing found." }));
                }
            });
    }
);

// Check is the user signed in
const authenticate = (req, res, next) => {
    if (!req.session.userGroup || req.session.userGroup >= 3) {
        res.setHeader("Content-Type", "application/json");
        res.status(401);
        res.send({ message: "Unauthorized", code: "UAE1" });
    } else {
        next();
    }
};

const checkAdminPriviledges = (req, res, next) => {
    if (req.session.userGroup !== "0") {
        res.json({ error: "Need admin privileges." });
    } else next();
};

app.get("/users", (req, res) => {
    db.collection("users")
        .find({
            userGroup: { $ne: req.session.userGroup === "0" ? "-1" : "0" }, // Only admin can see information of other admins
            $or: [
                { name: { $regex: new RegExp(req.body.name, "i") } },
                { email: { $regex: new RegExp(req.body.name, "i") } }
            ]
        })
        .project({
            password: 0 // Password will not be returned
        })
        .toArray((err, result) => {
            if (result) {
                res.setHeader("Content-Type", "application/json");
                res.write(JSON.stringify(result));
                res.send();
            } else {
                res.setHeader("Content-Type", "application/json");
                res.send(JSON.stringify({ error: "Nothing found." }));
            }
        });
});

app.get("/technologies", (req, res) => {
    dbTextSearch(req.query.query, "technology", "technologies")
        .then(result => res.json(result))
        .catch(err => res.json(err));
});

app.get("/components", (req, res) => {
    dbTextSearch(req.query.query, "component", "components")
        .then(result => res.json(result))
        .catch(err => res.json(err));
});

app.get("/environmentRequirements", (req, res) => {
    dbTextSearch(req.query.query, "requirement", "envRequirements")
        .then(result => res.json(result))
        .catch(err => res.json(err));
});

function dbTextSearch(query, key, document) {
    return new Promise((resolve, reject) => {
        db.collection(document)
            .find({
                [key]: { $regex: new RegExp(query, "i") }
            })
            .toArray((err, res) => {
                const result = res
                    ? res
                    : { message: "Nothing found", code: "NFE1" };

                if (err) {
                    reject({ message: "Something went wrong", code: "NFE2" });
                } else {
                    resolve(result);
                }
            });
    });
}

/* 
Get all products user is priviledged to see
*/
app.get("/products", (req, res) => {
    const {
        myProducts,
        isParticipant,
        isClassified,
        lifecycleStatus
    } = JSON.parse(req.query.filters);
    const search = req.query.search;
    const query = {
        deleted: { $ne: true },
        $and: [{ productName: { $exists: true } }]
    };

    if (req.session.userGroup && isClassified) {
        query.isClassified = { $ne: null };
    } else {
        query.isClassified = { $eq: false };
    }
    if (lifecycleStatus) {
        query.lifecycleStatus = lifecycleStatus;
    }
    if (myProducts) {
        query.creator = { $eq: req.session.email };
    }
    if (isParticipant) {
        query.$and.push({
            $or: [
                { productOwner: { $eq: req.session.email } },
                { salesPerson: { $eq: req.session.email } }
            ]
        });
    }
    if (search) {
        query.$and.push({
            $or: [
                { productName: { $regex: new RegExp(search, "i") } },
                { shortDescription: { $regex: new RegExp(search, "i") } },
                { longDescription: { $regex: new RegExp(search, "i") } }
            ]
        });
    }

    db.collection("products")
        .find(query)
        .sort({ editedAt: -1 })
        .toArray((err, result) => {
            if (result) {
                res.setHeader("Content-Type", "application/json");
                res.write(JSON.stringify(result));
                res.send();
            } else {
                res.status(404);
                res.setHeader("Content-Type", "application/json");
                res.send({ message: "Nothing found", code: "PE1" });
            }
        });
});

app.get("/product/:id", (req, res, next) => {
    const id = req.params.id ? ObjectId(req.params.id) : null;
    if (!id) {
        res.status(404);
        res.json({ message: "Id undefined" });
        next();
    }
    db.collection("products").findOne(
        { _id: id, deleted: { $ne: true } },
        (err, result) => {
            if (err || !result) {
                res.status(404);
                res.json({ message: "Not found" });
            } else {
                res.status(200);
                res.json({
                    ...result,
                    isAllowedToEdit: result.creator === req.session.email
                });
            }
        }
    );
});

const isOwner = (req, email) => {
    return req.session.email === email;
};

app.delete("/product/:id", authenticate, (req, res) => {
    const id = req.params.id ? ObjectId(req.params.id) : null;
    if (!id) {
        res.status(404);
        res.json({ message: "Id undefined" });
    }
    db.collection("products").findOne({ _id: id }, (err, result) => {
        if (err || !result) {
            res.status(404);
            res.json({ message: "Not found" });
        } else {
            if (isOwner(req, result.creator)) {
                db.collection("products").update(
                    { _id: id },
                    {
                        $set: {
                            deleted: true
                        }
                    }
                );
                res.status(200);
                res.json({ message: "Deleted " + req.params.id });
            } else {
                res.status(401);
                res.json({ message: "Unauthorized" });
            }
        }
    });
});

//Maybe remove this if you are big smart
app.get("/personalProducts", (req, res) => {
    db.collection("products")
        .find({
            productName: { $exists: true },
            $or: [
                { productOwner: { $eq: req.session.email } },
                { salesPerson: { $eq: req.session.email } },
                { creator: { $eq: req.session.email } }
            ]
        })
        .toArray((err, result) => {
            if (result) {
                res.setHeader("Content-Type", "application/json");
                res.write(JSON.stringify(result));
                res.send();
            } else {
                res.setHeader("Content-Type", "application/json");
                res.send({ message: "Nothing found", code: "PE1" });
            }
        });
});

app.get("/deletedProducts", (req, res) => {
    db.collection("products")
        .find({
            productName: { $exists: true },
            deleted: { $eq: true }
        })
        .toArray((err, result) => {
            if (result) {
                res.setHeader("Content-Type", "application/json");
                res.write(JSON.stringify(result));
                res.send();
            } else {
                res.setHeader("Content-Type", "application/json");
                res.send({ message: "Nothing found", code: "PE1" });
            }
        });
});

app.post("/acceptIdea", (req, res) => {
    const id = req.body.id.length === 24 ? ObjectId(req.body.id) : null;

    if (!id) {
        res.send({
            message: "No such product or insufficient priviledges",
            code: "AIE1"
        });
        return;
    }

    db.collection("products").findOne(id, (err, result) => {
        if (err || !result) {
            res.send({
                message: "No such product or insufficient priviledges",
                code: "AIE2"
            });
            return;
        }
        if (result.productOwner === req.session.email) {
            db.collection("products").update(
                { _id: id },
                { $set: { isIdea: true } }
            );
            res.send({ message: "Update success", code: "AIS" });
        } else {
            res.send({
                message: "No such product or insufficient priviledges",
                code: "AIE3"
            });
        }
    });
});

/* 
    Adds a product into db with the following values being required
    - productName
    - shortDescription

    After validation adds into db
*/
app.route("/addProduct").post(
    [
        body("productName")
            .isLength({ min: 1 })
            .isString()
            .escape(),
        body("shortDescription")
            .isLength({ min: 1 })
            .isString()
            .escape(),
        body("longDescription")
            .isString()
            .escape()
            .optional(),
        body("logo")
            .isString()
            .optional(),
        body("technologies")
            .isArray()
            .optional(),
        body("components")
            .isArray()
            .optional(),
        body("environmentRequirements")
            .isArray()
            .optional(),
        body("customers")
            .isArray()
            .optional(),
        body("productOwner") // email
            .isString()
            .escape()
            .optional(),
        body("salesPerson")
            .isString()
            .escape()
            .optional(),
        body("lifecycleStatus").isInt(),
        body("businessType")
            .isString()
            .optional(),
        body("pricing")
            .isString()
            .escape()
            .optional(),
        body("isClassified")
            .isBoolean()
            .optional(),
        body("isIdea")
            .isBoolean()
            .optional(),
        body("participants")
            .isArray()
            .optional()
    ],
    (req, res, next) => {
        if (!validationResult(req).isEmpty()) {
            res.setHeader("Content-Type", "application/json");
            res.send({ message: "Invalid form data", code: "APE1" });
        } else {
            next();
        }
    },
    authenticate, // Check that the user is logged in
    (req, res, next) => {
        addEnvTechComp(req.body.technologies, "technology", "technologies");
        addEnvTechComp(req.body.components, "component", "components");
        addEnvTechComp(
            req.body.environmentRequirements,
            "requirement",
            "envRequirements"
        );
        next();
    },
    (req, res) => {
        db.collection("products").insert(
            {
                productName: req.body.productName,
                shortDescription: req.body.shortDescription,
                longDescription: req.body.longDescription,
                logos: [req.body.logo],
                technologies: req.body.technologies,
                components: req.body.components,
                environmentRequirements: req.body.environmentRequirements,
                customers: req.body.customers,
                productOwner: req.body.productOwner,
                salesPerson: req.body.salesPerson,
                lifecycleStatus: req.body.lifecycleStatus,
                businessType: req.body.businessType,
                pricing: req.body.pricing,
                isClassified: req.body.isClassified,
                isIdea: req.body.isIdea,
                participants: req.body.participants,
                createdAt: Date.now(),
                editedAt: Date.now(),
                creator: req.session.email,
                statusChanges: [
                    {
                        statusCode: req.body.lifecycleStatus,
                        startedAt: Date.now(),
                        endedAt: null
                    }
                ],
                deleted: false
            },
            (err, result) => {
                if (result.nInserted == 0 || err) {
                    res.setHeader("Content-Type", "application/json");
                    res.send({ message: "Couldn't add product", code: "APE3" });
                } else {
                    res.setHeader("Content-Type", "application/json");
                    res.send({
                        message: `Successfully created product ${result.id}`,
                        code: "APS"
                    });
                }
            }
        );
    }
);
/**
 *
 * @param {*} arr Array of items that will be compared against the database document.
 * If database does not contain given item in array, item will be added to document.
 * @param {*} key Name of the object property. For example, "technology" is the key: {technology: "Java"}
 * @param {*} document Database document name
 */

function addEnvTechComp(arr, key, document) {
    if (!arr) return;
    arr.forEach(item => {
        db.collection(document)
            .find({ [key]: item })
            .project({ [key]: 1, _id: 0 })
            .toArray((err, result) => {
                if (err || result.length === 0) {
                    db.collection(document).insert({ [key]: item });
                    console.log("Inserting", key, item);
                }
            });
    });
}

app.post("/uploadImage", (req, res) => {
    if (!req.files || Object.keys(req.files).length === 0) {
        res.send("placeholder.jpg");
    }

    const image = req.files.image;

    // Filename is generated from current session id and datetime
    const date = new Date();
    // Split the string to array
    let fileType = image.name.split(".");
    // Last element in array is the file type
    fileType = fileType[fileType.length - 1];
    const fileName = req.session.id + date.getTime() + "." + fileType;

    // Use the mv() method to place the file somewhere on your server
    image.mv("./images/" + fileName, err => {
        if (err) return res.status(500).send(err);

        res.send(fileName);
    });
});

app.post(
    "/editProduct",
    [
        body("productName")
            .isLength({ min: 1 })
            .isString()
            .optional()
            .escape(),
        body("shortDescription")
            .isLength({ min: 1 })
            .isString()
            .optional()
            .escape(),
        body("longDescription")
            .isString()
            .escape()
            .optional(),
        body("logo")
            .isString()
            .optional(),
        body("technologies")
            .isArray()
            .optional(),
        body("components")
            .isArray()
            .optional(),
        body("environmentRequirements")
            .isArray()
            .optional(),
        body("customers")
            .isArray()
            .optional(),
        body("productOwner") // email
            .isString()
            .escape()
            .optional(),
        body("salesPerson")
            .isString()
            .escape()
            .optional(),
        body("lifecycleStatus")
            .isInt()
            .optional(),
        body("businessType")
            .isString()
            .optional(),
        body("pricing")
            .isString()
            .escape()
            .optional(),
        body("isClassified")
            .isBoolean()
            .optional(),
        body("isIdea")
            .isBoolean()
            .optional(),
        body("deleted")
            .isBoolean()
            .optional(),
        body("participants")
            .isArray()
            .optional()
    ],
    (req, res, next) => {
        if (!validationResult(req).isEmpty()) {
            res.setHeader("Content-Type", "application/json");
            res.send({ message: "Invalid form data", code: "EPE1" });
        } else {
            next();
        }
    },
    authenticate, // Check that the user is logged in
    (req, res, next) => {
        addEnvTechComp(req.body.technologies, "technology", "technologies");
        addEnvTechComp(req.body.components, "component", "components");
        addEnvTechComp(
            req.body.environmentRequirements,
            "requirement",
            "envRequirements"
        );
        next();
    },
    (req, res) => {
        db.collection("products").findOne(
            { _id: ObjectId(req.body.id) },
            (err, result) => {
                if (err) {
                    console.log(err);
                }

                if (result.creator !== req.session.email) {
                    res.code(401).json({ message: "Unauthorized" });
                    return;
                }

                const { logos, lifecycleStatus } = result;
                const duplicate = logos.find(logo => logo === req.body.logo);
                const newLogos = [
                    ...logos.filter(logo => logo !== duplicate),
                    req.body.logo
                ];

                const statusChanges = result.statusChanges || [];
                if (lifecycleStatus !== req.body.lifecycleStatus) {
                    const timestamp = Date.now();

                    statusChanges.length
                        ? (statusChanges[
                              statusChanges.length - 1
                          ].endedAt = timestamp)
                        : false;

                    statusChanges.push({
                        statusCode: req.body.lifecycleStatus,
                        startedAt: timestamp,
                        endedAt: null
                    });
                }

                db.collection("products").update(
                    { _id: ObjectId(req.body.id) },
                    {
                        $set: {
                            productName: req.body.productName,
                            shortDescription: req.body.shortDescription,
                            longDescription: req.body.longDescription,
                            logos: req.body.logo ? newLogos : logos,
                            technologies: req.body.technologies,
                            components: req.body.components,
                            environmentRequirements:
                                req.body.environmentRequirements,
                            customers: req.body.customers,
                            productOwner: req.body.productOwner,
                            salesPerson: req.body.salesPerson,
                            lifecycleStatus: req.body.lifecycleStatus,
                            businessType: req.body.businessType,
                            pricing: req.body.pricing,
                            isClassified: req.body.isClassified,
                            isIdea: req.body.isIdea,
                            participants: req.body.participants,
                            editedAt: Date.now(),
                            statusChanges
                        }
                    },
                    (err, result) => {
                        if (result.writeError || err) {
                            res.setHeader("Content-Type", "application/json");
                            res.send({
                                message: "Couldn't update product",
                                code: "EPE3"
                            });
                        } else {
                            res.setHeader("Content-Type", "application/json");
                            res.send({
                                message: `Successfully updated product ${result._id}`,
                                code: "EPS"
                            });
                        }
                    }
                );
            }
        );
    }
);

app.post(
    "/restoreProduct",
    [
        body("_id")
            .isLength({ min: 1 })
            .isString()
            .escape()
    ],
    (req, res, next) => {
        if (!validationResult(req).isEmpty()) {
            res.setHeader("Content-Type", "application/json");
            res.send({ message: "Invalid form data", code: "EPE1" });
        } else {
            next();
        }
    },
    authenticate, // Check that the user is logged in
    (req, res) => {
        db.collection("products").update(
            { _id: ObjectId(req.body._id) },
            {
                $set: {
                    deleted: false,
                    editedAt: Date.now()
                }
            },
            (err, result) => {
                if (result.writeError || err) {
                    res.setHeader("Content-Type", "application/json");
                    res.send({
                        message: "Couldn't restore product",
                        code: "RPE1"
                    });
                } else {
                    res.setHeader("Content-Type", "application/json");
                    res.send({
                        message: `Successfully restored product ${result._id}`,
                        code: "RPS"
                    });
                }
            }
        );
    }
);

app.post(
    "/editPassword",
    [
        body("oldPassword")
            .isLength({ min: 6 })
            .isString()
            .escape(),
        body("password")
            .isLength({ min: 8 })
            .isString()
            .escape()
    ],
    (req, res, next) => {
        if (!validationResult(req).isEmpty()) {
            res.setHeader("Content-Type", "application/json");
            res.status(400);
            res.send({ message: "Invalid form data", code: "EPE1" });
        } else {
            next();
        }
    },
    authenticate, // Check that the user is logged in
    (req, res, next) => {
        const passwordHash = sha256(req.body.oldPassword);
        db.collection("users").findOne(
            { email: req.session.email, password: passwordHash },
            (err, result) => {
                if (result) {
                    console.log(result);
                    next();
                } else {
                    res.send({
                        message: "Incorrect old password.",
                        code: "LIE1"
                    });
                }
            }
        );
    },
    (req, res) => {
        const newPassword = sha256(req.body.password);
        db.collection("users").update(
            { email: req.session.email },
            {
                $set: {
                    password: newPassword
                }
            },
            (err, result) => {
                if (result.result.nModified == 0 || err) {
                    res.setHeader("Content-Type", "application/json");
                    res.send({
                        message: "Couldn't update password",
                        code: "UPE4"
                    });
                } else {
                    res.setHeader("Content-Type", "application/json");
                    res.status(201);
                    res.send({
                        message: `Password updated succesfully.`,
                        code: "UPS"
                    });
                }
            }
        );
    },
    authenticate, // Check that the user is logged in
    (req, res) => {
        const newPassword = sha256(req.body.password);
        db.collection("users").update(
            { email: req.session.email },
            {
                $set: {
                    password: newPassword
                }
            },
            (err, result) => {
                if (result.result.nModified == 0 || err) {
                    res.setHeader("Content-Type", "application/json");
                    res.send({
                        message: "Couldn't update password",
                        code: "UPE4"
                    });
                } else {
                    res.setHeader("Content-Type", "application/json");
                    res.send({
                        message: `Password updated succesfully.`,
                        code: "UPS"
                    });
                }
            }
        );
    }
);

app.post(
    "/editUser",
    [
        body("name")
            .isLength({ min: 3 })
            .isString()
            .escape(),
        body("reqEmail")
            .isEmail()
            .escape(),
        body("email")
            .isEmail()
            .optional()
            .escape(),
        body("userGroup")
            .isLength({ min: 1, max: 1 })
            .isInt()
            .escape()
    ],
    (req, res, next) => {
        console.log(validationResult(req));
        if (!validationResult(req).isEmpty()) {
            res.setHeader("Content-Type", "application/json");
            res.send({ message: "Invalid form data", code: "EPE1" });
        } else {
            next();
        }
    },
    checkAdminPriviledges, // Check that the user is logged in
    (req, res) => {
        db.collection("users").update(
            { email: req.body.reqEmail },
            {
                $set: {
                    email:
                        typeof req.body.email !== "undefined"
                            ? req.body.email
                            : req.body.reqEmail,
                    name: req.body.name,
                    userGroup: req.body.userGroup
                }
            },
            (err, result) => {
                if (result.result.nModified == 0 || err) {
                    res.setHeader("Content-Type", "application/json");
                    res.send({ message: "Couldn't update user", code: "UPE4" });
                } else {
                    res.setHeader("Content-Type", "application/json");
                    res.send({
                        message: `User updated succesfully.`,
                        code: "UPS"
                    });
                }
            }
        );
    }
);

app.post(
    "/editPasswordAdmin",
    [
        body("email")
            .isLength({ min: 1 })
            .isEmail()
            .escape(),
        body("password")
            .isLength({ min: 8 })
            .isString()
            .escape()
    ],
    (req, res, next) => {
        if (!validationResult(req).isEmpty()) {
            res.setHeader("Content-Type", "application/json");
            res.send({ message: "Invalid form data", code: "EPE1" });
        } else {
            next();
        }
    },
    checkAdminPriviledges, // Check that the user is logged in
    (req, res) => {
        const newPassword = sha256(req.body.password);
        db.collection("users").update(
            { email: req.body.email },
            {
                $set: {
                    password: newPassword
                }
            },
            (err, result) => {
                if (result.result.nModified == 0 || err) {
                    res.setHeader("Content-Type", "application/json");
                    res.send({
                        message: "Couldn't update password",
                        code: "UPE4"
                    });
                } else {
                    res.setHeader("Content-Type", "application/json");
                    res.send({
                        message: `Password updated succesfully.`,
                        code: "UPS"
                    });
                }
            }
        );
    }
);

app.post(
    "/deleteUser",
    [
        body("email")
            .isString()
            .escape()
            .isEmail()
    ],
    (req, res, next) => {
        console.log(validationResult(req));
        if (!validationResult(req).isEmpty()) {
            res.setHeader("Content-Type", "application/json");
            res.send({ message: "Invalid form data", code: "EPE1" });
        } else {
            next();
        }
    },
    checkAdminPriviledges, // Check that the user is logged in
    (req, res) => {
        db.collection("users").deleteOne(
            { email: req.body.email },
            (err, result) => {
                if (result.result.deletedCount == 0 || err) {
                    res.setHeader("Content-Type", "application/json");
                    res.send({
                        message: "Couldn't delete user",
                        code: "UDE1"
                    });
                } else {
                    res.setHeader("Content-Type", "application/json");
                    res.send({
                        message: `User deleted succesfully.`,
                        code: "UDS"
                    });
                }
            }
        );
    }
);

const runCleanup = () => {
    db.collection("products")
        .find({ deleted: { $ne: true } })
        .project({ technologies: 1, components: 1, environmentRequirements: 1 })
        .toArray(async (err, results) => {
            if (err || results.length === 0) {
                console.log(err.message);
            } else {
                let technologies = [];
                let components = [];
                let environmentRequirements = [];

                results.forEach(result => {
                    technologies = [...technologies, ...result.technologies];
                    components = [...components, ...result.components];
                    environmentRequirements = [
                        ...environmentRequirements,
                        ...result.environmentRequirements
                    ];
                });

                technologies = [...new Set(technologies)];
                components = [...new Set(components)];
                environmentRequirements = [...new Set(environmentRequirements)];

                await db.collection("technologies").remove();
                await db.collection("components").remove();
                await db.collection("environmentRequirements").remove();

                technologies.forEach(item => {
                    db.collection("technologies").insert({ technology: item });
                });
                components.forEach(item => {
                    db.collection("components").insert({ component: item });
                });
                environmentRequirements.forEach(item => {
                    db.collection("environmentRequirements").insert({
                        environmentRequirement: item
                    });
                });
                console.log("Cleanup done");
            }
        });
};

app.use((err, req, res) => {
    console.error(err.stack);
    res.status(500).send({ error: err });
});

app.listen(PORT, IP);
console.log("Server running on http://%s:%s", IP, PORT);

setInterval(runCleanup, 1000 * 60 * 60 * 1); // Every hour

module.exports = app;

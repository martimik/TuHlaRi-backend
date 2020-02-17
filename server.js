const express = require("express");
const fileUpload = require("express-fileupload");
const morgan = require("morgan");
const session = require("express-session");
const cors = require("cors");
const bodyParser = require("body-parser");
const { body } = require("express-validator/check");
const app = express();

const config = require("./config");
/* ================ UTILS ================ */
const db = require("./utils/database");
const authenticate = require("./utils/authenticate");
const checkAdminPriviledges = require("./utils/checkAdminPriviledges");
const runCleanup = require("./utils/cleanup");
const validateForm = require("./utils/validateForm");
const dbTextSearch = require("./utils/dbTextSearch");
const dbAddItem = require("./utils/dbAddItem");

/* ================ ROUTES ================ */

/* ================ Product ================ */
const getAllProducts = require("./routes/product/getAll");
const getProductById = require("./routes/product/getById");
const getDeletedProducts = require("./routes/product/getDeleted");
const deleteProductById = require("./routes/product/deleteById");
const createProduct = require("./routes/product/create");
const updateProduct = require("./routes/product/update");
const restoreProduct = require("./routes/product/restore");

const uploadImage = require("./utils/uploadImage");

/* ================ User ================ */
const login = require("./routes/user/login");
const logout = require("./routes/user/logout");
const getUsers = require("./routes/user/getAll");
const updatePassword = require("./routes/user/updatePassword");
const matchPasswordToEmail = require("./routes/user/matchPasswordToEmail");
const updateUser = require("./routes/user/update");
const createUser = require("./routes/user/create");
const deleteUserByEmail = require("./routes/user/deleteByEmail");

const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";

console.log("CORS ORIGIN:", CORS_ORIGIN);

app.use(morgan("combined"));
app.use(cors({ credentials: true, origin: CORS_ORIGIN }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(fileUpload({ createParentPath: true }));
app.use(express.static(__dirname + "/images"));
app.use(session(config));

const PORT = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080;
const IP = process.env.IP || process.env.OPENSHIFT_NODEJS_IP || "0.0.0.0";

app.get("/", (req, res) => {
    res.json({ message: "Ok" });
});

app.get("/session", (req, res) => {
    res.send({
        name: req.session.name,
        email: req.session.email,
        userGroup: req.session.userGroup
    });
});

app.post("/login", login);
app.post("/logout", logout);
app.get("/users", checkAdminPriviledges, getUsers);

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
    validateForm,
    checkAdminPriviledges,
    createUser
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
    validateForm,
    authenticate, // Check that the user is logged in
    matchPasswordToEmail,
    updatePassword
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
    validateForm,
    ,
    (req, res, next) => {
        if (req.body.email === "admin@admin.com") {
            res.status(401).json({ message: "Cannot edit" });
        } else {
            next();
        }
    },
    updateUser
);

app.post(
    "/deleteUser",
    [
        body("email")
            .isString()
            .escape()
            .isEmail()
    ],
    validateForm,
    checkAdminPriviledges,
    (req, res, next) => {
        if (req.body.email === "admin@admin.com") {
            res.status(401).json({ message: "Cannot delete" });
        } else {
            next();
        }
    },
    deleteUserByEmail
);

app.get("/products", getAllProducts);
app.get("/product/:id", getProductById);
app.get("/deletedProducts", getDeletedProducts);
app.delete("/product/:id", deleteProductById);

app.post(
    "/addProduct",
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
    validateForm,
    authenticate, // Check that the user is logged in
    (req, res, next) => {
        dbAddItem(req.body.technologies, "technology", "technologies");
        dbAddItem(req.body.components, "component", "components");
        dbAddItem(
            req.body.environmentRequirements,
            "requirement",
            "envRequirements"
        );
        next();
    },
    createProduct
);

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
    validateForm,
    authenticate, // Check that the user is logged in
    (req, res, next) => {
        dbAddItem(req.body.technologies, "technology", "technologies");
        dbAddItem(req.body.components, "component", "components");
        dbAddItem(
            req.body.environmentRequirements,
            "requirement",
            "envRequirements"
        );
        next();
    },
    updateProduct
);

app.post(
    "/restoreProduct",
    [
        body("_id")
            .isLength({ min: 1 })
            .isString()
            .escape()
    ],
    validateForm,
    authenticate,
    restoreProduct
);

app.post("/uploadImage", uploadImage);

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

db.connect();

app.listen(PORT, IP);
console.log("Server running on http://%s:%s", IP, PORT);

setTimeout(runCleanup, 5000);
setInterval(runCleanup, 1000 * 60 * 60 * 1); // Run every hour

module.exports = app;

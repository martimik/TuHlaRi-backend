const express = require("express");
const fileUpload = require("express-fileupload");
const morgan = require("morgan");
const mongodb = require("mongodb");
const session = require("express-session");
const cors = require("cors");
const bodyParser = require("body-parser");
const { body, validationResult } = require("express-validator/check");
const sanitizeBody = require("express-validator/filter");
const sha256 = require("sha256");

const auth = require("basic-auth");

const app = express();

const { ObjectId } = mongodb;

app.use(morgan("combined"));
app.use(cors({ credentials: true, origin: "http://localhost:3000" }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(fileUpload({ createParentPath: true }));

//Session cookie, duration 10min
app.use(
  session({
    name: "auth",
    secret: "keyboard cat",
    cookie: {
      httpOnly: true,
      maxAge: 600000
    }
  })
);

const PORT = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080;
const IP = process.env.IP || process.env.OPENSHIFT_NODEJS_IP || "0.0.0.0";
let mongoUrl =
  process.env.OPENSHIFT_MONGODB_DB_URL ||
  process.env.MONGO_URL ||
  "mongodb://127.0.0.1:27017/development";

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

app.post("/login", (req, res, next) => {
  const credentials = auth(req);
  const passwordHash = sha256(credentials.pass);

  db.collection("development").findOne(
    { name: credentials.name, password: passwordHash },
    (err, result) => {
      if (result) {
        console.log(result);
        req.session.name = result.name;
        req.session.email = result.email;
        req.session.userGroup = result.userGroup;
        res.send(req.session);
      } else {
        res.send("Invalid credentials");
      }
    }
  );
});
app.post("/logout", (req, res, next) => {
  if (req.session) {
    req.session.destroy(function(err) {
      if (err) {
        next(err);
      } else {
        req.session = null;
        res.setHeader("Content-Type", "application/json");
        res.send(JSON.stringify({ name: null, email: null, userGroup: null }));
      }
    });
  } else {
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify({ error: "Session does not exist." }));
  }
});

app.get("/event/:id", (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  db.collection("events").findOne(ObjectId(req.params.id), (err, result) =>
    res.send(result)
  );
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
      .isLength({ min: 1 })
      .isInt()
      .escape()
  ],
  (req, res, next) => {
    if (req.session.userGroup != "1") {
      res.end(JSON.stringify({ error: "Need admin privileges." }));
    } else next();
  },
  (req, res, next) => {
    if (!validationResult(req).isEmpty()) {
      res.setHeader("Content-Type", "application/json");
      res.send(JSON.stringify({ error: "Invalid form data." }));
    } else next();
  },
  (req, res, next) => {
    db.collection("development").findOne({ email: req.body.email }, function(
      err,
      result
    ) {
      if (result != null) {
        res.setHeader("Content-Type", "application/json");
        res.send(JSON.stringify({ error: "Email already in use." }));
      } else next();
    });
  },
  (req, res, next) => {
    let passwordHash = sha256(req.body.password);

    db.collection("development").insert(
      {
        name: req.body.name,
        email: req.body.email,
        password: passwordHash,
        userGroup: req.body.userGroup
      },
      (err, result) => {
        if (result.nInserted == 0 || err) {
          res.setHeader("Content-Type", "application/json");
          res.send(JSON.stringify({ error: "Insert failed." }));
          next(err);
        } else {
          res.setHeader("Content-Type", "application/json");
          res.write("Adding user");
          res.write(
            JSON.stringify({
              name: req.body.name,
              email: req.body.email,
              password: req.body.password,
              userGroup: req.body.userGroup
            })
          );
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
  (req, res, next) => {
    //Searches db with the searchword with indexed values and makes it an array for JSON preparation
    db.collection("development")
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

// Fetches all products with a ProductName
app.post("/allProducts", (req, res, next) => {
  ////Searches db for all Products with ProductNames and makes them into array for JSON preparation
  db.collection("development")
    .find({ productName: { $exists: true } })
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
    body("logo")
      .isString()
      .escape()
      .optional(),
    body("longDescription")
      .isString()
      .escape()
      .optional(),
    body("technologies")
      .isString()
      .escape()
      .optional(),
    body("enviromentRequirements")
      .isString()
      .escape()
      .optional(),
    body("customer")
      .isString()
      .escape()
      .optional(),
    body("lifeCycle")
      .isString()
      .escape(),
    body("owner")
      .isString()
      .escape()
      .optional(),
    body("price")
      .isString()
      .escape()
      .optional()
  ],
  (req, res, next) => {
    if (!validationResult(req).isEmpty()) {
      res.setHeader("Content-Type", "application/json");
      res.send(JSON.stringify({ error: "Invalid form data." }));
    } else next();
  },
  (req, res, next) => {
    if (req.session.userGroup != ("1" || "2" || "3")) {
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Insufficient priviledges." }));
    } else next();
  },
  (req, res, next) => {
    db.collection("development").insert(
      {
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
      },
      (err, result) => {
        if (result.nInserted == 0 || err) {
          res.setHeader("Content-Type", "application/json");
          res.send(JSON.stringify({ error: "Insert failed." }));
          next(err);
        } else {
          res.setHeader("Content-Type", "application/json");
          res.write("Adding product");
          res.write(
            JSON.stringify({
              name: req.body.name,
              shortDescription: req.body.shortDescription
            })
          );
          res.send();
        }
      }
    );
  }
);

app.post("/upload", (req, res) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send("No files were uploaded.");
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

    res.send("File uploaded!");
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ error: err });
});

app.listen(PORT, IP);
console.log("Server running on http://%s:%s", IP, PORT);

module.exports = app;

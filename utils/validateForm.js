const { validationResult } = require("express-validator/check");

module.exports = (req, res, next) => {
    if (!validationResult(req).isEmpty()) {
        res.setHeader("Content-Type", "application/json");
        res.status(400);
        res.send({ message: "Invalid form data", code: "APE1" });
    } else {
        next();
    }
};

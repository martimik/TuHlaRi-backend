module.exports = (req, res, next) => {
    if (!req.session.userGroup || req.session.userGroup >= 3) {
        res.setHeader("Content-Type", "application/json");
        res.status(401);
        res.send({ message: "Unauthorized", code: "UAE1" });
    } else {
        next();
    }
};

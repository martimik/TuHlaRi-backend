module.exports = (req, res, next) => {
    if (req.session.userGroup !== "0") {
        res.setHeader("Content-Type", "application/json");
        res.status(401);
        res.send({
            message: "Unauthorized, need admin privileges",
            code: "UAE2"
        });
    } else next();
};

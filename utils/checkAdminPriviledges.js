module.exports = (req, res, next) => {
    if (req.session.userGroup !== "0") {
        res.json({ error: "Need admin privileges." });
    } else next();
};

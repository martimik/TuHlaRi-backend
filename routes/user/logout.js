const db = require("../../utils/database");

module.exports = (req, res, next) => {
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
};

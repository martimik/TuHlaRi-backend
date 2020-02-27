const db = require("../../utils/database");
const sha256 = require("sha256");

module.exports = (req, res, next) => {
    const passwordHash = sha256(req.body.oldPassword);
    db.get()
        .collection("users")
        .findOne(
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
};

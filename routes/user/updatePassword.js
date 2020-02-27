const db = require("../../utils/database");
const sha256 = require("sha256");

module.exports = (req, res) => {
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
};

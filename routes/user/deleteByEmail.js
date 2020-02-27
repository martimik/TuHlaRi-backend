const db = require("../../utils/database");

module.exports = (req, res) => {
    db.get()
        .collection("users")
        .deleteOne({ email: req.body.email }, (err, result) => {
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
        });
};

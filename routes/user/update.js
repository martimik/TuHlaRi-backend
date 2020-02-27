const db = require("../../utils/database");

module.exports = (req, res) => {
    db.get()
        .collection("users")
        .update(
            { email: req.body.reqEmail },
            {
                $set: {
                    email:
                        typeof req.body.email !== "undefined"
                            ? req.body.email
                            : req.body.reqEmail,
                    name: req.body.name,
                    userGroup: req.body.userGroup
                }
            },
            (err, result) => {
                if (result.result.nModified == 0 || err) {
                    res.setHeader("Content-Type", "application/json");
                    res.send({
                        message: "Couldn't update user",
                        code: "UPE4"
                    });
                } else {
                    res.setHeader("Content-Type", "application/json");
                    res.send({
                        message: `User updated succesfully.`,
                        code: "UPS"
                    });
                }
            }
        );
};

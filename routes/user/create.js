const db = require("../../utils/database");
const sha256 = require("sha256");

module.exports = (req, res, next) => {
    db.get()
        .collection("users")
        .findOne({ email: req.body.email }, (err, result) => {
            if (result != null) {
                res.setHeader("Content-Type", "application/json");
                res.status(400);
                res.send({
                    message: "Email already in use.",
                    code: "NUE2"
                });
            } else {
                const passwordHash = sha256(req.body.password);

                db.get()
                    .collection("users")
                    .insert(
                        {
                            name: req.body.name,
                            email: req.body.email,
                            password: passwordHash,
                            userGroup: req.body.userGroup,
                            createdAt: Date.now()
                        },
                        (err, result) => {
                            if (result.nInserted == 0 || err) {
                                res.setHeader(
                                    "Content-Type",
                                    "application/json"
                                );
                                res.send(
                                    JSON.stringify({ error: "Insert failed." })
                                );
                            } else {
                                res.setHeader(
                                    "Content-Type",
                                    "application/json"
                                );
                                res.write(
                                    JSON.stringify({
                                        message: "New user created."
                                    })
                                );
                                res.send();
                            }
                        }
                    );
            }
        });
};

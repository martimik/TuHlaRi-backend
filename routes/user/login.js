const db = require("../../utils/database");
const auth = require("basic-auth");
const sha256 = require("sha256");

module.exports = (req, res) => {
    const credentials = auth(req);
    const passwordHash = sha256(credentials.pass);

    db.get()
        .collection("users")
        .findOne(
            { email: credentials.name, password: passwordHash },
            (err, result) => {
                if (result) {
                    req.session.name = result.name;
                    req.session.email = result.email;
                    req.session.userGroup = result.userGroup;

                    res.send({
                        name: req.session.name,
                        email: req.session.email,
                        userGroup: req.session.userGroup
                    });
                } else {
                    res.send({
                        message: "Invalid credentials",
                        code: "LIF1"
                    });
                }
            }
        );
};

const db = require("../../utils/database");

module.exports = (req, res) => {
    db.get()
        .collection("users")
        .find({
            userGroup: { $ne: req.session.userGroup === "0" ? "-1" : "0" }, // Only admin can see information of other admins
            $or: [
                { name: { $regex: new RegExp(req.body.name, "i") } },
                { email: { $regex: new RegExp(req.body.name, "i") } }
            ]
        })
        .project({
            password: 0 // Password will not be returned
        })
        .toArray((err, result) => {
            if (result) {
                res.setHeader("Content-Type", "application/json");
                res.write(JSON.stringify(result));
                res.send();
            } else {
                res.setHeader("Content-Type", "application/json");
                res.send(JSON.stringify({ error: "Nothing found." }));
            }
        });
};

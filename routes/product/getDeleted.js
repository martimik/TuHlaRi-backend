const db = require("../../utils/database");

module.exports = (req, res) => {
    db.get()
        .collection("products")
        .find({
            productName: { $exists: true },
            deleted: { $eq: true }
        })
        .toArray((err, result) => {
            if (result) {
                res.setHeader("Content-Type", "application/json");
                res.write(JSON.stringify(result));
                res.send();
            } else {
                res.setHeader("Content-Type", "application/json");
                res.send({ message: "Nothing found", code: "PE1" });
            }
        });
};

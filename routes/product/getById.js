const db = require("../../utils/database");

module.exports = (req, res, next) => {
    const id = req.params.id ? db.ObjectId(req.params.id) : null;
    if (!id) {
        res.status(404);
        res.json({ message: "Id undefined" });
        next();
    }
    db.get()
        .collection("products")
        .findOne({ _id: id, deleted: { $ne: true } }, (err, result) => {
            if (err || !result) {
                res.status(404);
                res.json({ message: "Not found" });
            } else {
                const { creator, productOwner, salesPerson } = result;
                const { email } = req.session;

                const isAllowedToEdit =
                    creator === email ||
                    productOwner === email ||
                    salesPerson === email ||
                    req.session.userGroup === "0";

                res.status(200);
                res.json({ ...result, isAllowedToEdit });
            }
        });
};

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
                res.status(200);
                res.json({
                    ...result,
                    isAllowedToEdit: result.creator === req.session.email
                });
            }
        });
};

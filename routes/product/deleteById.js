const db = require("../../utils/database");

const isOwner = (req, email) => {
    return req.session.email === email;
};

module.exports = (req, res) => {
    const id = req.params.id ? db.ObjectId(req.params.id) : null;
    if (!id) {
        res.status(404);
        res.json({ message: "Id undefined" });
    }
    db.get()
        .collection("products")
        .findOne({ _id: id }, (err, result) => {
            if (err || !result) {
                res.status(404);
                res.json({ message: "Not found" });
            } else {
                if (isOwner(req, result.creator)) {
                    db.get()
                        .collection("products")
                        .update(
                            { _id: id },
                            {
                                $set: {
                                    deleted: true
                                }
                            }
                        );
                    res.status(200);
                    res.json({ message: "Deleted " + req.params.id });
                } else {
                    res.status(401);
                    res.json({ message: "Unauthorized" });
                }
            }
        });
};

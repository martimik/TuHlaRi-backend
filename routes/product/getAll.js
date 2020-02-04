const db = require("../../utils/database");

module.exports = (req, res) => {
    const {
        myProducts,
        isParticipant,
        isClassified,
        lifecycleStatus
    } = JSON.parse(req.query.filters);
    const search = req.query.search;
    const query = {
        deleted: { $ne: true },
        $and: [{ productName: { $exists: true } }]
    };

    if (req.session.userGroup && isClassified) {
        query.isClassified = { $ne: null };
    } else {
        query.isClassified = { $eq: false };
    }
    if (lifecycleStatus) {
        query.lifecycleStatus = lifecycleStatus;
    }
    if (myProducts) {
        query.creator = { $eq: req.session.email };
    }
    if (isParticipant) {
        query.$and.push({
            $or: [
                { productOwner: { $eq: req.session.email } },
                { salesPerson: { $eq: req.session.email } }
            ]
        });
    }
    if (search) {
        query.$and.push({
            $or: [
                { productName: { $regex: new RegExp(search, "i") } },
                { shortDescription: { $regex: new RegExp(search, "i") } },
                { longDescription: { $regex: new RegExp(search, "i") } }
            ]
        });
    }

    db.get()
        .collection("products")
        .find(query)
        .sort({ editedAt: -1 })
        .toArray((err, result) => {
            if (result) {
                res.setHeader("Content-Type", "application/json");
                res.write(JSON.stringify(result));
                res.send();
            } else {
                res.status(404);
                res.setHeader("Content-Type", "application/json");
                res.send({ message: "Nothing found", code: "PE1" });
            }
        });
};

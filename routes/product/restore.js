const db = require("../../utils/database");

module.exports = (req, res) => {
    db.get()
        .collection("products")
        .update(
            { _id: db.ObjectId(req.body._id) },
            {
                $set: {
                    deleted: false,
                    editedAt: Date.now()
                }
            },
            (err, result) => {
                if (result.writeError || err) {
                    res.setHeader("Content-Type", "application/json");
                    res.send({
                        message: "Couldn't restore product",
                        code: "RPE1"
                    });
                } else {
                    res.setHeader("Content-Type", "application/json");
                    res.send({
                        message: `Successfully restored product ${result._id}`,
                        code: "RPS"
                    });
                }
            }
        );
};

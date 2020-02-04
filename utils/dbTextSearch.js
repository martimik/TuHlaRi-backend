const db = require("./database");

module.exports = (query, key, document) => {
    return new Promise((resolve, reject) => {
        db.get()
            .collection(document)
            .find({
                [key]: { $regex: new RegExp(query, "i") }
            })
            .toArray((err, res) => {
                const result = res
                    ? res
                    : { message: "Nothing found", code: "NFE1" };

                if (err) {
                    reject({ message: "Something went wrong", code: "NFE2" });
                } else {
                    resolve(result);
                }
            });
    });
};

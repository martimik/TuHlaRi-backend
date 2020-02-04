const db = require("./database");

/**
 *
 * @param {*} arr Array of items that will be compared against the database document.
 * If database does not contain given item in array, item will be added to document.
 * @param {*} key Name of the object property. For example, "technology" is the key: {technology: "Java"}
 * @param {*} document Database document name
 */

module.exports = (arr, key, document) => {
    if (!arr) return;
    arr.forEach(item => {
        db.get()
            .collection(document)
            .find({ [key]: item })
            .project({ [key]: 1, _id: 0 })
            .toArray((err, result) => {
                if (err || result.length === 0) {
                    db.get()
                        .collection(document)
                        .insert({ [key]: item });
                    console.log("Inserting", key, item);
                }
            });
    });
};

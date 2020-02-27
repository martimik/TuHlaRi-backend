module.exports = (req, res) => {
    if (!req.files || Object.keys(req.files).length === 0) {
        res.send("placeholder.jpg");
    }

    const image = req.files.image;

    // Filename is generated from current session id and datetime
    const date = new Date();
    // Split the string to array
    let fileType = image.name.split(".");
    // Last element in array is the file type
    fileType = fileType[fileType.length - 1];
    const fileName = req.session.id + date.getTime() + "." + fileType;

    // Use the mv() method to place the file somewhere on your server
    image.mv("./images/" + fileName, err => {
        if (err) return res.status(500).send(err);

        res.send(fileName);
    });
};

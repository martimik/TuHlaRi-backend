const db = require("../../utils/database");

module.exports = (req, res) => {
    db.get()
        .collection("products")
        .findOne({ _id: db.ObjectId(req.body.id) }, (err, result) => {
            if (err) {
                console.log(err);
            }
            const { email } = req.session;
            const { creator, productOwner, salesPerson } = result;
            const isAllowedToEdit =
                creator === email ||
                productOwner === email ||
                salesPerson === email;

            if (!isAllowedToEdit) {
                res.code(401).json({ message: "Unauthorized" });
                return;
            }

            const { logos, lifecycleStatus } = result;
            const duplicate = logos.find(logo => logo === req.body.logo);
            const newLogos = [
                ...logos.filter(logo => logo !== duplicate),
                req.body.logo
            ];

            const statusChanges = result.statusChanges || [];
            if (lifecycleStatus !== req.body.lifecycleStatus) {
                const timestamp = Date.now();

                statusChanges.length
                    ? (statusChanges[
                          statusChanges.length - 1
                      ].endedAt = timestamp)
                    : false;

                statusChanges.push({
                    statusCode: req.body.lifecycleStatus,
                    startedAt: timestamp,
                    endedAt: null
                });
            }

            db.get()
                .collection("products")
                .update(
                    { _id: db.ObjectId(req.body.id) },
                    {
                        $set: {
                            productName: req.body.productName,
                            shortDescription: req.body.shortDescription,
                            longDescription: req.body.longDescription,
                            logos: req.body.logo ? newLogos : logos,
                            technologies: req.body.technologies,
                            components: req.body.components,
                            environmentRequirements:
                                req.body.environmentRequirements,
                            customers: req.body.customers,
                            productOwner: req.body.productOwner,
                            salesPerson: req.body.salesPerson,
                            lifecycleStatus: req.body.lifecycleStatus,
                            businessType: req.body.businessType,
                            pricing: req.body.pricing,
                            isClassified: req.body.isClassified,
                            isIdea: req.body.isIdea,
                            participants: req.body.participants,
                            editedAt: Date.now(),
                            statusChanges
                        }
                    },
                    (err, result) => {
                        if (result.writeError || err) {
                            res.setHeader("Content-Type", "application/json");
                            res.send({
                                message: "Couldn't update product",
                                code: "EPE3"
                            });
                        } else {
                            res.setHeader("Content-Type", "application/json");
                            res.send({
                                message: `Successfully updated product ${result._id}`,
                                code: "EPS"
                            });
                        }
                    }
                );
        });
};

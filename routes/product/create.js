const db = require("../../utils/database");

module.exports = (req, res) => {
    db.get()
        .collection("products")
        .insert(
            {
                productName: req.body.productName,
                shortDescription: req.body.shortDescription,
                longDescription: req.body.longDescription,
                logos: [req.body.logo],
                technologies: req.body.technologies,
                components: req.body.components,
                environmentRequirements: req.body.environmentRequirements,
                customers: req.body.customers,
                productOwner: req.body.productOwner,
                salesPerson: req.body.salesPerson,
                lifecycleStatus: req.body.lifecycleStatus,
                businessType: req.body.businessType,
                pricing: req.body.pricing,
                isClassified: req.body.isClassified,
                isIdea: req.body.isIdea,
                participants: req.body.participants,
                createdAt: Date.now(),
                editedAt: Date.now(),
                creator: req.session.email,
                statusChanges: [
                    {
                        statusCode: req.body.lifecycleStatus,
                        startedAt: Date.now(),
                        endedAt: null
                    }
                ],
                deleted: false
            },
            (err, result) => {
                if (result.nInserted == 0 || err) {
                    res.setHeader("Content-Type", "application/json");
                    res.send({ message: "Couldn't add product", code: "APE3" });
                } else {
                    res.setHeader("Content-Type", "application/json");
                    res.send({
                        message: `Successfully created product ${result.id}`,
                        code: "APS"
                    });
                }
            }
        );
};

const db = require("./database");

module.exports = () => {
    db.get()
        .collection("products")
        .find({ deleted: { $ne: true } })
        .project({ technologies: 1, components: 1, environmentRequirements: 1 })
        .toArray(async (err, results) => {
            if (err || results.length === 0) {
                console.log(err.message);
            } else {
                let technologies = [];
                let components = [];
                let environmentRequirements = [];

                results.forEach(result => {
                    technologies = [...technologies, ...result.technologies];
                    components = [...components, ...result.components];
                    environmentRequirements = [
                        ...environmentRequirements,
                        ...result.environmentRequirements
                    ];
                });

                technologies = [...new Set(technologies)];
                components = [...new Set(components)];
                environmentRequirements = [...new Set(environmentRequirements)];

                await db
                    .get()
                    .collection("technologies")
                    .remove();
                await db
                    .get()
                    .collection("components")
                    .remove();
                await db
                    .get()
                    .collection("environmentRequirements")
                    .remove();

                technologies.forEach(item => {
                    db.get()
                        .collection("technologies")
                        .insert({ technology: item });
                });
                components.forEach(item => {
                    db.get()
                        .collection("components")
                        .insert({ component: item });
                });
                environmentRequirements.forEach(item => {
                    db.get()
                        .collection("environmentRequirements")
                        .insert({
                            environmentRequirement: item
                        });
                });
                console.log("Cleanup done");
            }
        });
};

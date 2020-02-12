var server = require("../server"),
    chai = require("chai"),
    chaiHTTP = require("chai-http"),
    should = chai.should();

chai.use(chaiHTTP);

reqServer = server || process.env.HTTP_TEST_SERVER;
var agent = chai.request.agent(reqServer);

describe("Basic routes tests", function() {
    it("GET to / should return 200", function(done) {
        chai.request(reqServer)
            .get("/")
            .end(function(err, res) {
                res.should.have.status(200);
                done();
            });
    });

    it("GET to /session should return 200", function(done) {
        chai.request(reqServer)
            .get("/session")
            .auth("admin@admin.com", "admin")
            .end(function(err, res) {
                res.should.have.status(200);
                done();
            });
    });

    it("Get users without logging in", function(done) {
        chai.request(reqServer)
            .get("/users")
            .end(function(err, res) {
                res.should.have.status(401);
                done();
            });
    });

    it("Get users when logged in", function(done) {
        agent
            .post("/login")
            .auth("admin@admin.com", "admin")
            .then(function(res) {
                agent.get("/users").end(function(err, res2) {
                    res2.should.have.status(200);
                    done();
                });
            });
    });

    it("Adding a product without logging in", function(done) {
        chai.request(reqServer)
            .post("/addProduct")
            .send({
                productName: "me",
                shortDescription: "123",
                lifecycleStatus: 1
            })
            .end(function(err, res) {
                res.should.have.status(401);
                done();
            });
    });

    it("Adding a product with wrong form data", function(done) {
        agent
            .post("/login")
            .auth("jorma@mail.com", "jorma")
            .then(function(res) {
                agent
                    .post("/addProduct")
                    .send({
                        productName: ""
                    })
                    .end(function(err, res2) {
                        res2.should.have.status(400);
                        done();
                    });
            });
    });

    it("Editing password without logging in", function(done) {
        chai.request(reqServer)
            .post("/editPassword")
            .send({
                oldPassword: "123456",
                password: "12345678"
            })
            .end(function(err, res) {
                res.should.have.status(401);
                done();
            });
    });

    it("Editing password with wrong form data", function(done) {
        agent
            .post("/login")
            .auth("jorma@mail.com", "jorma")
            .then(function(res) {
                agent
                    .post("/editPassword")
                    .send({
                        oldPassword: "",
                        password: "1"
                    })
                    .end(function(err, res2) {
                        res2.should.have.status(400);
                        done();
                    });
            });
    });

    it("Editing a product without logging in", function(done) {
        chai.request(reqServer)
            .post("/editProduct")
            .send({
                productName: "me",
                shortDescription: "123",
                lifecycleStatus: 1
            })
            .end(function(err, res) {
                res.should.have.status(401);
                done();
            });
    });

    it("Editing a product with wrong form data", function(done) {
        agent
            .post("/login")
            .auth("jorma@mail.com", "jorma")
            .then(function(res) {
                agent
                    .post("/editProduct")
                    .send({
                        productName: ""
                    })
                    .end(function(err, res) {
                        res.should.have.status(400);
                        done();
                    });
            });
    });

    it("Restoring a product without logging in", function(done) {
        chai.request(reqServer)
            .post("/restoreProduct")
            .send({
                _id: "1223535423"
            })
            .end(function(err, res) {
                res.should.have.status(401);
                done();
            });
    });

    it("Restoring a product with wrong form data", function(done) {
        agent
            .post("/login")
            .auth("admin@admin.com", "admin")
            .then(function(res) {
                agent
                    .post("/restoreProduct")
                    .send({
                        _id: ""
                    })
                    .end(function(err, res) {
                        res.should.have.status(400);
                        done();
                    });
            });
    });

    it("Deleting a user without Admin priviledges", function(done) {
        chai.request(reqServer)
            .post("/deleteUser")
            .send({
                email: "paavo@paavo.com"
            })
            .end(function(err, res) {
                res.should.have.status(401);
                done();
            });
    });

    it("Deleting a user with wrong form data", function(done) {
        agent
            .post("/login")
            .auth("admin@admin.com", "admin")
            .then(function(res) {
                agent
                    .post("/deleteUser")
                    .send({
                        email: "paavo"
                    })
                    .end(function(err, res) {
                        res.should.have.status(400);
                        done();
                    });
            });
    });

    it("Creating a new user without Admin priviledges", function(done) {
        chai.request(reqServer)
            .post("/newUser")
            .send({
                name: "Paavo",
                email: "paavo@paavo.com",
                password: "Pave",
                userGroup: 3
            })
            .end(function(err, res) {
                res.should.have.status(401);
                done();
            });
    });

    it("Creating a new user with Admin priviledges", function(done) {
        agent
            .post("/login")
            .auth("admin@admin.com", "admin")
            .then(function(res) {
                agent
                    .post("/newUser")
                    .send({
                        name: "Paavo",
                        email: "paavo@paavo.com",
                        password: "Pave",
                        userGroup: 3
                    })
                    .end(function(err, res) {
                        res.should.have.status(200);
                        done();
                    });
            });
    });

    it("Deleting a user", function(done) {
        agent
            .post("/login")
            .auth("admin@admin.com", "admin")
            .then(function(res) {
                agent
                    .post("/deleteUser")
                    .send({
                        email: "paavo@paavo.com"
                    })
                    .end(function(err, res) {
                        res.should.have.status(200);
                        done();
                    });
            });
    });

    it("Creating a new user with wrong form data", function(done) {
        agent
            .post("/login")
            .auth("admin@admin.com", "admin")
            .then(function(res) {
                agent
                    .post("/newUser")
                    .send({
                        name: "Make",
                        email: "Mail"
                    })
                    .end(function(err, res) {
                        res.should.have.status(400);
                        done();
                    });
            });
    });

    it("Editing a user without Admin priviledges", function(done) {
        chai.request(reqServer)
            .post("/editUser")
            .send({
                reqEmail: "paavo@paavo.com",
                name: "Paavo",
                email: "paavo@paavo.com",
                password: "Pave",
                userGroup: 3
            })
            .end(function(err, res) {
                res.should.have.status(401);
                done();
            });
    });

    it("Editing a user with wrong form data", function(done) {
        agent
            .post("/login")
            .auth("admin@admin.com", "admin")
            .then(function(res) {
                agent
                    .post("/editUser")
                    .send({
                        reqEmail: "paavo@paavo.com",
                        name: "P"
                    })
                    .end(function(err, res) {
                        res.should.have.status(400);
                        done();
                    });
            });
    });
});

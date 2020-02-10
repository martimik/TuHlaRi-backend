var server = require("../server"),
    chai = require("chai"),
    chaiHTTP = require("chai-http"),
    should = chai.should();

chai.use(chaiHTTP);

reqServer = process.env.HTTP_TEST_SERVER || server;

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
            .end(function(err, res) {
                res.should.have.status(200);
                done();
            });
    });

    /* To be done in the future maybe 
   it("Get users without logging in", function(done) {
        chai.request(reqServer)
            .get("/users")
            .end(function(err, res) {
                res.should.have.status(401);
                done();
            });
    }); */

    it("Setup session and GET users", function(done) {
        chai.request(reqServer)
            .get("/users")
            .auth("jorma@mail.com", "jorma")
            .end(function(err, res) {
                console.log(res.body);
                res.should.have.status(200);
                res.body.should.be.a("array");
                done();
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

    it("Restoring a product without logging in", function(done) {
        chai.request(reqServer)
            .post("/restoreProduct")
            .send({
                _id: "paavo"
            })
            .end(function(err, res) {
                res.should.have.status(401);
                done();
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
});

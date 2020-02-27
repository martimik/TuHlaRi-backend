module.exports = {
    name: "auth",
    secret: "MerchantsCoolShop####",
    saveUninitialized: false,
    resave: true,
    rolling: true,
    cookie: {
        httpOnly: true,
        maxAge: 1000 * 60 * 30 // 30 minutes
    }
};

const express = require("express");
const router = express.Router();

const AuthController = require("../src/users/user.controller");


router.get("/ETH/:adresse", cleanBody, AuthController.ReferredAccounts);



module.exports = router;

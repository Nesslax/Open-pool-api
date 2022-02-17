const express = require("express");
const router = express.Router();

const cleanBody = require("../../middlewares/cleanbody");
const Controller = require("./controller");


router.get("/:coin/:adress/", cleanBody, Controller.ethgetter);

//router.get("/:coin/:adress/workers", cleanBody, Controller.workerGetter);


module.exports = router;

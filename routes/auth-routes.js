const express = require('express');
const {
  registerUser,
  loginUser,
  changePassword
} = require("../controller/auth-controller");
const router = express.Router();
const authMiddleware = require('../middleware/auth-middleware');

//all routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/change-password", authMiddleware,changePassword);


module.exports = router;
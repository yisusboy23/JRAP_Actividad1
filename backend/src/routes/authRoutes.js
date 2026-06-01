const express = require("express");
const router  = express.Router();
// Así debe quedar (agrega register):
const { login, setPassword, register } = require("../controllers/authController");
router.post("/login",        login);
router.post("/set-password", setPassword); // ⚠️ solo para setup
router.post("/register",     register);

module.exports = router;

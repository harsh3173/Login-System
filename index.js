const express = require('express');
const router = express.Router();
var jimp = require('jimp');

const { ensureAuthenticated, forwardAuthenticated } = require(__dirname+"/auth");


// Welcome Page
router.get('/', forwardAuthenticated, (req, res) => res.render('welcome'));

// Dashboard
router.get('/dashboard', ensureAuthenticated, (req, res) =>
  res.render('dashboard', {
    user: req.user
  })
);

module.exports = router;

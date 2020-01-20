const express = require('express');
const router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.setHeader('set-cookie', [
    'cross-site-cookie=theme; SameSite=None; Secure',
  ]);
  res.render('index', { title: 'Express' });
});

module.exports = router;

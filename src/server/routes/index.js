const express = require('express');
const router = express.Router();

const indexController = require('../controllers/index');

router.get('/', function (req, res, next) {
  const renderObject = {};
  renderObject.title = 'Welcome to Express!';
  indexController.sum(1, 2, (error, results) => {
    if (error) return next(error);
    if (results) {
      renderObject.mottoArea = null;
      renderObject.sum = results;
      renderObject.user = req.user;
      res.render('pages/index', renderObject);
    }
  });
});

module.exports = router;

const express = require('express');
const router = express.Router();

const indexController = require('../controllers/index');

router.get('/', function (req, res, next) {
  const renderObject = {};
  renderObject.title = 'Welcome to Express!';
  renderObject.index = '<i>indexObject here</i>';
  renderObject.user = req.user;
  indexController.sum(1, 2, (error, results) => {
    if (error) return next(error);
    if (results) {
      renderObject.sum = results;
      res.render('pages/index', renderObject);
    }
  });
});

module.exports = router;

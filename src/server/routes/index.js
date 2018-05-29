const express = require('express');
const router = express.Router();

const indexController = require('../controllers/index');

router.get('/', function (req, res, next) {
  const renderObject = {};
  renderObject.title = 'mainpage';
  indexController.mottoArea((results) => {
    if (!results) results = 'Error cat\'ing mottoArea!'; 
    renderObject.mottoArea = results;
    renderObject.user = req.user;
    res.render('pages/index', renderObject);
  });
});

module.exports = router;

const express = require('express');
const router = express.Router();

const authHelpers = require('../auth/_helpers');

router.get('/register', function (req, res, next) {
  const renderObject = {};
  renderObject.title = 'Register';
  renderObject.user = req.user;
  renderObject.pagestatus = req.session.pagestatus ? req.session.pagestatus : false;
  delete req.session.pagestatus;
  res.render('pages/register', renderObject);
});

router.get('/login', function (req, res, next) {
  const renderObject = {};
  renderObject.title = 'Login';
  renderObject.user = req.user;
  renderObject.pagestatus = req.session.pagestatus ? req.session.pagestatus : false;
  delete req.session.pagestatus;
  res.render('pages/login', renderObject);
});

router.get('/logout', function (req, res, next) {
  res.redirect('/auth/logout');
});

module.exports = router;

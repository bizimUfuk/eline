const express = require('express');
const router = express.Router();

const authHelpers = require('../auth/_helpers');
const passport = require('../auth/local');

router.post('/register', authHelpers.loginRedirect, (req, res, next)  => {
  return authHelpers.createUser(req, res)
  .then((response) => {
    passport.authenticate('local', (err, user, info) => {
      if (user) {
        req.login(user, function (err) {
          if (err) { return handleResponse (res, 500, 'error'); }
          return res.status(200).redirect('/');
        });
      } else {
        handleResponse(res, 404, 'User cannot register');
      }
    })(req, res, next);
  })
  .catch((err) => { handleResponse(res, 500, 'error'); });
});

router.post('/login', authHelpers.loginRedirect, (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) { handleResponse(res, 500, 'error'); }
    if (!user) {
      req.session.pagestatus = 404;
      res.statusCode = 404;
      return res.redirect('/login');
    }
    if (user) {
      req.login(user, function (err) {
        if (err) {
          req.session.pagestatus = 401;
          return res.status(401).redirect('/login');
        }
        return res.status(200).redirect('/');
      });
    }
  })(req, res, next);
});

router.get('/logout', authHelpers.loginRequired, (req, res, next) => {
  req.logout();
  handleResponse(res, 200, 'success');
});

function handleResponse(res, code, statusMsg) {
  res.status(code).json({status: statusMsg});
}

module.exports = router;


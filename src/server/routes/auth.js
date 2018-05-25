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
          if (err) { return res.status(500).redirect('/login'); }
          return res.status(200).redirect('/');
        });
      } else {
        req.session.pagestatus = response;
        return res.redirect('/register');
      }
    })(req, res, next);
  })
  .catch((err) => {
    console.log('auth createUser catch err: ', err);
    return res.status(401).redirect('/register');
  });
});

router.post('/login', authHelpers.loginRedirect, (req, res, next) => {
  passport.authenticate('local',{ successRedirect: '/liveline' }, (err, user, info) => {
    if (err) { handleResponse(res, 500, 'error'); }
    if (!user) {
      req.session.pagestatus = {code: 404, elem: 'username', msg: 'User not found!'};
      return res.redirect('back');
    }
    if (user) {
      req.login(user, function (err) {
        if (err) {
          req.session.pagestatus = {code: 401, elem: 'password', msg: 'Wrong password!'};
          return res.status(401).redirect('/login');
        }
        return res.status(200).redirect('/');
      });
    }
  })(req, res, next);
});

router.get('/logout', authHelpers.loginRequired, (req, res, next) => {
  req.logout();
  return res.status(200).redirect('/');
});

function handleResponse(res, code, statusMsg) {
  res.status(code).json({status: statusMsg});
}

module.exports = router;


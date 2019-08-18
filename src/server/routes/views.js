
const express = require('express');
const router = express.Router();

var u = require('../../mottoUtils');

const authHelpers = require('../auth/_helpers');

const ipfsController = require('../controllers/ipfs');
var mottoArea;
ipfsController.mottoArea((r) => { mottoArea = r; });

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

//ipfs routes
router.get('/liveline(\/:hash)?(\/:sub)?', authHelpers.loginRequired, function (req, res, next) {

//  ipfsController.liveline((r) => {
//    const alivemottos = r.length > 1 ? r.sort(function (a,b) { return b.shill - a.shill; }) : r;
    res.render('pages/liveline', { user: req.user, mottoArea: mottoArea, alivemottos: {} });
  //});
});

router.put('/ipfs/:hash/:filename', authHelpers.loginRequired, function (req, res, next){
  ipfsController.recordMotto(req, (e, r) => {
    if (e) res.status(500).send('Failed to put IPFS hash');
    u.logdebug('response from ipfsPUT for %s: %o',  req.params.hash, r);
    res.setHeader('Ipfs-Hash', r);
    res.send('ipfsPUT:OK');
  });
});
module.exports = router;

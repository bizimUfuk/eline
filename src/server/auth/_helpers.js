const bcrypt = require('bcryptjs');
const knex = require('../db/connection');

const pagestatusmap = {
  un00: { elem: 'username', code: 401, msg: 'Please provide a valid username!' },
  un01: { elem: 'username', code: 409, msg: 'Username taken!' },
  un02: { elem: 'username', code: 404, msg: 'User not found!' },
  un03: { elem: 'username', code: 401, msg: 'username not allowed!' },
  em01: { elem: 'email', code: 401, msg: 'email address already registered!'},
  em02: { elem: 'email', code: 401, msg: 'Please provide a valid email address!'},
  pw01: { elem: 'password', code: 401, msg: 'Please provide a valid password!' },
  re01: { elem: 'referrer', code: 401, msg: 'Invalid referrer!'},
  re02: { elem: 'referrer', code: 401, msg: 'Referrer not acceptable!'},
  ic01: { elem: 'invicode', code: 401, msg: 'Invitation invalid!'},
  ic02: { elem: 'invicode', code: 401, msg: 'Invitation expired!'}
};

function comparePass(userPassword, databasePassword) {
  return bcrypt.compareSync(userPassword, databasePassword);
}

function createUser (req) {
  return isValid(req.body)
  .then(() => {
      const salt = bcrypt.genSaltSync();
      const hash = bcrypt.hashSync(req.body.password, salt);

      return knex('users')
      .insert({
        username: req.body.username,
        email: req.body.email,
        referrer: req.body.referrer,
        password: hash
      })
      .returning('*')
      .then((toReturn) => {
        expireInvitaion(req.body);
        return toReturn;
      });
  })
  .catch((err) => {
    console.log('error with createUser in auth/_helpers. err: %o ', err);
    return pagestatusmap[err[0]];
  });
}

function loginRequired(req, res, next) {
  if (!req.user) return res.status(401).redirect('/login');
  return next();
}

function adminRequired(req, res, next) {
  if (!req.user) res.status(401).json({status: 'Please log in'});
  return knex('users').where({username: req.user.username}).first()
  .then((user) => {
    if (!user.admin) res.status(401).json({status: 'You are not authorized'});
    return next();
  })
  .catch((err) => {
    res.status(500).json({status: 'Something bad happened'});
  });
}

function loginRedirect(req, res, next) {
  if (req.user) return res.status(401).redirect(req.path);
  return next();
}

function isValid(user) {
  var fails = [];

  var usernamecheck = new Promise((resolve, reject) => {
    knex('users').where({ username: user.username }).first()
    .then((record) => {
      if (record) {
        fails.push('un01');
        reject(fails);
      } else {
        resolve(true);
      }
    })
    .catch((err) => {
      reject(err);
    });
  });

  var emailcheck = new Promise((resolve, reject) => {
    knex('users').where({ email: user.email }).first()
    .then((record) => {
      if (record) {
        fails.push('em01');
        reject(fails);
      } else {
        resolve(true);
      }
    })
    .catch((err) => {
      reject(err);
    });
  });

  var invicodecheck = new Promise(function(resolve, reject) {
    knex('invitations').where({ inviting: user.referrer, invited: user.username, invicode: user.invicode }).first()
    .then((record) => {
      if (!record) {
        fails.push('ic01');
        reject(fails);
      } else if (record.isexpired === true) {
        fails.push('ic02');
        reject(fails);
      } else {
        resolve(true);
      }
    })
    .catch((err) => {
      reject(err);
    });
  });

  return new Promise((resolve, reject) => {
    Promise.all([usernamecheck, emailcheck, invicodecheck])
    .then(() => { resolve(true); })
    .catch((err) => { reject(fails); });
  });
}

function expireInvitaion (user) {
  return knex('invitations')
  .update({
    isexpired: true,
    expired_at: knex.raw('now()')
  })
  .where({ inviting: user.referrer, invited: user.username, invicode: user.invicode })
  .returning('*')
  .catch((err) => console.log('expireInvitation error: ', err));
}

module.exports = {
  comparePass,
  createUser,
  loginRequired,
  adminRequired,
  loginRedirect,
  expireInvitaion
};


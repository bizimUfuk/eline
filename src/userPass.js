'use strict';

var mottoDB = require('./mottoDB');
var passport = require('passport'), LocalStrategy = require('passport-local').Strategy;


passport.use(new LocalStrategy((username, password, cb) => {
	let qry = 'SELECT id, username, password, type FROM users WHERE username='+username;
	mottoDB.mottoQry(qry, (err, fetch) => {
		if(err) {
			u.logdebug('Error when selecting user on login', err)
			return cb(err)
		}

		if(fetch.rows.length > 0) {
			const first = fetch.rows[0]
			bcrypt.compare(password, first.password, function(err, res) {
				if(res) {
					cb(null, { id: first.id, username: first.username, type: first.type })
				} else {
					cb(null, false)
				}
			})
		} else {
			cb(null, false)
		}
	})
}));

passport.serializeUser((user, done) => {
  done(null, user.id)
})

passport.deserializeUser((id, cb) => {
let uid = parseInt(id, 10); 
  mottoDB.mottoQry('SELECT id, username, type FROM users WHERE id ='+uid, (err, results) => {
    if(err) {
      winston.error('Error when selecting user on session deserialize', err)
      return cb(err)
    }

    cb(null, results.rows[0])

  })
});


module.exports = {passport : passport};

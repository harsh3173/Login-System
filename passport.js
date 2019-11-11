const LocalStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const passport = require('passport');
// Load User model
const User = require(__dirname + "/user");
module.exports = function(passport) {
	passport.use(new LocalStrategy({
		usernameField: 'username'
	}, (username, password, done) => {
		// Match user
		User.findOne({
			username: username
		}).then(user => {
			if(!user) {
				return done(null, false, {
					message: 'Account for this Application is not registered'
				});
			}
			// Match password
			bcrypt.compare(password, user.password, (err, isMatch) => {
				if(err) throw err;
				if(isMatch) {
					return done(null, user);
				} else {
					return done(null, false, {
						message: 'Password incorrect'
					});
				}
			});
		});
	}));
	passport.serializeUser(function(user, done) {
		done(null, user.id);
	});
	passport.deserializeUser(function(id, done) {
		User.findById(id, function(err, user) {
			done(err, user);
		});
	});
};

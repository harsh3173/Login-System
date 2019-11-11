const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const nodemailer = require("nodemailer")
const mongoose = require('mongoose');
const passportLocalMongoose = require("passport-local-mongoose");
const cookieParser = require('cookie-parser');
const LocalStrategy = require('passport-local').Strategy;
const async = require('async');
const crypto = require('crypto');
var _ = require('lodash');
// Load User model
const User = require(__dirname + "/user");
const Student = require(__dirname + "/student");
const {
	forwardAuthenticated
} = require(__dirname + "/auth");
// Login Page
router.get('/login', forwardAuthenticated, (req, res) => res.render('login'));
// Register Page
router.get('/register', forwardAuthenticated, (req, res) => res.render('register'));
router.get('/forgot', forwardAuthenticated, (req, res) => res.render('forgot', {
	user: req.user
}));
// Register
router.post('/register', (req, res) => {
	const firstName = _.capitalize(req.body.firstName);
	const lastName = _.capitalize(req.body.lastName);
	const username = req.body.username;
	const email = req.body.email;
	const password = req.body.password;
	const password2 = req.body.password2;
	let errors = [];
	if(!firstName || !lastName || !email || !username || !password || !password2) {
		errors.push({
			msg: 'Please enter all fields'
		});
	}
	if(password != password2) {
		errors.push({
			msg: 'Passwords do not match'
		});
	}
	if(password.length < 8) {
		errors.push({
			msg: 'Password must be at least 8 characters'
		});
	}
	if(errors.length > 0) {
		res.render('register', {
			errors,
			firstName,
			lastName,
			username,
			email,
			password,
			password2
		});
	} else {
		User.findOne({
			username: username
		}, function(err, user) {
			if(user) {
				errors.push({
					msg: 'Application Number already exists'
				});
				res.render('register', {
					errors,
					firstName,
					lastName,
					username,
					email,
					password,
					password2
				});
			} else {
				Student.findOne({
					username: username
				}, function(err, student) {
					if(student) {
						if(firstName === _.capitalize(student.firstName) && lastName === _.capitalize(student.lastName)) {
							console.log("Verified Names");
							const newUser = new User({
								firstName,
								lastName,
								username,
								email,
								password
							});
							//Encrypting Password
							bcrypt.genSalt(10, (err, salt) => {
								bcrypt.hash(newUser.password, salt, (err, hash) => {
									if(err) throw err;
									newUser.password = hash;
									newUser.save().then(user => {
										req.flash('success_msg', 'You are now registered and can log in');
										//     Sending a confirmation mail.
										var transporter = nodemailer.createTransport({
											service: "gmail",
											auth: {
												user: userMail,
												pass: userPass
											}
										})
										var mailOptions = {
											from: "harshfromwork@gmail.com",
											to: user.email,
											subject: "Registration Successfull",
											text: "Hi, " + _.capitalize(firstName) + " " + _.capitalize(lastName) + " this a confirmation mail as you have been registered successfully, and your Application Number is " + username + ".  "
										}
										transporter.sendMail(mailOptions, function(err, info) {
											if(err) {
												console.log(err);
											} else {
												req.flash('success_msg', 'Also a confirmation Email has been sent to your Mail Account.');
												console.log("Registration Email sent:" + info.response)
											}
										})
										res.redirect('/users/login');
									}).catch(err => console.log(err));
								});
							});
						} else {
							console.log("Names are not valid for given Application Number");
							req.flash('error_msg', "Names are not valid for given Application Number.\n Try Again");
							res.redirect('/users/register');
						}
					} else {
						console.log("No User found in DataBase");
						req.flash('error_msg', "No User with given Application Number found in DataBase.\n Try Again");
						res.redirect('/users/register');
					}
				})
			}
		})
	}
});
// Login
router.post('/login', (req, res, next) => {
	passport.authenticate('local', {
		successRedirect: '/dashboard',
		failureRedirect: '/users/login',
		failureFlash: true
	})(req, res, next);
});
// Logout
router.get('/logout', (req, res) => {
	req.logout();
	req.flash('success_msg', 'You are logged out');
	res.redirect('/users/login');
});
// forgot password
router.get('/forgot', function(req, res) {
	res.render('forgot');
});
router.post('/forgot', function(req, res, next) {
	async.waterfall([
		function(done) {
			crypto.randomBytes(32, function(err, buf) {
				var token = buf.toString('hex');
				done(err, token);
			});
		},
		function(token, done) {
			User.findOne({
				username: req.body.username
			}, function(err, user) {
				const email = user.email;
				if(!user) {
					req.flash('error_msg', 'No account with that email address exists.');
					res.redirect('/login');
				}
				user.resetPasswordToken = token;
				user.resetPasswordExpires = Date.now() + 3600000; // 60 minutes
				user.save(function(err) {
					done(err, token, user);
				});
			});
		},
		function(token, user, done) {
			var smtpTransport = nodemailer.createTransport({
				service: 'Gmail',
				auth: {
					user: userMail,
					pass: userPass
				}
			});
			var mailOptions = {
				from: "harshfromwork@gmail.com",
				to: user.email,
				subject: 'Password Reset',
				text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' + 'Please click on the following link, or paste this into your browser to complete the process:\n\n' + 'http://' + req.headers.host + '/users/reset/' + token + '\n\n' + 'If you did not request this, please ignore this email and your password will remain unchanged.\n'
			};
			smtpTransport.sendMail(mailOptions, function(err) {
				console.log("Email sent:" + info.response)
				req.flash('success_msg', 'An Email has been sent to your mail with further instructions.');
			});
			req.flash('success_msg', 'An Email has been sent to your registered Mail Account with further instructions.');
			res.redirect('/users/login');
		}
	]);
});
router.get('/reset/:token', function(req, res) {
	User.findOne({
		resetPasswordToken: req.params.token,
		resetPasswordExpires: {
			$gt: Date.now()
		}
	}, function(err, user) {
		if(!user) {
			req.flash('error_msg', 'Password reset token is invalid or has expired.');
			return res.redirect('/forgot');
		}
		res.render('reset', {
			token: req.params.token
		});
	});
});
router.post('/reset/:token', function(req, res) {
	async.waterfall([
		function(done) {
			User.findOne({
				resetPasswordToken: req.params.token,
				resetPasswordExpires: {
					$gt: Date.now()
				}
			}, function(err, user) {
				if(!user) {
					req.flash('error_msg', 'Password reset token is invalid or has expired.');
					return res.redirect('back');
				}
				var password = req.body.password
				if(password.length < 8) {
					req.flash('error_msg', 'Password must be at least 8 characters');
					return res.redirect('back');
				}
				if(req.body.password === req.body.confirm) {
					// Update password with hash
					bcrypt.hash(password, (hash) => {
						req.body.password = hash
					});
					bcrypt.genSalt(10, (err, salt) => {
						bcrypt.hash(password, salt, (err, hash) => {
							if(err) throw err;
							user.password = hash;
							user.resetPasswordToken = undefined;
							user.resetPasswordExpires = undefined;
							user.save().then(user => {
								var smtpTransport = nodemailer.createTransport({
									service: 'Gmail',
									auth: {
										user: userMail,
										pass: userPass
									}
								});
								var mailOptions = {
									from: "harshfromwork@gmail.com",
									to: user.email,
									subject: 'Your password has been changed',
									text: 'Hello,\n\n' + 'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
								};
								smtpTransport.sendMail(mailOptions, function(err) {
									console.log("Password changed");
									console.log("Email Sent: " + info.response);
								});
								req.flash('success_msg', 'Congratulations! Your password has been changed');
								res.redirect('/users/login');
							}).catch(err => console.log(err));
						});
					});
				} else {
					req.flash("error", "Passwords do not match.");
					return res.redirect('back');
				}
			});
		}
	], function(err) {
		console.log(err);
		res.redirect('/users/login');
	});
});
module.exports = router;

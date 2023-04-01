const User = require("../models/User");
const jwt = require('jsonwebtoken');

// handle errors
const handleErrors = (err) => {
  console.log(err.message, err.code, err.keyValue);
  let errors = { email: '', nickname: '', password: '' };
  let keyValue = err.keyValue ? Object.keys(err.keyValue)[0] : undefined;

  if (err.message === 'incorrect email') {
    errors.email = 'That email is not registered';
  }

  if (err.message === 'incorrect password') {
    errors.password = 'That password is incorrect';
  }

  if (err.code === 11000 && keyValue === 'email') {
    errors.email = 'That email is already registered';
    return errors;
  }

  if (err.code === 11000 && keyValue === 'nickname') {
    errors.nickname = 'That nickname is already registered';
    return errors;
  }

  if (err.message.includes('user validation failed')) {
    Object.values(err.errors).forEach(({ properties }) => {
      errors[properties.path] = properties.message;
    });
  }

  return errors;
}

// create json web token
const maxAge = 3 * 24 * 60 * 60;
const createJwtToken = (id) => {
  return jwt.sign({ id }, 'fdas79hyq3aAEDadsaKey', {
    expiresIn: maxAge
  });
};

// controller actions
module.exports.signup_get = (req, res) => {
  res.render('signup');
}

module.exports.login_get = (req, res) => {
  res.render('login');
}

module.exports.signup_post = async (req, res) => {
  const { email, nickname, password } = req.body;

  try {
    const user = await User.create({ email, nickname, password });
    const token = createJwtToken(user._id);
    res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });
    res.cookie('userNickname', user.nickname, { maxAge: maxAge * 1000 });
    res.status(201).json({ user: user._id });
  }
  catch(err) {
    const errors = handleErrors(err);
    res.status(400).json({ errors });
  }
 
}

module.exports.login_post = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.login(email, password);
    const token = createJwtToken(user._id);
    res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });
    res.cookie('userNickname', user.nickname, { maxAge: maxAge * 1000 });
    res.status(200).json({ user: user._id });
  } 
  catch (err) {
    const errors = handleErrors(err);
    res.status(400).json({ errors });
  }

}

module.exports.logout_get = (req, res) => {
  res.cookie('jwt', '', { maxAge: 1 });
  res.redirect('/');
}
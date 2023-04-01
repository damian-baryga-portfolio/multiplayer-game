const jwt = require('jsonwebtoken');
const User = require('../models/User');

const requireAuth = (req, res, next) => {
  const token = req?.cookies?.jwt;

  // check json web token exists & is verified
  if (token) {
    jwt.verify(token, 'fdas79hyq3aAEDadsaKey', (err, decodedToken) => {
      if (err) {
        console.log(err.message);
        res.redirect('/login');
      } else {
        // console.log(decodedToken);
        next();
      }
    });
  } else {
    res.redirect('/login');
  }
};

// check current user
const checkUser = (req, res, next) => {
  const token = req.cookies.jwt;

  if (token) {
    jwt.verify(token, 'fdas79hyq3aAEDadsaKey', async (err, decodedToken) => {
      if (err) {
        res.locals.user = null;
        next();
      } else {
        // THIS IS HOW I GET THE USERS DATA FROM DB
        let user = await User.findById(decodedToken.id);
        // THIS IS HOW I PASS A VARIABLE 'user' TO .EJS VIEW
        res.locals.user = user;
        next();
      }
    });
  } else {
    res.locals.user = null;
    next();
  }
};

// const addGuest = () => {
//   const newGuest = Math.floor(Math.random() * 100);
//   if (!guests.includes(newGuest)) {
//     guests.push(newGuest);
//     console.log(guests)
//   } else {
//     addGuest();
//   }
// }


module.exports = { requireAuth, checkUser };
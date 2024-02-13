// const expressSession = require("express-session");
// const mongoStore = require("./mongoStore");
const { getIronSession } = require("iron-session");
const { cookies } = require("next/headers");

module.exports = getIronSession(cookies(), {password: process.env.SESSION_SECRET, cookieName: process.env.COOKIE_NAME});

// module.exports = expressSession({
//   secret: process.env.SESSION_SECRET,
//   resave: false,
//   saveUninitialized: false,
//   cookie: {
//     path: "/",
//     httpOnly: true,
//     maxAge: 14 * 24 * 60 * 60 * 1000,
//     secure: false,
//     //oh secure: true
//   },
//   store: mongoStore,
// });

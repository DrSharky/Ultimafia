// const expressSession = require("express-session");
const { getIronSession } = require("iron-session");
const { cookies } = require("next/headers");
const session = getIronSession(cookies(), { password: process.env.SESSION_SECRET, cookieName: process.env.COOKIE_NAME})
const mongoStore = require("connect-mongo")(session);
const db = require("../db/db");

module.exports = new mongoStore({
  mongooseConnection: db.conn,
  ttl: 14 * 24 * 60 * 60,
  touchAfter: 24 * 60 * 60,
  stringify: false,
});

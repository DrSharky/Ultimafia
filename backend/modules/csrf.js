const { getIronSession } = require("iron-session");
module.exports = function (req, res, next) {
  const session = getIronSession(req, res, {password: process.env.SESSION_SECRET, cookieName: process.env.COOKIE_NAME});
  if (
    req.method != "GET" &&
    session.user &&
    session.user.id &&
    req.get("x-csrf") != session.user.csrf
    ) {
      res.sendStatus(403);
      return;
    }

  return next();
};

function ensureAuthenticated(req, res, next){
  if (!req.isAuthenticated()){
    return res.status(403).end();
  }
  return next();
}
module.exports = ensureAuthenticated;

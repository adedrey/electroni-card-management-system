const Admin = require('../models/admin');
module.exports = (req, res, next) => {
  Admin.findOne({
      _id: req.adminId
    })
    .then(user => {
      if (!user) {
        return res.status(401).json({
          message: 'An error occured. Unable to authenticate Administrator'
        });
      }

      req.admin = user;
      next();
    }).catch(err => {
      res.status(500).json({
        message: 'An error occured. Unable to authenticate Administrator'
      })
    })
}
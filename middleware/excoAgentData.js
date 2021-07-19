const Agent = require("../models/agent");
module.exports = (req, res, next) => {
    Agent.findOne({
        _id: req.excoAgentId
      })
      .then(user => {
        if (!user) {
          return res.status(401).json({
            message: 'An error occured. Unable to authenticate user'
          });
        }
  
        req.userExco = user;
        next();
      }).catch(err => {
        res.status(500).json({
          message: 'An error occured. Unable to authenticate user'
        })
      })
  }
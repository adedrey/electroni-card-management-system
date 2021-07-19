const Agent = require('../models/agent');
const Admin = require('../models/admin');
const User = require('../models/users');
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const crypto = require("crypto");
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');
const transporter = nodemailer.createTransport(sendgridTransport({
    auth: {
        api_key: process.env.SENDGRID_APIKEY
    }
}));

/*
  User Authentication Begins
*/
exports.postUserLogin = async (req, res, next) => {
    try {
        const uniqueId = req.body.uniqueId;
        const password = req.body.password;
        const user = await User.findOne({
            uniqueId: uniqueId
        });
        if (!user) {
            return res.status(401).json({
                message: "Access Denied!"
            });
        }
        if (!user.approved) {
            return res.status(401).json({
                message: 'Waiting for verfication.'
            })
        }
        const doMatch = await bcrypt.compare(password, user.password);
        if (!doMatch) {
            return res.status(401).json({
                message: "Access Denied!"
            });
        }
        const token = jwt.sign({
            name: user.firstname,
            userId: user._id
        }, process.env.JWT_KEY_USER, {
            expiresIn: '8760h'
        });

        res.status(200).json({
            token: token,
            expiresIn: "31536000",
            user: user
        });
    } catch (err) {

    }

}
exports.postUserReset = async (req, res, next) => {
    try {
        const email = req.body.email;
        let token;
        const crypt = await crypto.randomBytes(32, (err, Buffer) => {
            if (err) {
                return res.status(401).json({
                    message: 'An unknown error occured'
                })
            }
            token = Buffer.toString('hex');
        });
        const user = await User.findOne({
            email: email
        });
        if (!user) {
            return res.status(401).json({
                message: 'Email does not exist!'
            });
        }
        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 3600000;
        const result = await user.save();
        const message = await transporter.sendMail({
            to: email,
            from: 'admin@esnbiometrics.com',
            subject: 'Energy Smart Biometrics | Reset Password',
            html: `
                               <p>Reset password request</p>
                               <p>Dear ${user.firstname}</p>
                               <p>Click this <a href='https://esnbiometrics.com/reset/${token}'>link</a> to reset your password</p>
                            `
        });
        res.status(200).json({
            message: 'Kindly check your mail for further directives.  Thank you.'
        });
    } catch (err) {
        res.status(500).json({
            message: "Sorry, we couldn't complete your request. Please try again in a moment."
        })
    }

}
exports.getUserNewpassword = async (req, res, next) => {
    try {
        const token = req.params.token;
        const user = await User.findOne({
            resetToken: token,
            resetTokenExpiration: {
                $gt: Date.now()
            }
        })
        if (!user) {
            return res.status(401).json({
                message: 'Invalid/Expired Token!'
            });
        }
        res.status(200).json({
            resetToken: token,
            userId: user._id
        });
    } catch (err) {
        res.status(500).json({
            message: "Sorry, we couldn't complete your request. Please try again in a moment."
        })
    }


}
exports.postUserNewPassword = async (req, res, next) => {
    try {
        const token = req.params.token;
        const newPassword = req.body.password;
        const userId = req.body.userId;
        let authorizedUser;
        const user = await User.findOne({
            _id: userId,
            resetToken: token,
            resetTokenExpiration: {
                $gt: Date.now()
            }
        })
        if (!user) {
            return res.status(401).json({
                message: 'Invalid user! Try again!'
            })
        }
        authorizedUser = user;
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        user.password = hashedPassword;
        user.resetToken = undefined;
        user.resetTokenExpiration = undefined;
        const result = await user.save();
        const message = await transporter.sendMail({
            to: user.email,
            from: 'admin@esnbiometrics.com',
            subject: 'Energy Smart Biometrics | Password reset successful',
            html: '<p>You have successfully changed your password!</p>'
        });
        res.status(200).json({
            message: 'Password reset successful'
        })
    } catch (err) {
        res.status(500).json({
            message: "Sorry, we couldn't complete your request. Please try again in a moment."
        })
    }
}

/*
  Agent Authentication Begins
*/
exports.postAgentLogin = async (req, res, next) => {
    try {
        const email = req.body.email;
        const password = req.body.password;
        const user = await Agent.findOne({
            email: {
                $regex: new RegExp(email)
            }
        })
        if (!user) {
            return res.status(401).json({
                message: "Access Denied!"
            });
        }
        if (!user.is_active) {
            return res.status(401).json({
                message: 'Your account has been suspended. Kindly contact the administrator for further directives.'
            })
        }
        const doMatch = await bcrypt.compare(password, user.password);
        if (!doMatch) {
            return res.status(401).json({
                message: "Access Declined!"
            });
        }
        const token = jwt.sign({
            name: user.name,
            agentId: user._id
        }, process.env.JWT_KEY_USER, {
            expiresIn: '8760h'
        });

        res.status(200).json({
            token: token,
            expiresIn: "31536000",
            agent: user
        });
    } catch (err) {
        res.status(500).json({
            message: "Sorry, we couldn't complete your request. Please try again in a moment."
        })
    }
}
exports.postAgentReset = async (req, res, next) => {
    try {
        const email = req.body.email;
        let token;
        const crypt = await crypto.randomBytes(32, (err, Buffer) => {
            if (err) {
                return res.status(401).json({
                    message: 'An unknown error occured'
                })
            }
            token = Buffer.toString('hex');
        });
        const user = await Agent.findOne({
            email: email
        })
        if (!user) {
            return res.status(401).json({
                message: 'Email does not exist!'
            });
        }
        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 3600000;
        const result = user.save();
        const message = await transporter.sendMail({
            to: user.email,
            from: 'admin@esnbiometrics.com',
            subject: 'Energy Smart Biometrics | Reset Password',
            html: `
                               <p>Reset password request</p>
                               <p>Dear ${user.name}</p>
                               <p>Click this <a href='https://esnbiometrics.com/agent/reset/${token}'>link</a> to reset your password</p>
                            `
        });
        res.status(200).json({
            message: 'Kindly check your mail for further directives.  Thank you.'
        })

    } catch (err) {
        res.status(500).json({
            message: "Sorry, we couldn't complete your request. Please try again in a moment."
        })
    }

}
exports.getAgentNewpassword = async (req, res, next) => {
    try {
        const token = req.params.token;
        const user = await Agent.findOne({
            resetToken: token,
            resetTokenExpiration: {
                $gt: Date.now()
            }
        })
        if (!user) {
            return res.status(401).json({
                message: 'Invalid/Expired Token!'
            });
        }
        res.status(200).json({
            resetToken: token,
            agentId: user._id
        });
    } catch (err) {
        res.status(500).json({
            message: "Sorry, we couldn't complete your request. Please try again in a moment."
        })
    }

}
exports.postAgentNewPassword = async (req, res, next) => {
    try {
        const token = req.body.token;
        const newPassword = req.body.password;
        const agentId = req.body.agentId;
        let authorizedUser;
        const user = await Agent.findOne({
            _id: agentId,
            resetToken: token,
            resetTokenExpiration: {
                $gt: Date.now()
            }
        })
        if (!user) {
            return res.status(401).json({
                message: 'Invalid Agent! Try again!'
            })
        }
        authorizedUser = user;
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        user.password = hashedPassword;
        user.resetToken = undefined;
        user.resetTokenExpiration = undefined;
        const result = await user.save();
        const message = await transporter.sendMail({
            to: user.email,
            from: 'admin@esnbiometrics.com',
            subject: 'Energy Smart Biometrics | Password reset successful',
            html: '<p>You have successfully changed your password!</p>'
        });
        res.status(200).json({
            message: 'Password reset successful'
        })

    } catch (err) {
        res.status(500).json({
            message: "Sorry, we couldn't complete your request. Please try again in a moment."
        })
    }

}


/*
  Exco Agent Authentication Begins
*/
exports.postExcoAgentLogin = async (req, res, next) => {
    try {
        const email = req.body.email;
        const password = req.body.password;
        const user = await Agent.findOne({
            email: email
        })
        if (!user) {
            return res.status(401).json({
                message: "Access Denied!"
            });
        }
        if (user.branch == null) {
            return res.status(401).json({
                message: "Access Denied"
            })
        }
        if (!user.is_active) {
            return res.status(401).json({
                message: 'Your account has been suspended. Kindly contact the administrator for further directives.'
            })
        }
        const doMatch = await bcrypt.compare(password, user.password);
        if (!doMatch) {
            return res.status(401).json({
                message: "Access Declined!"
            });
        }
        const token = jwt.sign({
            name: user.name,
            agentId: user._id
        }, process.env.JWT_KEY_USER, {
            expiresIn: '8760h'
        });

        res.status(200).json({
            token: token,
            expiresIn: "31536000",
            agent: user
        });
    } catch (err) {
        res.status(500).json({
            message: "Sorry, we couldn't complete your request. Please try again in a moment."
        })
    }
}
exports.postExcoAgentReset = async (req, res, next) => {
    try {
        const email = req.body.email;
        let token;
        const crypt = await crypto.randomBytes(32, (err, Buffer) => {
            if (err) {
                return res.status(401).json({
                    message: 'An unknown error occured'
                })
            }
            token = Buffer.toString('hex');
        });
        const user = await Agent.findOne({
            email: email
        })
        if (!user) {
            return res.status(401).json({
                message: 'Email does not exist!'
            });
        }
        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 3600000;
        const result = user.save();
        const message = await transporter.sendMail({
            to: user.email,
            from: 'admin@esnbiometrics.com',
            subject: 'Energy Smart Biometrics | Reset Password',
            html: `
                               <p>Reset password request</p>
                               <p>Dear ${user.name}</p>
                               <p>Click this <a href='https://esnbiometrics.com/exco/agent/reset/${token}'>link</a> to reset your password</p>
                            `
        });
        res.status(200).json({
            message: 'Kindly check your mail for further directives.  Thank you.'
        })

    } catch (err) {
        res.status(500).json({
            message: "Sorry, we couldn't complete your request. Please try again in a moment."
        })
    }

}
exports.getExcoAgentNewpassword = async (req, res, next) => {
    try {
        const token = req.params.token;
        const user = await Agent.findOne({
            resetToken: token,
            resetTokenExpiration: {
                $gt: Date.now()
            }
        })
        if (!user) {
            return res.status(401).json({
                message: 'Invalid/Expired Token!'
            });
        }
        res.status(200).json({
            resetToken: token,
            agentId: user._id
        });
    } catch (err) {
        res.status(500).json({
            message: "Sorry, we couldn't complete your request. Please try again in a moment."
        })
    }

}
exports.postExcoAgentNewPassword = async (req, res, next) => {
    try {
        const token = req.body.token;
        const newPassword = req.body.password;
        const agentId = req.body.agentId;
        let authorizedUser;
        const user = await Agent.findOne({
            _id: agentId,
            resetToken: token,
            resetTokenExpiration: {
                $gt: Date.now()
            }
        })
        if (!user) {
            return res.status(401).json({
                message: 'Invalid Agent! Try again!'
            })
        }
        authorizedUser = user;
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        user.password = hashedPassword;
        user.resetToken = undefined;
        user.resetTokenExpiration = undefined;
        const result = await user.save();
        const message = await transporter.sendMail({
            to: user.email,
            from: 'admin@esnbiometrics.com',
            subject: 'Energy Smart Biometrics | Password reset successful',
            html: '<p>You have successfully changed your password!</p>'
        });
        res.status(200).json({
            message: 'Password reset successful'
        })

    } catch (err) {
        res.status(500).json({
            message: "Sorry, we couldn't complete your request. Please try again in a moment."
        })
    }

}

/*
  Admin Authentication Begins
*/
exports.postAdminLogin = async (req, res, next) => {
    try {
        const email = req.body.email;
        const password = req.body.password;
        const user = await Admin.findOne({
            email: email
        });
        if (!user) {
            return res.status(401).json({
                message: 'Access Denied!'
            })
        }
        const doMatch = await bcrypt.compare(password, user.password);
        if (!doMatch) {
            return res.status(401).json({
                message: "Access Declined!"
            });
        }
        const token = jwt.sign({
            adminId: user._id
        }, process.env.JWT_KEY_ADMIN, {
            expiresIn: '8760h'
        });
        res.status(200).json({
            token: token,
            expiresIn: "31536000"
        });
    } catch (err) {
        res.status(500).json({
            message: "Sorry, we couldn't complete your request. Please try again in a moment."
        });
    }

}
exports.postAdminReset = async (req, res, next) => {
    try {
        const email = req.body.email;
        let token
        const cypt = await crypto.randomBytes(32, (err, Buffer) => {
            if (err) {
                return res.status(401).json({
                    message: 'An unknown error occured'
                })
            }
            token = Buffer.toString('hex');
        });
        const user = await Admin.findOne({
            email: email
        });
        if (!user) {
            return res.status(401).json({
                message: 'Email does not exist!'
            });
        }
        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 3600000;
        const result = user.save();
        res.status(200).json({
            message: 'Kindly check your mail for further directives.  Thank you.'
        })
        // return transporter.sendMail({
        //   to: email,
        //   from: 'ecard@gmail.com',
        //   subject: 'Reset Password',
        //   html: `
        //      <p>Reset password request</p>
        //      <p>Click this <a href='https://esnbiometrics.com/reset/${token}'>link</a> to reset your password</p>
        //   `
        // });

    } catch (err) {
        res.status(500).json({
            message: "Sorry, we couldn't complete your request. Please try again in a moment."
        })
    }

}
exports.getAdminNewpassword = async (req, res, next) => {
    try {
        const token = req.params.token;
        const user = await Admin.findOne({
            resetToken: token,
            resetTokenExpiration: {
                $gt: Date.now()
            }
        });
        if (!user) {
            return res.status(401).json({
                message: 'Invalid/Expired Token!'
            });
        }
        res.status(200).json({
            resetToken: token,
            adminId: user._id
        });

    } catch {
        res.status(500).json({
            message: "Sorry, we couldn't complete your request. Please try again in a moment."
        })
    }
}
exports.postAdminNewPassword = async (req, res, next) => {
    try {
        const token = req.body.resetToken;
        const newPassword = req.body.password;
        const adminId = req.body.adminId;
        let authorizedUser;
        const user = await Agent.findOne({
            _id: adminId,
            resetToken: token,
            resetTokenExpiration: {
                $gt: Date.now()
            }
        });
        if (!user) {
            return res.status(401).json({
                message: 'Invalid Agent! Try again!'
            })
        }
        authorizedUser = user;
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        user.password = hashedPassword;
        user.resetToken = undefined;
        user.resetTokenExpiration = undefined;
        const result = user.save();
        res.status(200).json({
            message: 'Password reset successful'
        });
        // return transporter.sendMail({
        //     to: user.email,
        //     from: 'shop@penzaar.com',
        //     subject: 'Password reset successful',
        //     html: '<p>You have successfully changed your password. Keep shopping!</p>'
        // });
    } catch {
        res.status(500).json({
            message: "Sorry, we couldn't complete your request. Please try again in a moment."
        })
    }

}
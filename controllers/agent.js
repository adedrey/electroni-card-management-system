const User = require('../models/users'); // Fetch the Users Database Model
const bcrypt = require("bcryptjs") // To encrypt password
const crypto = require("crypto");
const { cloudinary } = require('../config/cloudinary');
const Agent = require("../models/agent");
const fs = require('fs');
// Add a new User
exports.postUpdateUser = async (req, res, next) => {
    const fingerId = req.params.fingerId
    const firstname = req.body.firstname;
    const middlename = req.body.middlename;
    const surname = req.body.surname;
    const email = req.body.email;
    const gender = req.body.gender;
    const dob = req.body.dob;
    const address = req.body.address;
    const branch = req.body.branch;
    const next_of_kin_name = req.body.next_of_kin_name;
    const next_of_kin_address = req.body.next_of_kin_address;
    const next_of_kin_phone_no = req.body.next_of_kin_phone_no;
    const vehicleNumber = req.body.vehicleNumber;
    const transportation_type = req.body.transportation_type;
    const verifiedIdType = req.body.verifiedIdType;
    const verifiedId = req.body.verifiedId;
    const signature = req.body.signature;
    const zone = req.body.zone;
    const unit = req.body.unit;
    const phone_no = req.body.phone_no;
    const state = req.body.state;
    const uniqueId = req.body.uniqueId;
    const password = "12345678";
    const image = req.body.image;
    try {
        const hashedPassword = await bcrypt.hash(password, 12);
        const user = await User.findOne({
            fingerId: {$regex: new RegExp(fingerId, "i")}
        })
        if (!user) {
            return res.status(401).json({
                message: "Invalid Finger Identity."
            })
        }
        if (image) {
            const uploadResponse = await cloudinary.uploader.upload(image, {
                upload_preset: 'esn_users'
            });
            user.image = uploadResponse.url;
            user.imageId = uploadResponse.public_id;
        }
        user.firstname = firstname;
        user.middlename = middlename;
        user.surname = surname;
        user.email = email;
        user.gender = gender;
        user.dob = dob;
        user.address = address;
        user.branch = branch;
        user.next_of_kin_name = next_of_kin_name;
        user.next_of_kin_address = next_of_kin_address;
        user.next_of_kin_phone_no = next_of_kin_phone_no;
        user.vehicleNumber = vehicleNumber;
        user.transportation_type = transportation_type;
        user.verifiedIdType = verifiedIdType;
        user.verifiedId = verifiedId;
        user.zone = zone;
        user.unit = unit;
        user.phone_no = phone_no;
        user.state = state;
        user.uniqueId = uniqueId;
        user.password = hashedPassword;
        user.imageBlob = image;
        user.agentId = user.agentId ? user.agentId : req.user._id;
        const result = await user.save();
        res.status(200).json({
            message: 'User account has been generated and awaiting approval.',
            user: result
        });

    } catch (err) {
        res.status(500).json({
            message: "Sorry, we couldn't complete your request. Please try again in a moment."
        })
    }

}

// Get all users

exports.getUsers = async (req, res, next) => {
    try {
        const userQuery = User.find({
            agentId: req.user._id
        }, {imageId: 0, finger1: 0, finger2: 0, imageBlob: 0}).sort({
            _id: -1
        })
        const postSizeOptions = +req.query.postSizeOptions;
        const currentPage = +req.query.currentPage;
        if (postSizeOptions && currentPage) {
            userQuery.skip((currentPage - 1) * postSizeOptions)
                .limit(postSizeOptions);
        }
        const users = await userQuery;
        const totalUsers = await User.countDocuments({agentId: req.user._id});
        res.status(200).json({
            users: users,
            totalUsers: totalUsers
        })
    } catch (err) {
        console.log(err)
        res.status(500).json({
            message: "Sorry, we couldn't complete your request. Please try again in a moment."
        })
    }
}

exports.getProfile = async (req, res, next) => {
    try {
        const user = await Agent.findOne({
            _id: req.user._id
        });
        if (!user) {
            return res.status(401).json({
                message: "User not authenticated! Please login..."
            });
        }
        res.status(200).json({
            agent: user
        });
    } catch (err) {
        res.status(500).json({
            message: "Sorry, we couldn't complete your request. Please try again in a moment."
        })
    }

}

exports.getAgentsByExco = async (req, res, next) => {
    try {
        const agents = await Agent.find().sort({
            _id: -1
        })
        const totalAgents = await Agent.countDocuments();
        const totalUsers = await User.countDocuments({branch: req.userExco.branch});
        res.status(200).json({
            agents: agents,
            totalUsers: totalUsers,
            totalAgents: totalAgents
        })
    } catch (err) {
        res.status(500).json({
            message: "Sorry, we couldn't complete your request. Please try again in a moment."
        })
    }

}

exports.getAgentRegisteredAccounts = async (req, res, next) => {
    try {
        const agentId = req.params.agentId;
        const userQuery = User.find({agentId: agentId}, {
            imageId: 0,
            finger1: 0,
            finger2: 0,
            imageBlob: 0
        }).sort({
            _id: -1
        });
    
        const postSizeOptions = +req.query.postSizeOptions;
        const currentPage = +req.query.currentPage;
        if (postSizeOptions && currentPage) {
            userQuery.skip((currentPage - 1) * postSizeOptions)
                .limit(postSizeOptions);
        }
        const users = await userQuery;
        const totalUsers = await User.countDocuments({
            agentId: agentId
        });
        res.status(200).json({
            users: users,
            totalUsers: totalUsers,
        })
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: "Sorry, we couldn't complete your request. Please try again in a moment."
        })
    }

}

exports.postProfile = async (req, res, next) => {
    try {
        const name = req.body.name;
        const password = req.body.password;
        const newpassword = req.body.newpassword;
        const user = await Agent.findOne({
            _id: req.user._id
        });
        if (!user) {
            return res.status(401).json({
                message: "Authentication failed. Please login again."
            })
        }
        if (password !== null) {
            const doMatch = await bcrypt.compare(password, user.password);
            if (!doMatch) {
                return res.status(401).json({
                    message: "Password does not match!"
                })
            }
            const hashPassword = await bcrypt.hash(newpassword, 12);
            user.name = name;
            user.password = hashPassword;
            const result = await user.save();
            res.status(200).json({
                message: "Profile has been updated!",
                agent: result
            });
        } else {
            user.name = name;
            const result = await user.save();
            res.status(200).json({
                message: "Password has been changed!",
                agent: result
            });
        }
    } catch (err) {
        res.status(500).json({
            message: "Sorry, we couldn't complete your request. Please try again in a moment."
        })
    }
}

exports.postChangePassword = async (req, res, next) => {
    try {
        const password = req.body.password;
        const newpassword = req.body.newpassword;
        const user = await Agent.findOne({
            _id: req.user._id
        });
        if (!user) {
            return res.status(401).json({
                message: "Authentication failed"
            })
        }
        if (password !== null) {
            const doMatch = await bcrypt.compare(password, user.password);
            if (!doMatch) {
                return res.status(401).json({
                    message: "Password does not match!"
                })
            }
            const hashPassword = await bcrypt.hash(newpassword, 12);
            user.password = hashPassword;
            const result = await user.save();
            res.status(200).json({
                message: "Password Changed Successfully!"
            })
        }
    } catch (err) {
        res.status(500).json({
            message: "Sorry, we couldn't complete your request. Please try again in a moment."
        })
    }

}

exports.getUserCount = async (req, res, next) => {
    try {
        const userCount = await User.find({
            approved: true
        }).countDocuments();
        res.status(200).json({
            userCount: userCount
        });
    } catch (err) {
        res.status(500).json({
            message: "Sorry, we couldn't complete your request. Please try again in a moment."
        })
    }
}

exports.getUserByFingerId = async (req, res, next) => {
    try {
        const userFingerId = req.params.userFingerId;
        const user = await User.findOne({
            fingerId: {$regex: new RegExp(userFingerId, "i")}
        });
        if (!user) {
            return res.status(401).json({
                message: "Unable to find user. Try again!"
            });
        }
        res.status(200).json({
            user: user
        })
    } catch (err) {
        res.status(500).json({
            message: "Sorry, we couldn't complete your request. Please try again in a moment."
        })
    }
}


// Exco

exports.getExcoProfile = async (req, res, next) => {
    try {
        const user = await Agent.findOne({
            _id: req.userExco._id
        });
        if (!user) {
            return res.status(401).json({
                message: "User not authenticated! Please login..."
            });
        }
        res.status(200).json({
            agent: user
        });
    } catch (err) {
        res.status(500).json({
            message: "Sorry, we couldn't complete your request. Please try again in a moment."
        })
    }

}

exports.postExcoProfile = async (req, res, next) => {
    try {
        const name = req.body.name;
        const password = req.body.password;
        const newpassword = req.body.newpassword;
        const user = await Agent.findOne({
            _id: req.userExco._id
        });
        if (!user) {
            return res.status(401).json({
                message: "Authentication failed. Please login again."
            })
        }
        if (password !== null) {
            const doMatch = await bcrypt.compare(password, user.password);
            if (!doMatch) {
                return res.status(401).json({
                    message: "Password does not match!"
                })
            }
            const hashPassword = await bcrypt.hash(newpassword, 12);
            user.name = name;
            user.password = hashPassword;
            const result = await user.save();
            res.status(200).json({
                message: "Profile has been updated!",
                agent: result
            });
        } else {
            user.name = name;
            const result = await user.save();
            res.status(200).json({
                message: "Password has been changed!",
                agent: result
            });
        }
    } catch (err) {
        res.status(500).json({
            message: "Sorry, we couldn't complete your request. Please try again in a moment."
        })
    }
}

exports.getExcoUsersByBranch = async (req, res, next) => {

    try {
        const userQuery = User.find({
            branch: req.userExco.branch
        }, {imageId: 0, finger1: 0, finger2: 0, imageBlob: 0}).sort({
            _id: -1
        })
        const postSizeOptions = +req.query.postSizeOptions;
        const currentPage = +req.query.currentPage;
        if (postSizeOptions && currentPage) {
            userQuery.skip((currentPage - 1) * postSizeOptions)
                .limit(postSizeOptions);
        }
        const users = await userQuery;
        const totalUsers = await User.countDocuments({branch: req.userExco.branch});
        res.status(200).json({
            users: users,
            totalUsers: totalUsers
        })
    } catch (err) {
        res.status(500).json({
            message: "Sorry, we couldn't complete your request. Please try again in a moment."
        })
    }
}

exports.getAgentRegisteredAccounts = async (req, res, next) => {
    try {
        const agentId = req.params.agentId;
        const userQuery = User.find({agentId: agentId}, {
            imageId: 0,
            finger1: 0,
            finger2: 0,
            imageBlob: 0
        }).sort({
            _id: -1
        });
    
        const postSizeOptions = +req.query.postSizeOptions;
        const currentPage = +req.query.currentPage;
        if (postSizeOptions && currentPage) {
            userQuery.skip((currentPage - 1) * postSizeOptions)
                .limit(postSizeOptions);
        }
        const users = await userQuery;
        const totalUsers = await User.countDocuments({
            agentId: agentId
        });
        res.status(200).json({
            users: users,
            totalUsers: totalUsers,
        })
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: "Sorry, we couldn't complete your request. Please try again in a moment."
        })
    }

}

exports.getUserByUniqueId = async (req, res, next) => {
    const uniqueId = req.body.uniqueId;
    try {
        const user = await User.findOne({uniqueId: {$regex: new RegExp(uniqueId, "i")}})
        if (!user) {
            return res.status(401).json({
                message: "Opps! Unable to fetch user."
            })
        }
        res.status(200).json({
            user: user
        });
    } catch (err) {
        res.status(500).json({
            message: "Sorry, we couldn't complete your request. Please try again in a moment."
        })
    }

}
const Agent = require("../models/agent"); // Fetch the Agent Database Model
const bcrypt = require("bcryptjs") // To encrypt password
const User = require('../models/users');
const Admin = require('../models/admin');
const nodemailer = require('nodemailer');
const crypto = require("crypto");
const {
    cloudinary
} = require('../config/cloudinary');
const fs = require('fs');
const sendgridTransport = require('nodemailer-sendgrid-transport');
const transporter = nodemailer.createTransport(sendgridTransport({
    auth: {
        api_key: process.env.SENDGRID_APIKEY
    }
}));
const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken)
// Add a new User
exports.postAddAgent = async (req, res, next) => {
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;
    const branch = req.body.branch ? req.body.branch : null;
    const image = req.body.image;
    try {
        const user = await Agent.findOne({
            email: email
        });
        if (user) {
            return res.status(401).json({
                message: "Email already exist!"
            });
        }
        console.log(password);
        const hashedPassword = await bcrypt.hash(password, 12);
        const uploadResponse = await cloudinary.uploader.upload(image, {
            upload_preset: 'esn_agents',
            transformation: [{
                width: 500,
                height: 500,
                gravity: "face",
                crop: "thumb"
            }],
        });
        const newUser = new Agent({
            name: name,
            email: email,
            branch: branch,
            image: uploadResponse.url,
            imageId: uploadResponse.public_id,
            imageBlob: image,
            password: hashedPassword
        })
        const result = await newUser.save();
        res.status(200).json({
            message: "Agent account has been created successfully!",
            agent: result
        })
    } catch (err) {
        console.log(err)
        res.status(500).json({
            message: "Sorry, we couldn't complete your request. Please try again in a moment."
        })
    }

}

exports.getAgentUsers = async (req, res, next) => {
    let userQuery;
    let totalUsers;
    const startDate = req.body.startDate;
    const endDate = req.body.endDate;
    const branch = req.body.branch;
    try {
        if ((startDate != null || endDate != null) && branch == null) {
            userQuery = User.find({
                updatedAt: {
                    $gte: new Date(new Date(startDate).setHours(00, 00, 00)),
                    $lt: new Date(new Date(endDate).setHours(23, 59, 59))
                }
            }, {
                imageId: 0,
                finger1: 0,
                finger2: 0,
                imageBlob: 0
            }).sort({
                _id: -1
            });
        } else if (branch != null & (startDate == null && endDate == null)) {
            userQuery = User.find({
                branch: branch
            }, {
                imageId: 0,
                finger1: 0,
                finger2: 0,
                imageBlob: 0
            }).sort({
                _id: -1
            });
        } else {
            userQuery = User.find({}, {
                imageId: 0,
                finger1: 0,
                finger2: 0,
                imageBlob: 0
            }).sort({
                _id: -1
            });
        }

        const postSizeOptions = +req.query.postSizeOptions;
        const currentPage = +req.query.currentPage;
        if (postSizeOptions && currentPage) {
            userQuery.skip((currentPage - 1) * postSizeOptions)
                .limit(postSizeOptions);
        }
        const users = await userQuery;
        if ((startDate != null || endDate != null) && branch == null) {
            totalUsers = await User.countDocuments({
                updatedAt: {
                    $gte: new Date(new Date(startDate).setHours(00, 00, 00)),
                    $lt: new Date(new Date(endDate).setHours(23, 59, 59))
                }
            });
        } else if (branch != null & (startDate == null && endDate == null)) {
            totalUsers = await User.countDocuments({
                branch: branch
            });
        } else {
            totalUsers = await User.countDocuments();
        }

        const totalAgents = await Agent.countDocuments();
        res.status(200).json({
            users: users,
            totalUsers: totalUsers,
            totalAgents: totalAgents
        })
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: "Sorry, we couldn't complete your request. Please try again in a moment."
        })
    }

}

exports.getAgents = async (req, res, next) => {
    try {
        const agents = await Agent.find().sort({
            _id: -1
        })
        res.status(200).json({
            agents: agents
        })
    } catch (err) {
        res.status(500).json({
            message: "Sorry, we couldn't complete your request. Please try again in a moment."
        })
    }

}

exports.postUserApproval = async (req, res, next) => {
    try {
        const userId = req.params.userId;
        const user = await User.findOne({
            _id: userId
        }).populate('agentId');
        if (!user) {
            return res.status(401).json({
                message: "An error occured"
            })
        }
        user.approved = !user.approved;
        const result = await user.save()
        if (result.approved) {
            const sendMail = await transporter.sendMail({
                to: user.email,
                from: 'admin@esnbiometrics.com',
                subject: 'Energy Smart Biometrics | Congratulations',
                html: `
                       <p>Congratulations ${user.surname},</p>
                       <br>
                       <p>Your registration was successful. Your UniqueId is ${user.uniqueId}.</p>
                    `
            })
            const sendSms = client.messages.create({
                body: 'Congratulations ' + result.surname + ', your registration was successful. Your UniqueId is ' + result.uniqueId + ".",
                from: '+12516511159',
                to: '+234' + result.phone_no
            });
        }
        res.status(200).json({
            user: result
        });
    } catch (err) {
        res.status(500).json({
            message: "Sorry, we couldn't complete your request. Please try again in a moment."
        })
    }

}

exports.postProfile = async (req, res, next) => {
    try {
        const password = req.body.password;
        const newpassword = req.body.newpassword;
        if (password === newpassword) {
            return res.status(401).json({
                message: "Password does not match!"
            });
        }

        const user = await Admin.findOne({
            _id: req.admin._id
        })
        if (!user) {
            return res.status(401).json({
                message: "Authentication failed"
            })
        }
        const doMatch = await bcrypt.compare(password, user.password);
        if (!doMatch) {
            return res.status(401).json({
                message: "Password does not match!"
            })
        }
        const hashPassword = await bcrypt.hash(newpassword, 12);
        user.password = hashPassword;
        const result = await user.save()
        res.status(200).json({
            message: "Changed has been updated!"
        })
    } catch (err) {
        res.status(500).json({
            message: "Sorry, we couldn't complete your request. Please try again in a moment."
        });
    }

}

exports.getUserAgentCount = async (req, res, next) => {
    try {
        const userCount = await User.find({
            approved: true
        }).countDocuments();
        const agentCount = await Agent.find().countDocuments();
        res.status(200).json({
            userCount: userCount,
            agentCount: agentCount
        })
    } catch (err) {
        res.status(500).json({
            message: "Sorry, we couldn't complete your request. Please try again in a moment."
        })
    }

}

exports.postAgentStatus = async (req, res, next) => {
    try {
        const agentId = req.body.agentId;
        const user = await Agent.findOne({
            _id: agentId
        })
        if (!user) {
            return res.status(401).json({
                message: "An error occured"
            })
        }
        user.is_active = !user.is_active;
        const result = await user.save();
        res.status(200).json({
            agent: result
        });

    } catch (err) {
        res.status(500).json({
            message: "Sorry, we couldn't complete your request. Please try again in a moment."
        })
    }

}

exports.deleteAgent = async (req, res, next) => {
    try {
        const agentId = req.params.agentId;
        const result = await Agent.findOneAndDelete({
            _id: agentId
        });
        if (!result) {
            return res.status(401).json({
                message: 'An error occured!'
            })

        }
        res.status(200).json({
            message: 'Deleted successfully'
        });
    } catch (err) {
        res.status(500).json({
            message: "Sorry, we couldn't complete your request. Please try again in a moment."
        })
    }
}

exports.deleteUser = async (req, res, next) => {
    try {
        const userId = req.params.userId;
        const result = await User.findOneAndDelete({
            _id: userId
        });
        if (!result) {
            return res.status(401).json({
                message: 'An error occured!'
            })

        }
        res.status(200).json({
            message: 'Deleted successfully'
        });
    } catch (err) {
        res.status(500).json({
            message: "Sorry, we couldn't complete your request. Please try again in a moment."
        })
    }
}

exports.getUsersByAgentId = async (req, res, next) => {
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

exports.postEditUserDetails = async (req, res, next) => {
    const userId = req.params.userId;
    const firstname = req.body.firstname;
    const middlename = req.body.middlename;
    const surname = req.body.surname;
    const email = req.body.email;
    const gender = req.body.gender;
    const dob = req.body.dob;
    const address = req.body.address;
    const next_of_kin_name = req.body.next_of_kin_name;
    const next_of_kin_address = req.body.next_of_kin_address;
    const next_of_kin_phone_no = req.body.next_of_kin_phone_no;
    const vehicleNumber = req.body.vehicleNumber;
    const transportation_type = req.body.transportation_type;
    const verifiedIdType = req.body.verifiedIdType;
    const verifiedId = req.body.verifiedId;
    const zone = req.body.zone;
    const phone_no = req.body.phone_no;
    var proto = req.connection.encrypted ? 'https' : 'http';
    const url = proto + '://' + req.get("host");
    const name = firstname.toLowerCase() + "-" + middlename.toLowerCase();
    const ext = "jpeg";
    const imageName = name + '-' + Date.now() + '.' + ext;
    const image = req.body.image;
    try {
        const user = await User.findById(userId)
        if (!user) {
            return res.status(401).json({
                message: "Unable to fetch user. Try again!"
            })
        }

        if (user.email !== email) {
            const checkEmail = await User.findOne({
                email: email
            });
            if (checkEmail) {
                return res.status(401).json({
                    message: "Email already exist! Kindly use another email"
                })
            }
        }
        if (image && image !== '') {
            var base64Data = image.replace(/^data:image\/jpeg;base64,/, "");
            const imageUpload = await fs.writeFile("images/" + imageName, base64Data, 'base64', function (err) {
                if (err) {
                    res.status(401).json({
                        message: 'Error occured while uploading the image!'
                    })
                }
            });
        }
        user.firstname = firstname;
        user.middlename = middlename;
        user.surname = surname;
        user.email = email;
        user.gender = gender;
        user.dob = dob;
        user.address = address;
        user.next_of_kin_name = next_of_kin_name;
        user.next_of_kin_address = next_of_kin_address;
        user.next_of_kin_phone_no = next_of_kin_phone_no;
        user.vehicleNumber = vehicleNumber;
        user.transportation_type = transportation_type;
        user.verifiedIdType = verifiedIdType;
        user.verifiedId = verifiedId;
        user.zone = zone;
        user.phone_no = phone_no;
        if (image && image !== '') {
            user.image = url + '/images/' + imageName;
        }
        const result = await user.save();
        res.status(200).json({
            message: 'User account has been generated and awaiting approval.',
            user: result
        });
    } catch (err) {
        console.log(err);
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

exports.getUsersByUnit = async (req, res, next) => {
    try {
        const unit = req.body.unit;
        const users = await User.find({
            unit: unit
        });
        res.status(200).json({
            users: users
        });

    } catch (err) {
        res.status(500).json({
            message: "Sorry, we couldn't complete your request. Please try again in a moment."
        })
    }
}

exports.getUserById = async (req, res, next) => {
    try {
        const id = req.params.id;
        const user = await User.findById(id)
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

exports.postStartUserReg = async (req, res, next) => {
    try {
        const fingerId = req.body.fingerId;
        const finger1 = req.body.finger1;
        const finger2 = req.body.finger2;
        const firstname = req.body.firstname;
        const middlename = req.body.middlename;
        const surname = req.body.surname;
        console.log(fingerId, finger1, finger2, firstname, middlename, surname);
        const user = new User({
            firstname: firstname,
            middlename: middlename,
            surname: surname,
            fingerId: fingerId,
            finger1: finger1,
            finger2: finger2
        });
        const result = await user.save();
        console.log('New user', result);
        res.status(200).json({
            message: 'Success!'
        })

    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: "Sorry, we couldn't complete your request. Please try again in a moment."
        })
    }
}

exports.getUsersData = async (req, res, next) => {

    try {
        const users = await User.find({}, {
            _id: 1,
            finger1: 1,
            finger2: 1
        }).limit(100);
        const extracted_data = users.map(response => {
            return {
                _id: response._id,
                finger1: response.finger1,
                finger2: response.finger2
            }
        });
        res.status(200).json({
            users: extracted_data
        })
    } catch (err) {
        // console.log(err);
        res.status(500).json({
            message: "Sorry, we couldn't complete your request. Please try again in a moment."
        });
    }
}

exports.getUsersByFingerPrint = async (req, res, next) => {
    const fingerprint = req.body.fingerprint;
    try {
        const users = await User.find({
            $text: {
                $search: `\"${fingerprint}\"`
            }
        }, {
            _id: 1,
            finger1: 1,
            finger2: 1
        })
        const extracted_data = users.map(response => {
            return {
                _id: response._id,
                finger1: response.finger1,
                finger2: response.finger2
            }
        });
        console.log(extracted_data);
        res.status(200).json({
            users: extracted_data
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
        const user = await User.findOne({
            uniqueId: {
                $regex: new RegExp(uniqueId, "i")
            }
        })
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

exports.getUsersCount = async (req, res, next) => {
    try {
        const users = await User.find({}, {
            branch: 1
        });
        res.status(200).json({
            users: users
        })
    } catch (err) {
        console.log(err)
        res.status(500).json({
            message: "Sorry, we couldn't complete your request. Please try again in a moment."
        })
    }

}
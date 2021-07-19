const User = require("../models/users");
const bcrypt = require("bcryptjs");
exports.getProfile = async (req, res, next) => {
    try {
        const user = await User.findOne({
            _id: req.enduser._id
        })
        if (!user) {
            return res.status(401).json({
                message: "User not authenticated! Please login..."
            });
        }
        res.status(200).json({
            user: user
        });
    } catch {
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
        const user = await User.findOne({
            _id: req.enduser._id
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
            message: "Changed successfully"
        });
    } catch (err) {
        res.status(500).json({
            message: "Sorry, we couldn't complete your request. Please try again in a moment."
        })
    }

}
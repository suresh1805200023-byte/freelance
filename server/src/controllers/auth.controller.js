const { User, LoginLog } = require('../models');
const { CustomException } = require('../utils');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const satelize = require('satelize');
const { JWT_SECRET, NODE_ENV } = process.env;
const saltRounds = 10;
const ADMIN_EMAIL = 'admin@gmail.com';
const ADMIN_USERNAME = 'admin123';
const ADMIN_PASSWORD = '123456';
const isProduction = process.env.NODE_ENV === "production";

const getCookieOptions = () => ({
    httpOnly: true,
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction,
    maxAge: 7 * 24 * 60 * 60 * 1000,
});

const authRegister = async (request, response) => {
    const { username, email, phone, password, image, isSeller, description, country, languagesKnown, motherLanguage } = request.body;
    // Removed IP and satelize logic as country field is removed

    try {
        const hash = bcrypt.hashSync(password, saltRounds);
        
        const user = new User({
            username,
            email,
            password: hash,
            image,
            description,
            isSeller,
            phone,
            country,
            languagesKnown: Array.isArray(languagesKnown) ? languagesKnown : (languagesKnown ? languagesKnown.split(', ') : []),
            motherLanguage
        });
        await user.save();

        // 🔐 Create and send JWT in cookie after successful registration
        const token = jwt.sign({ _id: user._id, isSeller: user.isSeller, isAdmin: user.isAdmin }, process.env.JWT_SECRET, { expiresIn: "7d" });

        return response
            .cookie("accessToken", token, getCookieOptions())
            .status(201)
            .send({
                error: false,
                message: 'New user created!',
                token,
                user: user // Optionally send back user info, but don't include password
            });

    }
    catch(error) {
        console.error('Error during registration:', error);
        const {message} = error;

        if(message && message.includes('E11000')) {
            return response.status(400).send({
                error: true,
                message: 'Choose a unique username!'
            });
        }

        return response.status(500).send({
            error: true,
            message: 'Something went wrong!'
        });
    }
}

const authLogin = async (req, res) => {
  const { username, email, password } = req.body;
  const loginIdentifier = (username || email || '').trim();
  const normalizedIdentifier = loginIdentifier.toLowerCase();

  try {
    if (!loginIdentifier) {
      return res.status(400).json({ error: true, message: "Username or email is required!" });
    }

    let user = await User.findOne({
      $or: [
        { username: loginIdentifier },
        { email: normalizedIdentifier },
      ],
    });

    // Self-heal admin account if DB was wiped and admin tries to log in.
    if (
      !user &&
      password === ADMIN_PASSWORD &&
      (normalizedIdentifier === ADMIN_USERNAME || normalizedIdentifier === ADMIN_EMAIL)
    ) {
      const adminPasswordHash = bcrypt.hashSync(ADMIN_PASSWORD, saltRounds);
      user = await User.create({
        username: ADMIN_USERNAME,
        email: ADMIN_EMAIL,
        password: adminPasswordHash,
        phone: '0000000000',
        description: 'System administrator account',
        isSeller: false,
        isAdmin: true,
        isActive: true,
        country: 'India',
      });
    }

    if (!user) return res.status(404).json({ error: true, message: "User not found!" });

    // Exclude admin lockout
    if (!user.isAdmin) {
      // Check lockout
      if (user.lockUntil && user.lockUntil > Date.now()) {
        const minutes = Math.ceil((user.lockUntil - Date.now()) / 60000);
        return res.status(403).json({ error: true, message: `Account locked due to too many failed logins. Try again in ${minutes} minute(s).` });
      }
    }

    if (!user.isActive) return res.status(403).json({ error: true, message: "Your account has been deactivated. Please contact support." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // Exclude admin lockout
      if (!user.isAdmin) {
        user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
        if (user.failedLoginAttempts >= 5) {
          user.lockUntil = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
          await user.save();
          return res.status(403).json({ error: true, message: "Too many failed login attempts. Account locked for 10 minutes." });
        } else {
          await user.save();
        }
      }
      return res.status(401).json({ error: true, message: "Invalid password!" });
    }

    // Reset failed attempts on success (exclude admin)
    if (!user.isAdmin) {
      user.failedLoginAttempts = 0;
      user.lockUntil = null;
      await user.save();
    }

    // Record login event
    const loginLog = new LoginLog({
      userID: user._id,
    });
    await loginLog.save();

    // 🔐 Create and send JWT in cookie
    const token = jwt.sign({ _id: user._id, isSeller: user.isSeller, isAdmin: user.isAdmin }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res
      .cookie("accessToken", token, getCookieOptions())
      .status(200)
      .json({
        error: false,
        token,
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          image: user.image,
          phone: user.phone,
          description: user.description,
          isSeller: user.isSeller,
          isAdmin: user.isAdmin,
        }
      });
  } catch (err) {
    res.status(500).json({ error: true, message: "Login failed", err });
  }
};

const authLogout = async (request, response) => {
    return response.clearCookie('accessToken', {
        httpOnly: true,
        sameSite: isProduction ? 'none' : 'lax',
        secure: isProduction
    })
    .send({
        error: false,
        message: 'User have been logged out!'
    });
}

const authStatus = async (request, response) => {
    console.log("Auth status check for userID:", request.userID); // Log the user ID from the request
    try {
        const user = await User.findOne({ _id: request.userID }).select('-password');

        if(!user) {
            console.log("User not found for auth status check."); // Log if user not found
            throw CustomException('User not found!', 404);
        }

        console.log("User found for auth status check:", user.username); // Log the found username
        return response.send({
            error: false,
            message: 'Success!',
            user
        })
    }
    catch({message, status = 500}) {
        return response.status(status).send({
            error: true,
            message
        })
    }
}

module.exports = {
    authLogin,
    authLogout,
    authRegister,
    authStatus
}
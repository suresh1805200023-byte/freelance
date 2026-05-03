const jwt = require('jsonwebtoken');
const { CustomException } = require('../utils');
const { authLogout } = require('../controllers/auth.controller');

const userMiddleware = (request, response, next) => {
    const token = request.cookies.accessToken;
    console.log('userMiddleware - received token:', token ? 'Yes' : 'No');
    
    try {
        if(!token) {
            throw CustomException('Unauthorized access!', 401);
        }
        
        const verification = jwt.verify(token, process.env.JWT_SECRET);
        console.log('userMiddleware - JWT verification result:', verification);
        if(verification) {
            console.log('Verification ID from token:', verification._id);
            request.userID = verification._id;
            request.isSeller = verification.isSeller;
            request.isAdmin = verification.isAdmin;
            console.log('userMiddleware - setting request.userID to:', request.userID);
            console.log('userMiddleware - setting request.isAdmin to:', request.isAdmin);
            
            return next();
        }
        
        authLogout(request, response);
        throw CustomException('Token invalid or expired. Please log in again.', 401);
    }
    catch(error) {
        console.error('Authentication Middleware Error:', error);
        const message = error.message || 'Authentication failed.';
        const status = error.status || 401;

        return response.status(status).send({
            error: true,
            message
        })
    }
}

module.exports = userMiddleware;
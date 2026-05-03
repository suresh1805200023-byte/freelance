const jwt = require('jsonwebtoken');
const { CustomException } = require('../utils');

const adminMiddleware = async (request, response, next) => {
    const token = request.cookies.accessToken; 
    console.log('adminMiddleware - received token:', token ? 'Yes' : 'No');
    console.log('adminMiddleware - request.isAdmin (before check):', request.isAdmin);

    try {
        if (!token) {
            throw CustomException('Unauthorized access! Admin privileges required.', 401);
        }

        const verification = jwt.verify(token, process.env.JWT_SECRET);
        if (!verification || !verification._id || !verification.isAdmin) {
            console.log('adminMiddleware - Access denied: Token invalid or isAdmin is false.', verification);
            throw CustomException('Access denied. Admin privileges required.', 403); // 403 Forbidden
        }

        // If admin, proceed to the next middleware or route handler
        request.userID = verification._id; // Attach user ID to request
        request.isSeller = verification.isSeller; // Attach isSeller from token
        request.isAdmin = verification.isAdmin; // Attach isAdmin from token
        next();

    } catch (error) {
        console.error('Admin Middleware Error:', error);
        const message = error.message || 'Authentication failed.';
        const status = error.status || 401;

        // Clear cookie and redirect to login if authentication fails (optional but good practice)
        if (status === 401) {
             response.clearCookie('accessToken');
        }

        return response.status(status).send({
            error: true,
            message
        });
    }
};

module.exports = adminMiddleware; 
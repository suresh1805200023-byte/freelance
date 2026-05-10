const jwt = require('jsonwebtoken');
const { CustomException } = require('../utils');
const { authLogout } = require('../controllers/auth.controller');

const userMiddleware = (request, response, next) => {
    const authHeader = request.headers.authorization || '';

    const bearerToken = authHeader.startsWith('Bearer ')
        ? authHeader.slice(7).trim()
        : '';

    const token =
        request.cookies.accessToken || bearerToken;

    console.log(
        'userMiddleware - received token:',
        token ? 'Yes' : 'No'
    );

    try {
        if (!token) {
            throw CustomException(
                'Unauthorized access!',
                401
            );
        }

        const verification = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        console.log(
            'userMiddleware - JWT verification result:',
            verification
        );

        if (verification) {
            request.userID = verification._id;
            request.isSeller = verification.isSeller;
            request.isAdmin = verification.isAdmin;

            return next();
        }

        authLogout(request, response);

        throw CustomException(
            'Token invalid or expired. Please log in again.',
            401
        );
    } catch (error) {
        console.error(
            'Authentication Middleware Error:',
            error.message
        );

        return response.status(401).send({
            error: true,
            message:
                error.message ||
                'Authentication failed.',
        });
    }
};

module.exports = userMiddleware;
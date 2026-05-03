const userMiddleware = require('./userMiddleware');
const errorMiddleware = require('./errorMiddleware');
const authenticate = require('./authenticate')
const adminMiddleware = require('./adminMiddleware');

module.exports = {
    userMiddleware,
    errorMiddleware,
    authenticate,
    adminMiddleware
}
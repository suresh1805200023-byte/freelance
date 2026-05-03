const userRoute = require('./user.route');
const conversationRoute = require('./conversation.route');
const gigRoute = require('./gig.route');
const messageRoute = require('./message.route');
const orderRoute = require('./order.route');
const reviewRoute = require('./review.route');
const authRoute = require('./auth.route');
const notificationRoute = require('./notification.route');
const adminRoute = require('./admin.route');
const adminLogRoute = require('./adminLog.route');
const disputeRoute = require('./dispute.route');
const commissionRoute = require('./commission.route');
const categoryRoute = require('./category.route');
const communityRoute = require('./community.route');

module.exports = {
    authRoute,
    userRoute,
    conversationRoute,
    gigRoute,
    messageRoute,
    orderRoute,
    reviewRoute,
    notificationRoute,
    adminRoute,
    adminLogRoute,
    disputeRoute,
    commissionRoute,
    categoryRoute,
    communityRoute
}
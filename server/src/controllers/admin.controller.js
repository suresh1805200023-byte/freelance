const { User, Gig, Order, Commission } = require('../models');
const { CustomException } = require('../utils');
const Review = require('../models/review.model');
const { analyzeReviewWithGemini } = require('../utils/geminiReviewAI');

const getDashboardStats = async (request, response) => {
    try {
        if (!request.isAdmin) {
            throw CustomException('Unauthorized: Admin privileges required.', 403);
        }

        // Get total number of users
        const totalUsers = await User.countDocuments();

        // Get total number of gigs
        const totalGigs = await Gig.countDocuments();

        // Fetch the current commission percentage
        let commissionSetting = await Commission.findOne();
        if (!commissionSetting) {
            // If no commission setting exists, use a default and create it
            commissionSetting = new Commission({ percentage: 10 });
            await commissionSetting.save();
        }
        const commissionRate = commissionSetting.percentage / 100;

        // Calculate total commission profit
        const totalOrders = await Order.find({ isCompleted: true });
        let totalCommission = 0;
        totalOrders.forEach(order => {
            totalCommission += order.price * commissionRate;
        });

        // Aggregate commission profit by year, month, week, and day
        const commissionByPeriod = await Order.aggregate([
            { $match: { isCompleted: true } },
            { $addFields: { commission: { $multiply: ["$price", commissionRate] } } }, // Calculate commission using fetched rate
            { 
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" },
                        week: { $week: "$createdAt" },
                        day: { $dayOfMonth: "$createdAt" },
                        hour: { $hour: "$createdAt" } // Added for hourly breakdown
                    },
                    totalCommission: { $sum: "$commission" }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1, "_id.week": 1, "_id.day": 1, "_id.hour": 1 } }
        ]);

        const yearlyCommission = {};
        const monthlyCommission = {};
        const weeklyCommission = {};
        const dailyCommission = {}; // New object for daily commission

        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec"];

        commissionByPeriod.forEach(data => {
            const year = Number(data._id.year);
            const month = Number(data._id.month);
            const week = Number(data._id.week);
            const day = Number(data._id.day);
            const hour = Number(data._id.hour);

            // Skip if any date component is invalid (e.g., from orders with missing createdAt)
            if (isNaN(year) || isNaN(month) || isNaN(week) || isNaN(day) || isNaN(hour)) {
                console.warn("Skipping data point due to invalid date component:", data._id);
                return;
            }

            // Yearly
            if (!yearlyCommission[year]) yearlyCommission[year] = { name: year.toString(), totalCommission: 0 };
            yearlyCommission[year].totalCommission += data.totalCommission;

            // Monthly
            const monthKey = `${year}-${month}`;
            if (!monthlyCommission[monthKey]) {
                const monthName = month > 0 && month <= 12 ? monthNames[month - 1] : `Month ${month}`;
                monthlyCommission[monthKey] = { name: `${monthName} ${year}`, totalCommission: 0 };
            }
            monthlyCommission[monthKey].totalCommission += data.totalCommission;

            // Weekly
            const weekKey = `${year}-W${week}`;
            if (!weeklyCommission[weekKey]) weeklyCommission[weekKey] = { name: `Week ${week} (${year})`, totalCommission: 0 };
            weeklyCommission[weekKey].totalCommission += data.totalCommission;

            // Daily (Hourly breakdown within a day)
            const dailyKey = `${year}-${month}-${day}`;
            if (!dailyCommission[dailyKey]) dailyCommission[dailyKey] = { name: `${month}/${day}/${year}`, hourlyBreakdown: {} };
            dailyCommission[dailyKey].hourlyBreakdown[hour] = (dailyCommission[dailyKey].hourlyBreakdown[hour] || 0) + data.totalCommission;
        });

        // Format daily data for Recharts
        const formattedDailyCommission = Object.values(dailyCommission).map(dayData => {
            const formattedHours = Array.from({ length: 24 }, (_, i) => ({
                name: `${i}:00`,
                totalCommission: dayData.hourlyBreakdown[i] || 0
            }));
            return { 
                name: dayData.name,
                data: formattedHours
            };
        });

        // Map totalCommission to commission for frontend chart compatibility
        function mapCommissionField(arr) {
            return arr.map(item => ({ ...item, commission: item.totalCommission }));
        }

        return response.status(200).send({
            error: false,
            stats: {
                totalUsers,
                totalGigs,
                totalCommission,
                commissionByTime: {
                    yearly: mapCommissionField(Object.values(yearlyCommission)),
                    monthly: mapCommissionField(Object.values(monthlyCommission)),
                    weekly: mapCommissionField(Object.values(weeklyCommission)),
                    daily: formattedDailyCommission.map(dayData => ({
                        ...dayData,
                        data: dayData.data.map(hourObj => ({
                            ...hourObj,
                            commission: hourObj.totalCommission
                        }))
                    })),
                }
            }
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        return response.status(error.status || 500).send({
            error: true,
            message: error.message || 'Failed to fetch dashboard stats.'
        });
    }
};

const getMaxFailedLoginAttempts = async (request, response) => {
    try {
        if (!request.isAdmin) {
            throw CustomException('Unauthorized: Admin privileges required.', 403);
        }
        const users = await User.find({ failedLoginAttempts: { $gt: 0 } })
            .sort({ failedLoginAttempts: -1 })
            .limit(20)
            .select('username email failedLoginAttempts lockUntil isSeller isAdmin');
        return response.status(200).send({ error: false, users });
    } catch (error) {
        return response.status(error.status || 500).send({
            error: true,
            message: error.message || 'Failed to fetch users with failed login attempts.'
        });
    }
};

const getSuspiciousReviews = async (request, response) => {
    try {
        if (!request.isAdmin) {
            throw CustomException('Unauthorized: Admin privileges required.', 403);
        }
        const reviews = await Review.find().populate('userID gigID');
        const flagged = [];
        for (const review of reviews) {
            const aiResult = await analyzeReviewWithGemini(
                review.description,
                review.star,
                review.userID?.username || '',
                review.gigID?.title || ''
            );
            if (aiResult.isSuspicious) {
                flagged.push({
                    _id: review._id,
                    user: review.userID?.username,
                    gig: review.gigID?.title,
                    star: review.star,
                    description: review.description,
                    aiReason: aiResult.reason
                });
            }
        }
        return response.status(200).send({ error: false, flagged });
    } catch (error) {
        return response.status(error.status || 500).send({
            error: true,
            message: error.message || 'Failed to analyze reviews.'
        });
    }
};

module.exports = {
    getDashboardStats,
    getMaxFailedLoginAttempts,
    getSuspiciousReviews,
};

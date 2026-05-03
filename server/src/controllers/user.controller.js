const { User } = require('../models');
const { CustomException } = require('../utils');

const deleteUser = async (request, response) => {
    const { _id } = request.params;

    try {
        const user = await User.findOne({ _id });

        if(request.userID === user._id.toString()) {
            await User.deleteOne({ _id });
            return response.send({
                error: false,
                message: 'Account successfully deleted!'
            });
        }

        throw CustomException('Invalid request!. Cannot delete other user accounts.', 403);
    }
    catch({message, status = 500}) {
        return response.status(status).send({
            error: true,
            message
        })
    }
}

const getAllUsers = async (request, response) => {
    try {
        const users = await User.find({}).select('-password'); // Fetch all users, excluding passwords
        return response.send(users);
    } catch ({ message, status = 500 }) {
        return response.status(status).send({
            error: true,
            message
        });
    }
};

const updateUserStatus = async (request, response) => {
    const { _id } = request.params;
    const { isActive } = request.body;

    try {
        const user = await User.findByIdAndUpdate(_id, { isActive }, { new: true });

        if (!user) {
            throw CustomException('User not found.', 404);
        }

        return response.send({
            error: false,
            message: `User status updated to ${isActive ? 'active' : 'inactive'}.`,
            user
        });
    } catch ({ message, status = 500 }) {
        return response.status(status).send({
            error: true,
            message
        });
    }
};

const addToWishlist = async (request, response) => {
    const { gigId } = request.params;

    try {
        const user = await User.findById(request.userID);

        if (!user) {
            throw CustomException('User not found.', 404);
        }

        // Check if gig already in wishlist
        if (user.wishlist.includes(gigId)) {
            throw CustomException('Gig already in wishlist.', 400);
        }

        user.wishlist.push(gigId);
        await user.save();

        return response.send({
            error: false,
            message: 'Gig added to wishlist successfully!',
            wishlist: user.wishlist,
        });
    } catch ({ message, status = 500 }) {
        return response.status(status).send({
            error: true,
            message,
        });
    }
};

const removeFromWishlist = async (request, response) => {
    const { gigId } = request.params;

    try {
        const user = await User.findById(request.userID);

        if (!user) {
            throw CustomException('User not found.', 404);
        }

        // Check if gig is in wishlist
        const index = user.wishlist.indexOf(gigId);
        if (index === -1) {
            throw CustomException('Gig not found in wishlist.', 404);
        }

        user.wishlist.splice(index, 1);
        await user.save();

        return response.send({
            error: false,
            message: 'Gig removed from wishlist successfully!',
            wishlist: user.wishlist,
        });
    } catch ({ message, status = 500 }) {
        return response.status(status).send({
            error: true,
            message,
        });
    }
};

const getWishlist = async (request, response) => {
    try {
        const user = await User.findById(request.userID).populate('wishlist');

        if (!user) {
            throw CustomException('User not found.', 404);
        }

        return response.send({
            error: false,
            wishlist: user.wishlist,
        });
    } catch ({ message, status = 500 }) {
        return response.status(status).send({
            error: true,
            message,
        });
    }
};

module.exports = {
    deleteUser,
    getAllUsers,
    updateUserStatus,
    addToWishlist,
    removeFromWishlist,
    getWishlist
}
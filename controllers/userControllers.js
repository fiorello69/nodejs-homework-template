import User from "../models/users.js";

const UserController = {
  async updateSubscription(userId, subscription) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      user.subscription = subscription;
      await user.save();
      return user;
    } catch (error) {
      throw new Error(`Error updating subscription: ${error.message}`);
    }
  },
};

export default UserController;

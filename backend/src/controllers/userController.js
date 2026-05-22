import User from "../models/User.js";

// Create a new independent user profile
export const createUser = async (req, res) => {
  try {
    const { name, avatarUrl } = req.body;
    if (!name) return res.status(400).json({ message: "Name is required" });

    const newUser = await User.create({ name, avatarUrl });
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all profiles to populate the "Switch User" dropdown
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

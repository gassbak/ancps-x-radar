const bcrypt =
  require("bcryptjs");

const User =
  require("../models/User");

const hashPassword =
  async (password) => {
    return bcrypt.hash(
      password,
      10
    );
  };

const comparePassword =
  async (
    password,
    hashedPassword
  ) => {
    return bcrypt.compare(
      password,
      hashedPassword
    );
  };

const findUserByEmail =
  async (email) => {
    return User.findOne({
      email
    });
  };

const findUserById =
  async (id) => {
    return User.findById(id)
      .select("-password");
  };

module.exports = {
  hashPassword,
  comparePassword,
  findUserByEmail,
  findUserById
};
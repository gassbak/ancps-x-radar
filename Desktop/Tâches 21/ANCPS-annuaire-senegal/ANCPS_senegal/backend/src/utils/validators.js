const isRequired =
  (value) => {

    return (
      value !== undefined &&
      value !== null &&
      value !== ""
    );
  };

const isEmail =
  (email) => {

    if (!email) {
      return false;
    }

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      .test(email);
  };

const isObjectId =
  (id) => {

    return /^[0-9a-fA-F]{24}$/
      .test(id);
  };

module.exports = {
  isRequired,
  isEmail,
  isObjectId
};
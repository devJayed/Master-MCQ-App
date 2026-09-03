const validatePassword = (value) => {
  const password = String(value || '');
  if (password.length < 8 || password.length > 128 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return 'Password must be 8–128 characters and contain at least one letter and one number.';
  }
  return null;
};

module.exports = { validatePassword };

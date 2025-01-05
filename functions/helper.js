const generateOtp = async () => {
  const digits = "123456789"; // Exclude '0' for the first digit
  const allDigits = "0123456789"; // Include '0' for subsequent digits

  const otpLength = 5;

  let generateOtp = "";

  // Ensure the first digit is not '0'
  const firstIndex = Math.floor(Math.random() * digits.length);
  generateOtp = digits[firstIndex];

  // Generate the remaining digits
  for (let i = 1; i < otpLength; i++) {
    const index = Math.floor(Math.random() * allDigits.length);
    generateOtp += allDigits[index];
  }

  return generateOtp;
};

module.exports = generateOtp;

const axios = require("axios");
const asyncHandler = require("express-async-handler");

const sendMessage = asyncHandler(async (phoneNumber, message, authType) => {
  const fullNumber = phoneNumber.startsWith('+') ? phoneNumber : `+976${phoneNumber}`;

  try {
    const result = await axios.get(process.env.MESSAGE_API, {
      params: {
        key: process.env.MESSAGE_KEY,
        text: `${message}`,
        to: fullNumber,
        from: process.env.MESSAGE_PHONE_1,
      },
    });

    const success = result.data[0].Result === "SUCCESS";

    if (!success) {
      console.error(`Failed to send message to ${fullNumber}: ${result.data[0].ErrorMessage}`);
    }

    return success;

  } catch (err) {
    console.error("SendMessage error:", err.response ? err.response.data : err.message);

    return false;
  }
});

module.exports = { sendMessage };

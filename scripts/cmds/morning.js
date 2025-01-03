const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "morning",
    version: "1.0",
    author: "Aayusha",
    countDown: 5,
    role: 0,
    shortDescription: "no prefix",
    longDescription: "no prefix",
    category: "no prefix",
  },

  onStart: async function () {},

  onChat: async function ({ event, message, api }) {
    if (event.body && event.body.toLowerCase().includes("goodmorning")) {
      try {
        api.setMessageReaction("🤍", event.messageID, () => {}, true);

        const fileUrl = "https://we.tl/t-v0SqYQl70D"; // Replace with your actual link
        const filePath = path.join(__dirname, "temp_audio.mp3"); // Temporary path for audio file

        // Download the audio file
        const response = await axios({
          method: "get",
          url: fileUrl,
          responseType: "stream",
        });

        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);

        // Wait for the download to complete
        await new Promise((resolve, reject) => {
          writer.on("finish", resolve);
          writer.on("error", reject);
        });

        // Send the downloaded audio as an attachment
        await message.reply({
          attachment: fs.createReadStream(filePath),
        });

        // Wait 1 second before sending the text message
        setTimeout(() => {
          message.reply("Good Morning 🤍🌸");
        }, 1000);

        // Clean up the temporary file
        await fs.remove(filePath);

      } catch (error) {
        console.error("Error handling the audio file:", error);
        return message.reply("Something went wrong while sending the audio.");
      }
    }
  },
};
const axios = require("axios");
const fs = require("fs-extra");

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

        const fileUrl = "https://www.mediafire.com/file/yy6x3nfovmhlxes/Darlu.mp3/file"; // MediaFire link

        // Create a temporary file name (e.g., temp_audio.mp3)
        const tempAudioFile = "temp_audio.mp3";

        // Download the audio file
        console.log("Attempting to download the audio file...");

        const response = await axios({
          method: "get",
          url: fileUrl,
          responseType: "stream",
        });

        const writer = fs.createWriteStream(tempAudioFile);
        response.data.pipe(writer);

        // Wait for the download to complete
        await new Promise((resolve, reject) => {
          writer.on("finish", resolve);
          writer.on("error", reject);
        });

        console.log("File downloaded successfully!");

        // Ensure the file exists before sending
        if (fs.existsSync(tempAudioFile)) {
          // Send the downloaded audio as an attachment
          console.log("Sending the audio file...");
          await message.reply({
            attachment: fs.createReadStream(tempAudioFile),
          });

          // Wait 1 second before sending the text message
          setTimeout(() => {
            message.reply("Good Morning 🤍🌸");
          }, 1000);

          // Clean up the temporary file
          await fs.remove(tempAudioFile);
          console.log("Temporary file removed.");
        } else {
          console.error("File not found after download.");
          return message.reply("Failed to download the audio file.");
        }

      } catch (error) {
        console.error("Error handling the audio file:", error);
        return message.reply("Something went wrong while sending the audio.");
      }
    }
  },
};
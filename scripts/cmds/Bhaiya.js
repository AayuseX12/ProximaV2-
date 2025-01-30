const axios = require("axios");

module.exports = {
  config: {
    name: "🤍🕸️",
    version: "1.0",
    author: "Aayusha Shrestha",
    countDown: 5,
    role: 0,
    shortDescription: "no prefix",
    longDescription: "no prefix",
    category: "no prefix",
  },

  onStart: async function() {},

  onChat: async function({ event, message, api, getLang }) {
    if (event.body && event.body.toLowerCase().includes("kuch acha sunawo") || event.body.toLowerCase().includes("kuch acha sunado") || event.body.toLowerCase().includes("kuch acha bolo")) {
      try {
        // Set reaction to the message
        api.setMessageReaction("😁", event.messageID, () => {}, true);

        // Google Drive direct download URL (video file)
        const googleDriveUrl =
          "https://drive.google.com/uc?export=download&id=16YdSG2Xd2_K09wuYlXN8CPFwugGlsdc3"; // Replace with your actual file ID

        // Download the file from the Google Drive direct link
        const response = await axios({
          url: googleDriveUrl,
          method: "GET",
          responseType: "stream",
        });

        // Send the reply with the video attachment
        return message.reply({
          body: "🤍🕸️",
          attachment: response.data,
        });
      } catch (error) {
        console.error("Error setting reaction or sending reply:", error);
        api.sendMessage("Sorry, I couldn't fetch the video at the moment.", message.threadID);
      }
    }
  },
};

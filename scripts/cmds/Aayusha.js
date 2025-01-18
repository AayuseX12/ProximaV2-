const axios = require("axios");
const fs = require("fs");

module.exports = {
  config: {
    name: "Aayushaa",
    version: "1.0",
    author: "AceGun",
    countDown: 5,
    role: 0,
    shortDescription: "no prefix",
    longDescription: "no prefix",
    category: "no prefix",
  },

  onStart: async function() {},

  onChat: async function({ event, message, api, getLang }) {
    if (event.body && event.body.toLowerCase().includes("owner")) {
      try {
        // Set reaction to the message
        api.setMessageReaction("💋", event.messageID, () => {}, true);

        // Google Drive direct download URL
        const googleDriveUrl =
          "https://drive.google.com/uc?id=143WNU9koFGEcVN3PUJ0q0X2XTYnmgEZe&export=download";

        // Download the file from the Google Drive direct link
        const response = await axios({
          url: googleDriveUrl,
          method: "GET",
          responseType: "stream",
        });

        // Send the reply with the video
        return message.reply({
          body: "Hi, I am Prōxima. Developed by Miss Aāyusha Shrestha and my Second developer is Luzzixy.🤍🌌",
          attachment: response.data,
        });
      } catch (error) {
        console.error("Error setting reaction or sending reply:", error);
      }
    }
  },
};
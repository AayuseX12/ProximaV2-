const fs = require('fs-extra');
const axios = require('axios');
const path = require('path');

module.exports = {
  config: {
    name: "who is aayusha",
    version: "1.0",
    author: "Aayusha", // Updated author name
    countDown: 5,
    role: 0,
    shortDescription: "no prefix",
    longDescription: "no prefix",
    category: "no prefix",
  },

  onStart: async function() {},

  onChat: async function({ event, message, api, getLang }) {
    const triggers = [
      "who is aayusha",
      "who is admin",
      "ownerinfo",
      "info",
      "botinfo",
      "infobot"
    ];

    if (event.body && triggers.some(trigger => event.body.toLowerCase().includes(trigger))) {
      try {
        api.setMessageReaction("👑", event.messageID, () => {}, true);

        let responseText = "";
        const videoUrl = "https://i.imgur.com/7LqQc2d.mp4"; // Corrected Imgur video link
        const tempFilePath = path.join(__dirname, 'temp_video.mp4'); // Temp file path for storing video

        if (event.body.toLowerCase().includes("who is aayusha")) {
          responseText = "She is Princess🤍👑";
        } else if (event.body.toLowerCase().includes("who is admin") || event.body.toLowerCase().includes("admin")) {
          responseText = "The admin is Aayusha, the one who created me and manages all my tasks! 😊";
        } else if (event.body.toLowerCase().includes("info") || event.body.toLowerCase().includes("botinfo") || event.body.toLowerCase().includes("infobot")) {
          responseText = "I am Proxima, a bot developed by Aayusha. I was created to assist in chats, provide fun and useful features. 🤖";
        }

        // Download the video from Imgur and save it to a temporary file
        const response = await axios({
          method: 'get',
          url: videoUrl,
          responseType: 'stream',
        });

        const writer = fs.createWriteStream(tempFilePath);
        response.data.pipe(writer);

        writer.on('finish', () => {
          // Send the video once it's successfully saved
          message.reply({
            body: responseText,
            attachment: fs.createReadStream(tempFilePath),
          });

          // Optionally, delete the temp video after sending
          fs.remove(tempFilePath).catch(err => console.error('Error deleting temp file:', err));
        });

        writer.on('error', (err) => {
          console.error('Error saving video:', err);
        });
      } catch (error) {
        console.error("Error setting reaction or sending reply:", error);
      }
    }
  }
};
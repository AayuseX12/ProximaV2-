const fs = require('fs-extra');
const axios = require('axios');
const stream = require('stream');

module.exports = {
  config: {
    name: "Aayushehe",
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
      "admin",
      "info",
      "botinfo",
      "infobot"
    ];

    if (event.body && triggers.some(trigger => event.body.toLowerCase().includes(trigger))) {
      try {
        api.setMessageReaction("💋", event.messageID, () => {}, true);

        let responseText = "";
        const videoUrl = "https://i.imgur.com/abc123.mp4"; // Replace with your actual Imgur video link

        if (event.body.toLowerCase().includes("who is aayusha")) {
          responseText = "She is Princess🤍👑";
        } else if (event.body.toLowerCase().includes("who is admin") || event.body.toLowerCase().includes("admin")) {
          responseText = "The admin is Aayusha, the one who created me and manages all my tasks! 😊";
        } else if (event.body.toLowerCase().includes("info") || event.body.toLowerCase().includes("botinfo") || event.body.toLowerCase().includes("infobot")) {
          responseText = "I am Proxima, a bot developed by Aayusha. I was created to assist in chats, provide fun and useful features. 🤖";
        }

        const response = await axios({
          method: 'get',
          url: videoUrl,
          responseType: 'stream',
        });

        const passthrough = new stream.PassThrough();
        response.data.pipe(passthrough);

        return message.reply({
          body: responseText,
          attachment: passthrough,
        });
      } catch (error) {
        console.error("Error setting reaction or sending reply:", error);
      }
    }
  }
}
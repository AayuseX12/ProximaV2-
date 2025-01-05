const axios = require("axios");

module.exports = {
  config: {
    name: "couples",
    version: "1.0",
    author: "Aayuse",
    countDown: 5,
    role: 0,
    shortDescription: "no prefix",
    longDescription: "no prefix",
    category: "no prefix",
  },

  onStart: async function () {},

  onChat: async function ({ event, message, api }) {
    if (event.body && event.body.toLowerCase().includes("couple")) {
      try {
        // Set reaction to the message
        api.setMessageReaction("💐", event.messageID, () => {}, true);

        // List of video links
        const videoLinks = [
          "https://i.imgur.com/G6OkC76.mp4",
          "https://i.imgur.com/gWaenjT.mp4",
          "https://i.imgur.com/7cUHddG.mp4",
          "https://i.imgur.com/rNKU8As.mp4",
          "https://i.imgur.com/9gLL1PM.mp4",
          "https://i.imgur.com/VIYR54A.mp4",
          "https://i.imgur.com/tvzEaGb.mp4",
          "https://i.imgur.com/EwCQV3h.mp4",
          "https://i.imgur.com/lNmAdfk.mp4",
          "https://i.imgur.com/2FBirse.mp4",
          "https://i.imgur.com/QdhD2LC.mp4",
          "https://i.imgur.com/7XuMhby.mp4",
          "https://i.imgur.com/M4jDFNO.mp4",
          "https://i.imgur.com/D4VbJnY.mp4",
          "https://i.imgur.com/u6cF0yj.mp4",
          "https://i.imgur.com/Ln0mcPG.mp4",
          "https://i.imgur.com/oc4ynSH.mp4",
          "https://i.imgur.com/ZAMflGs.mp4",
          "https://i.imgur.com/uQsm9B3.mp4",
          "https://i.imgur.com/JPaRhtS.mp4",
          "https://i.imgur.com/GF2UxiU.mp4",
          "https://i.imgur.com/9EuMfeM.mp4",
          "https://i.imgur.com/pXTAGss.mp4",
          "https://i.imgur.com/y5xRO3w.mp4",
          "https://i.imgur.com/pUGtIFR.mp4",
        ];

        // Select a random video link
        const randomVideoUrl =
          videoLinks[Math.floor(Math.random() * videoLinks.length)];

        // Download the selected video
        const response = await axios({
          url: randomVideoUrl,
          method: "GET",
          responseType: "stream",
        });

        // Send the reply with the video
        return message.reply({
          body: "Here's are some couples 🙈🤍",
          attachment: response.data,
        });
      } catch (error) {
        console.error("Error setting reaction or sending reply:", error);
      }
    }
  },
};
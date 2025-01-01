const fs = require("fs");
const axios = require("axios"); // Install axios for HTTP requests
const path = require("path");

module.exports = {
  config: {
    name: "susi",
    version: "1.1",
    author: "Aayusha",
    countDown: 5,
    role: 0,
    shortDescription: "no prefix",
    longDescription: "no prefix",
    category: "no prefix",
  },

  onStart: async function () {},

  onChat: async function ({ event, message, api, getLang }) {
    if (event.body && event.body.toLowerCase().includes("nasa")) {
      try {
        // Set a reaction to the message
        api.setMessageReaction("🙈", event.messageID, () => {}, true);

        // Imgur link to the video/image
        const imgurLink = "https://i.imgur.com/example.mp4"; // Replace with your link

        // Download the video/image to a temporary location
        const filePath = path.resolve(__dirname, "temp.mp4");
        const response = await axios({
          method: "GET",
          url: imgurLink,
          responseType: "stream",
        });

        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);

        writer.on("finish", async () => {
          // Reply with the video/image
          return message.reply({
            body: "Nasa Nasa🙈🤍",
            attachment: fs.createReadStream(filePath),
          });

          // Clean up the temporary file after sending
          fs.unlinkSync(filePath);
        });

        writer.on("error", (err) => {
          console.error("Error writing the file:", err);
        });
      } catch (error) {
        console.error("Error setting reaction or sending reply:", error);
      }
    }
  },
};
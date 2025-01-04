const fs = require("fs");
const axios = require("axios");
const stream = require("stream");
const { promisify } = require("util");
const pipeline = promisify(stream.pipeline);

module.exports = {
  config: {
    name: "marriage",
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
    const triggers = ["marriage", "maried", "bihe"];

    if (event.body && triggers.some(trigger => event.body.toLowerCase().includes(trigger))) {
      try {
        api.setMessageReaction("🤍", event.messageID, () => {}, true);

        const videoLink = "https://drive.google.com/uc?export=download&id=1-9tYCbQxQYATYbZ4wJPcZyZLvVDCDd4R";

        const response = await axios({
          url: videoLink,
          method: "GET",
          responseType: "stream",
        });

        const filePath = "/tmp/video.mp4";

        await pipeline(response.data, fs.createWriteStream(filePath));

        await api.sendMessage({
          body: "Me in your Bihee😂🫣",
          attachment: fs.createReadStream(filePath),
        }, event.threadID);

        fs.unlinkSync(filePath);
      } catch (error) {
        console.error("Error handling the trigger or sending the video:", error);
        message.reply("(Video could not be sent)");
      }
    }
  },
};
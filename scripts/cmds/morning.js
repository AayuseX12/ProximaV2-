const fs = require("fs");
const axios = require("axios");
const stream = require("stream");
const { promisify } = require("util");
const pipeline = promisify(stream.pipeline);

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
    const triggers = ["goodmorning", "morning", "gm", "good morning"];

    if (event.body && triggers.some(trigger => event.body.toLowerCase().includes(trigger))) {
      try {
        api.setMessageReaction("🤍", event.messageID, () => {}, true);

        message.reply("Good Morning 🤍🌸");

        setTimeout(async () => {
          try {
            const audioLink = "https://drive.google.com/uc?export=download&id=1-5KVMiLhx7dZhEwfGyQNJiVKc7eyI2OU";

            const response = await axios({
              url: audioLink,
              method: "GET",
              responseType: "stream",
            });

            const filePath = "/tmp/audio.mp3";

            await pipeline(response.data, fs.createWriteStream(filePath));

            await message.reply({
              attachment: fs.createReadStream(filePath),
            });

            fs.unlinkSync(filePath);
          } catch (audioError) {
            console.error("Error sending the audio file:", audioError);
            message.reply("(Audio could not be sent)");
          }
        }, 50);
      } catch (error) {
        console.error("Error handling the trigger:", error);
      }
    }
  },
};
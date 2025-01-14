const axios = require('axios');
const fs = require('fs-extra');

module.exports = {
  config: {
    name: "addEvent",
    version: "1.0",
    author: "Aayusha",
    category: "events",
  },

  onStart: async ({ threadsData, message, event, api }) => {
    if (event.logMessageType === "log:subscribe") {
      const { threadID } = event;
      const dataAddedParticipants = event.logMessageData.addedParticipants;

      // If the bot is added to the group
      if (dataAddedParticipants.some((item) => item.userFbId === api.getCurrentUserID())) {
        const newNickname = "Aayusha's Bot";
        await api.changeNickname(newNickname, threadID, api.getCurrentUserID());

        const videoUrl = 'https://drive.google.com/uc?export=download&id=128FuMdA9iOpRtsKTVTFHNF6w3FqJHOaJ';
        const videoPath = './cache/joinmp4/Aayusha.mp4';

        try {
          await fs.ensureDir('./cache/joinmp4'); // Ensure the directory exists

          const response = await axios({
            url: videoUrl,
            method: 'GET',
            responseType: 'stream',
          });

          const writer = fs.createWriteStream(videoPath);
          response.data.pipe(writer);

          writer.on('finish', async () => {
            try {
              await message.send({
                body: "Hi, I Am Proxima🤍🌸. Developed by Miss Aayusha Shrestha🤍",
                attachment: fs.createReadStream(videoPath),
              });
            } catch (error) {
              console.error("Error sending video message: ", error);
            }
          });

          writer.on('error', (error) => {
            console.error("Error saving video: ", error);
          });
        } catch (error) {
          console.error("Error downloading video: ", error);
          message.reply("Failed to download the video. Please check the link or try again.");
        }
      }
    }
  },
};
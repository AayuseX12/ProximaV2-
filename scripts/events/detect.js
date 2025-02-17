const axios = require('axios'); // Axios for downloading the file
const fs = require('fs'); // To save the downloaded file

module.exports = {
  config: {
    name: "#",
    version: "1.0",
    author: "Aayuse",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "Detects # and sends an MP4 with download functionality and mentions the user.",
    },
    longDescription: {
      en: "When a # is detected, the bot will send an MP4 file from Imgur, allow the user to download it, and mention the user with a random reply.",
    },
    category: "owner",
    guide: {
      en: "Use # followed by a keyword to receive an MP4 along with a download link and a random reply mentioning you.",
    },
  },

  onStart: async function ({ args, message, api, event }) {
    const mp4Url = 'https://i.imgur.com/BjPV8Ty.mp4'; // The provided MP4 URL

    // Check if the message contains '#' to trigger the bot's action
    if (message.body.includes('#')) {
      try {
        // Mention functionality
        const id = event.senderID;
        const userData = await usersData.get(id); // Assuming 'usersData' is defined somewhere
        const name = userData.name;
        const ment = [{ id: id, tag: name }];

        // Random reply (Only one reply)
        const randomReply = `${name}, Don't flirt with me!🤍🌷`;

        // Download the MP4
        const response = await axios({
          method: 'get',
          url: mp4Url,
          responseType: 'stream',
        });

        // Create a temporary file to store the MP4
        const mp4Path = './tmpVideo.mp4'; // Temporary file path

        response.data.pipe(fs.createWriteStream(mp4Path)); // Pipe the stream to the file

        // After the MP4 is saved, send it as an attachment and reply with mention
        response.data.on('end', () => {
          api.sendMessage(
            {
              body: randomReply, // Send the random reply with the mention
              attachment: fs.createReadStream(mp4Path), // Attach the file
              mentions: ment, // Mention the user
            },
            message.threadID
          );

          // Optional: Send a download link (based on your file server setup)
          api.sendMessage(
            {
              body: `You can download the MP4 here: ${mp4Path}`,
            },
            message.threadID
          );
        });

      } catch (error) {
        console.log('Error downloading the MP4:', error);
        api.sendMessage(
          {
            body: "Sorry, I couldn't find the MP4 to send at the moment. Please try again later.",
          },
          message.threadID
        );
      }
    }
  },
};

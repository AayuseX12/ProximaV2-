const axios = require('axios');
const fs = require('fs-extra');

module.exports = {
  config: {
    name: "addEvent",
    version: "1.1",
    author: "Aayusha",
    category: "events",
  },

  onStart: async ({ threadsData, message, event, api }) => {
    if (event.logMessageType === "log:subscribe") {
      const { threadID } = event;
      const dataAddedParticipants = event.logMessageData.addedParticipants;

      // Check if the bot was added to the group
      if (dataAddedParticipants.some((item) => item.userFbId === api.getCurrentUserID())) {
        await handleBotAddition(threadID, message, api);
      }
    }
  },
};

// Function to handle the bot being added to the group
const handleBotAddition = async (threadID, message, api) => {
  try {
    await setBotNickname(threadID, api);
    const videoPath = await downloadVideo();
    await sendWelcomeMessage(threadID, message, videoPath);
  } catch (error) {
    console.error("Error during bot addition: ", error);
    message.reply("An error occurred while processing the bot addition. Please try again.");
  }
};

// Function to change the bot's nickname
const setBotNickname = async (threadID, api) => {
  const newNickname = "Aayusha's Bot";
  try {
    await api.changeNickname(newNickname, threadID, api.getCurrentUserID());
  } catch (error) {
    console.error("Error setting bot nickname: ", error);
  }
};

// Function to download the video
const downloadVideo = async () => {
  const videoUrl = 'https://drive.google.com/uc?export=download&id=1618ydsYoYP2eOgBadZDlbZN519ne3Ssf';
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

    return new Promise((resolve, reject) => {
      writer.on('finish', () => resolve(videoPath));
      writer.on('error', (error) => reject(error));
    });
  } catch (error) {
    console.error("Error downloading video: ", error);
    throw new Error("Failed to download the video.");
  }
};

// Function to send the welcome message along with the video
const sendWelcomeMessage = async (threadID, message, videoPath) => {
  const botInfoMessage = `──── BOT INFO ──── ✨  
▣ |NAME: Proxima 🤖  
▣ |MISSION: Bringing sparkles, fun, and magic to your chats! 🌑

─── CREATOR INFO ─── 🌙  
▣ |NAME: Aayusha Shrestha 🖤  
▣ |ROLE: The mastermind behind Proxima's brilliance! ⚡`;

  try {
    await message.send({
      body: botInfoMessage,
      attachment: fs.createReadStream(videoPath),
    });
  } catch (error) {
    console.error("Error sending video message: ", error);
    message.reply("Failed to send the welcome message. Please try again.");
  }
};
const fs = require("fs-extra");
const ytdl = require("@neoxr/ytdl-core");
const yts = require("yt-search");
const axios = require('axios');
const tinyurl = require('tinyurl');

module.exports = {
  config: {
    name: "ytb",
    version: "1.3",
    author: "JARiF",
    countDown: 5,
    role: 0,
    category: "cute",
  },

  onStart: async function ({ api, event, message }) {
    try {
      const sendReply = async (songName) => {
        const originalMessage = await message.reply(`Searching for "${songName}"...`);
        const searchResults = await yts(songName);

        if (!searchResults.videos.length) {
          return message.reply("Error: Song not found.");
        }

        const video = searchResults.videos[0];
        const videoUrl = video.url;
        const stream = ytdl(videoUrl, { filter: "audioonly" });
        const fileName = `music.mp3`;
        const filePath = `${__dirname}/tmp/${fileName}`;

        stream.pipe(fs.createWriteStream(filePath));
        stream.on("end", async () => {
          const fileSize = fs.statSync(filePath).size;
          if (fileSize > 26214400) { // 25MB
            fs.unlinkSync(filePath);
            return message.reply('[ERR] The file is larger than 25MB and cannot be sent.');
          }

          const replyMessage = {
            body: `Title: ${video.title}\nArtist: ${video.author.name}`,
            attachment: fs.createReadStream(filePath),
          };

          await api.unsendMessage(originalMessage.messageID);
          await message.reply(replyMessage, event.threadID, () => {
            fs.unlinkSync(filePath);
          });
        });
      };

      if (event.type === "message_reply" && ["audio", "video"].includes(event.messageReply.attachments[0].type)) {
        const attachmentUrl = event.messageReply.attachments[0].url;
        const shortenedUrl = await tinyurl.shorten(attachmentUrl);
        const response = await axios.get(`https://www.api.vyturex.com/songr?url=${shortenedUrl}`);

        if (response.data && response.data.title) {
          await sendReply(response.data.title);
        } else {
          message.reply("Error: Song information not found.");
        }
      } else {
        const input = event.body.substring(12).trim();
        if (!input) return message.reply("Please provide a song name.");

        await sendReply(input);
      }
    } catch (error) {
      console.error('[ERROR]', error);
      message.reply("An error occurred. Please try again.");
    }
  },
};
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const ytSearch = require("yt-search");
const https = require("https");

module.exports = {
  config: {
    name: "search",
    version: "1.0.3",
    author: "Aayusha",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "Download YouTube video or audio.",
    },
    longDescription: {
      en: "Search and download YouTube videos or audio using a keyword or link.",
    },
    category: "media",
    guide: {
      en: "{pn} <songName> [audio/video]",
    },
  },

  onStart: async function ({ args, message, api, event }) {
    let songName, type;

    if (
      args.length > 1 &&
      (args[args.length - 1] === "audio" || args[args.length - 1] === "video")
    ) {
      type = args.pop();
      songName = args.join(" ");
    } else {
      songName = args.join(" ");
      type = "video";
    }

    const processingMessage = await message.reply(
      "✅ Processing your request. Please wait..."
    );

    try {
      const searchResults = await ytSearch(songName);
      if (!searchResults || !searchResults.videos.length) {
        throw new Error("No results found for your search query.");
      }

      const topResult = searchResults.videos[0];
      const videoId = topResult.videoId;

      const apiKey = "priyansh-here";
      const apiUrl = `https://priyansh-ai.onrender.com/youtube?id=${videoId}&type=${type}&apikey=${apiKey}`;

      api.setMessageReaction("⌛", event.messageID, () => {}, true);

      const downloadResponse = await axios.get(apiUrl);
      const downloadUrl = downloadResponse.data.downloadUrl;

      const safeTitle = topResult.title.replace(/[^a-zA-Z0-9 \-_]/g, ""); // Clean title
      const filename = `${safeTitle}.${type === "audio" ? "mp3" : "mp4"}`;
      const downloadDir = path.join(__dirname, "cache");
      const downloadPath = path.join(downloadDir, filename);

      if (!fs.existsSync(downloadDir)) {
        fs.mkdirSync(downloadDir, { recursive: true });
      }

      const file = fs.createWriteStream(downloadPath);

      await new Promise((resolve, reject) => {
        https
          .get(downloadUrl, (response) => {
            if (response.statusCode === 200) {
              response.pipe(file);
              file.on("finish", () => {
                file.close(resolve);
              });
            } else {
              reject(
                new Error(
                  `Failed to download file. Status code: ${response.statusCode}`
                )
              );
            }
          })
          .on("error", (error) => {
            fs.unlinkSync(downloadPath);
            reject(new Error(`Error downloading file: ${error.message}`));
          });
      });

      api.setMessageReaction("✅", event.messageID, () => {}, true);

      await message.reply({
        attachment: fs.createReadStream(downloadPath),
        body: `🖤 Title: ${topResult.title}\n\n Here is your ${
          type === "audio" ? "audio" : "video"
        } 🎧:`,
      });

      fs.unlinkSync(downloadPath);
      api.unsendMessage(processingMessage.messageID);
    } catch (error) {
      console.error(`Failed to download and send song: ${error.message}`);
      message.reply(`❌ Failed to download song: ${error.message}`);
    }
  },
};

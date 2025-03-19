const fs = require("fs");
const path = require("path");
const axios = require("axios");
const yts = require("yt-search");

module.exports = {
  config: {
    name: "video",
    version: "1.0.4",
    author: "aayuse",
    countDown: 5,
    role: 1,
    shortDescription: {
      en: "🎥 Download YouTube videos (under 25MB) or get a link.",
    },
    longDescription: {
      en: "Search and download YouTube videos under 25MB, or receive a direct download link if the file is too large.",
    },
    category: "owner",
    guide: {
      en: "{pn} <video name>",
    },
  },

  onStart: async function ({ args, message, event, api }) {
    if (!args[0]) {
      return message.reply("⚠️ | Please enter the name of the video you want to download.");
    }

    try {
      const query = args.join(" ");
      api.setMessageReaction("🔍", event.messageID, () => {}, true);
      await message.reply(`🎶 | Searching for: "${query}"...\n⏳ Please wait...`);

      const searchResults = await yts(query);
      const firstResult = searchResults.videos[0];

      if (!firstResult) {
        return message.reply(`❌ | No results found for "${query}". Please try again with a different title.`);
      }

      const { title, url } = firstResult;
      api.setMessageReaction("⏳", event.messageID, () => {}, true);
      await message.reply(`🎬 | Fetching video: "${title}"...\n📥 Preparing download link...`);

      const apiUrl = `https://mr-prince-malhotra-ytdl.vercel.app/video?url=${encodeURIComponent(url)}`;
      const response = await axios.get(apiUrl);
      const responseData = response.data;

      if (!responseData.result || !responseData.result.url) {
        return message.reply(`🚫 | Unable to retrieve a download link for "${title}".`);
      }

      const downloadUrl = responseData.result.url;
      const filePath = path.resolve(__dirname, "cache", `${Date.now()}-${title}.mp4`);

      const videoResponse = await axios({
        method: "get",
        url: downloadUrl,
        responseType: "stream",
        headers: { "User-Agent": "Mozilla/5.0" },
      });

      const fileStream = fs.createWriteStream(filePath);
      videoResponse.data.pipe(fileStream);

      fileStream.on("finish", async () => {
        const fileSizeInMB = fs.statSync(filePath).size / (1024 * 1024);

        if (fileSizeInMB > 25) {
          fs.unlinkSync(filePath);
          return message.reply(
            `⚠️ | The file size of "${title}" is **${fileSizeInMB.toFixed(2)}MB**, which exceeds the 25MB limit.\n🔗 You can download it manually here: ${downloadUrl}`
          );
        }

        api.setMessageReaction("✅", event.messageID, () => {}, true);
        await message.reply({
          body: `✅ | Download Complete!\n🎥 Your video: "${title}" is ready.`,
          attachment: fs.createReadStream(filePath),
        });

        fs.unlinkSync(filePath);
      });

      videoResponse.data.on("error", async (error) => {
        console.error(error);
        fs.unlinkSync(filePath);
        return message.reply(`🚨 | An error occurred while downloading: ${error.message}`);
      });

    } catch (error) {
      console.error(error);
      let errorMessage = "An unknown error occurred.";

      if (error.response) {
        errorMessage = error.response.data?.message || error.response.statusText || "No response from the server.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      return message.reply(`🚨 | Error: ${errorMessage}`);
    }
  },
};
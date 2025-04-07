const fs = require("fs");
const path = require("path");
const ytSearch = require("yt-search");
const axios = require("axios");
const https = require("https");

module.exports = {
  config: {
    name: "youtube",
    version: "1.0.4",
    author: "Aayusha",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "Download YouTube music or video by keywords",
    },
    longDescription: {
      en: "Search and download YouTube music or video using a keyword and type (music/video).",
    },
    category: "media",
    guide: {
      en: "#YouTube [song name] [music/video]\n\nExample:\n#YouTube senorita music\n#YouTube faded video",
    },
  },

  onStart: async function ({ args, message }) {
    if (args.length < 2) {
      return message.reply("⚠️ Missing input!\n\nPlease enter a song name followed by music or video.\n\nExample:\n#YouTube senorita music");
    }

    const type = args.pop().toLowerCase();
    const songName = args.join(" ");

    if (type !== "music" && type !== "video") {
      return message.reply("❌ Invalid type!\n\nOnly music or video are accepted.\n\nExample:\n#YouTube faded video");
    }

    await message.reply(`🔍 Searching for: ${songName}\n⏳ Type: ${type.toUpperCase()}`);

    try {
      const searchResults = await ytSearch(songName);
      if (!searchResults || !searchResults.videos.length) {
        throw new Error("No results found for your search query.");
      }

      const topResult = searchResults.videos[0];
      const videoId = topResult.videoId;

      const apiKey = "priyansh-here";
      const apiUrl = `https://priyansh-ai.onrender.com/youtube?id=${videoId}&type=${type}&apikey=${apiKey}`;

      const downloadResponse = await axios.get(apiUrl);
      let downloadUrl = downloadResponse.data.downloadUrl;

      if (downloadUrl.startsWith("http:")) {
        downloadUrl = downloadUrl.replace("http:", "https:");
      }

      const safeTitle = topResult.title.replace(/[^a-zA-Z0-9 \-_]/g, "");
      const filename = `${safeTitle}.${type === "music" ? "mp3" : "mp4"}`;
      const downloadDir = path.join(__dirname, "cache");
      const downloadPath = path.join(downloadDir, filename);

      if (!fs.existsSync(downloadDir)) {
        fs.mkdirSync(downloadDir, { recursive: true });
      }

      const file = fs.createWriteStream(downloadPath);

      await new Promise((resolve, reject) => {
        https.get(downloadUrl, (response) => {
          if (response.statusCode === 200) {
            response.pipe(file);
            file.on("finish", () => file.close(resolve));
          } else {
            reject(new Error(`Failed to download. Status: ${response.statusCode}`));
          }
        }).on("error", (error) => {
          fs.unlinkSync(downloadPath);
          reject(new Error(`Download error: ${error.message}`));
        });
      });

      await message.reply({
        attachment: fs.createReadStream(downloadPath),
        body: `✨ Title: ${topResult.title}\n\n✅ Here's your ${type === "music" ? "music" : "video"} file. Enjoy!`,
      });

      fs.unlinkSync(downloadPath);
    } catch (error) {
      console.error(error.message);
      message.reply(`❗ Failed: ${error.message}`);
    }
  },
};
const fs = require("fs");
const path = require("path");
const ytSearch = require("yt-search");
const axios = require("axios");
const https = require("https");

const apiKey = "priyansh-here"; // API Key for downloading

module.exports = {
  config: {
    name: "music",
    version: "1.1.0",
    author: "Aayusha",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "Search and download YouTube songs",
    },
    longDescription: {
      en: "Search and download songs from YouTube by providing a keyword.",
    },
    category: "media",
    guide: {
      en: "{pn} [songName]\n\nThen choose a number (1-5) to download.",
    },
  },

  onStart: async function ({ args, message, api, event }) {
    if (!args.length) {
      return message.reply("❌ Please enter a song name.");
    }

    const songName = args.join(" ");
    await message.reply("✅ Searching YouTube for your song...");

    try {
      const searchResults = await ytSearch(songName);
      if (!searchResults.videos.length) {
        return message.reply("❌ No results found.");
      }

      let results = searchResults.videos.slice(0, 5);
      let responseMsg = "🎵 **Top 5 Search Results:**\n\n";
      let buttons = [];

      results.forEach((video, index) => {
        responseMsg += `${index + 1}. **${video.title}**\nDuration: ${video.timestamp}\n\n`;
        buttons.push({
          buttonText: { displayText: `${index + 1}` },
          type: 1,
        });
      });

      responseMsg += "📌 Reply with a number (1-5) to download your choice.";

      // Save search results to memory
      global.musicSearchResults = results;

      await message.reply({
        body: responseMsg,
        attachment: await Promise.all(results.map((v) => getThumbnail(v.thumbnail))),
      });
    } catch (error) {
      console.error(error);
      message.reply("❌ Error fetching search results.");
    }
  },

  onReply: async function ({ body, message, event }) {
    if (!global.musicSearchResults) {
      return message.reply("❌ No active search results. Please search again.");
    }

    const choice = parseInt(body);
    if (isNaN(choice) || choice < 1 || choice > 5) {
      return message.reply("❌ Please choose a valid number between 1-5.");
    }

    const selectedVideo = global.musicSearchResults[choice - 1];
    const videoId = selectedVideo.videoId;
    const apiUrl = `https://priyansh-ai.onrender.com/youtube?id=${videoId}&type=audio&apikey=${apiKey}`;

    await message.reply("🎶 Downloading your song...");

    try {
      const { data } = await axios.get(apiUrl);
      const downloadUrl = data.downloadUrl;
      const safeTitle = selectedVideo.title.replace(/[^a-zA-Z0-9 \-_]/g, "");
      const filename = `${safeTitle}.mp3`;
      const downloadPath = path.join(__dirname, "cache", filename);

      if (!fs.existsSync(path.dirname(downloadPath))) {
        fs.mkdirSync(path.dirname(downloadPath), { recursive: true });
      }

      const file = fs.createWriteStream(downloadPath);
      await new Promise((resolve, reject) => {
        https.get(downloadUrl, (response) => {
          if (response.statusCode === 200) {
            response.pipe(file);
            file.on("finish", () => {
              file.close(resolve);
            });
          } else {
            reject(new Error(`Failed to download: ${response.statusCode}`));
          }
        }).on("error", reject);
      });

      await message.reply({
        attachment: fs.createReadStream(downloadPath),
        body: `🎧 **Here is your song:**\n🎵 Title: ${selectedVideo.title}`,
      });

      fs.unlinkSync(downloadPath);
    } catch (error) {
      console.error(error);
      message.reply("❌ Error downloading the song.");
    }
  },
};

async function getThumbnail(url) {
  try {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    return Buffer.from(response.data, "binary");
  } catch {
    return null;
  }
          }

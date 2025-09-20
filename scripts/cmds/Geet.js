const fs = require("fs");
const path = require("path");
const ytSearch = require("yt-search");
const axios = require("axios");

const baseApiUrl = async () => {
    const base = await axios.get(`https://raw.githubusercontent.com/Mostakim0978/D1PT0/refs/heads/main/baseApiUrl.json`);
    return base.data.api;
};

(async () => {
    global.apis = {
        diptoApi: await baseApiUrl()
    };
})();

async function getStreamFromURL(url, pathName) {
    try {
        const response = await axios.get(url, { responseType: "stream" });
        response.data.path = pathName;
        return response.data;
    } catch (err) {
        throw new Error("Failed to get stream from URL.");
    }
}

global.utils = {
    ...global.utils,
    getStreamFromURL: global.utils.getStreamFromURL || getStreamFromURL
};

function getVideoID(url) {
    const regex = /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))((\w|-){11})(?:\S+)?$/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

module.exports = {
  config: {
    name: "youtube",
    version: "1.2.0",
    author: "Aayusha (Updated with new API)",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "Download YouTube music or video by keywords",
    },
    longDescription: {
      en: "Search and display top 5 YouTube results with thumbnails and let user choose which to download.",
    },
    category: "media",
    guide: {
      en: "#youtube [song name] [music/video]",
    },
  },

  onStart: async function ({ api, args, message, event }) {
    const threadId = event.threadID;
    const senderId = event.senderID;

    if (args.length < 2)
      return message.reply("⚠️ Use like: #youtube faded music");

    const type = args.pop().toLowerCase();
    const songName = args.join(" ");

    if (type !== "music" && type !== "video")
      return message.reply("❌ Type must be 'music' or 'video'.");

    await message.reply(`🔍 Searching: ${songName} | Type: ${type.toUpperCase()}`);

    try {
      const searchResults = await ytSearch(songName);
      if (!searchResults.videos.length)
        return message.reply("❗ No results found.");

      const top5 = searchResults.videos.slice(0, 5);
      const thumbnailsDir = path.join(__dirname, "cache", "thumbnails");

      if (!fs.existsSync(thumbnailsDir)) fs.mkdirSync(thumbnailsDir, { recursive: true });

      const thumbs = [];
      for (let i = 0; i < top5.length; i++) {
        const thumbPath = path.join(thumbnailsDir, `thumb_${i}_${Date.now()}.png`);
        await downloadFile(top5[i].thumbnail, thumbPath);
        thumbs.push(thumbPath);
      }

      let body = "🎥 Top 5 YouTube Results:\n\n";
      top5.forEach((video, i) => {
        body += `${i + 1}. ${video.title}\n⏱️ ${video.timestamp} | 👁️ ${video.views.toLocaleString()}\n\n`;
      });
      body += "↩️ Reply with 1-5 to download.";

      api.sendMessage({
        body,
        attachment: thumbs.map(p => fs.createReadStream(p)),
      }, threadId, (err, info) => {
        if (err) return console.log("Send message error:", err);

        global.GoatBot.onReply.set(info.messageID, {
          commandName: this.config.name,
          messageID: info.messageID,
          author: senderId,
          results: top5,
          type: type
        });

        setTimeout(() => {
          thumbs.forEach(p => fs.existsSync(p) && fs.unlinkSync(p));
        }, 10000);
      });

    } catch (err) {
      console.log("Search error:", err);
      return message.reply("❗ Search failed. Try again later.");
    }
  },

  onReply: async function ({ api, event, message, Reply }) {
    const { threadID, messageID, senderID, body } = event;

    console.log("[YouTube] onReply triggered");

    if (senderID !== Reply.author)
      return api.sendMessage("⚠️ Only the person who searched can reply.", threadID, messageID);

    const choice = parseInt(body);
    if (isNaN(choice) || choice < 1 || choice > Reply.results.length)
      return api.sendMessage("❌ Invalid number. Reply 1-5.", threadID, messageID);

    const selected = Reply.results[choice - 1];
    const videoId = selected.videoId;

    await api.sendMessage(`⏬ Downloading: ${selected.title}`, threadID);

    try {
      let retries = 0;
      while (!global.apis?.diptoApi && retries < 10) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        retries++;
      }

      if (!global.apis?.diptoApi) {
        throw new Error("API not initialized. Please try again.");
      }

      const format = "mp4";
      
      console.log(`Fetching from API: ${global.apis.diptoApi}/ytDl3?link=${videoId}&format=${format}`);
      
      const { data: { title, quality, downloadLink } } = await axios.get(
        `${global.apis.diptoApi}/ytDl3?link=${videoId}&format=${format}`,
        { timeout: 120000 }
      );

      if (!downloadLink) {
        throw new Error("Download URL not found in API response.");
      }

      console.log(`Download URL obtained: ${downloadLink}`);

      await api.sendMessage({
        body: `✅ Downloaded: ${title || selected.title}\n📺 Quality: ${quality}\n⏱️ ${selected.timestamp}\n👁️ ${selected.views.toLocaleString()}`,
        attachment: await global.utils.getStreamFromURL(downloadLink, `${title || selected.title}.mp4`)
      }, threadID, messageID);

    } catch (err) {
      console.error("Download error:", err.message);
      
      let errorMsg = "❌ Failed to download: ";
      if (err.message.includes("timeout")) {
        errorMsg += "Request timeout. The video might be too long or server is busy.";
      } else if (err.message.includes("API not initialized")) {
        errorMsg += "API not ready. Please try again in a moment.";
      } else if (Reply.type === "music") {
        errorMsg += "Audio downloads are not supported with the new API. Only video downloads are available.";
      } else {
        errorMsg += err.message;
      }
      
      api.sendMessage(errorMsg, threadID);
    }
  },
};

async function downloadFile(url, filePath) {
  return new Promise((resolve, reject) => {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const protocol = url.startsWith('https:') ? require('https') : require('http');
    const file = fs.createWriteStream(filePath);

    const request = protocol.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        if (res.headers.location) {
          file.close();
          fs.unlinkSync(filePath);
          return downloadFile(res.headers.location, filePath).then(resolve).catch(reject);
        } else {
          return reject(new Error("Redirect with no location"));
        }
      }

      if (res.statusCode !== 200) {
        file.close();
        fs.unlinkSync(filePath);
        return reject(new Error(`Failed to download: HTTP ${res.statusCode}`));
      }

      res.pipe(file);

      file.on("finish", () => {
        file.close(() => {
          if (fs.existsSync(filePath) && fs.statSync(filePath).size > 0) {
            resolve();
          } else {
            fs.unlinkSync(filePath);
            reject(new Error("File empty or not found after download"));
          }
        });
      });
    });

    request.on("error", (e) => {
      file.close();
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      reject(e);
    });

    request.setTimeout(60000, function() {
      request.abort();
      file.close();
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      reject(new Error("Download timeout"));
    });
  });
}
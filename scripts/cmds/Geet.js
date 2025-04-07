const fs = require("fs");
const path = require("path");
const ytSearch = require("yt-search");
const axios = require("axios");
const https = require("https");

module.exports = {
  config: {
    name: "youtube",
    version: "1.1.2",
    author: "Aayusha",
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

        // Using GoatBot onReply like in callad
        global.GoatBot.onReply.set(info.messageID, {
          commandName: this.config.name,
          messageID: info.messageID,
          author: senderId,
          results: top5,
          type: type
        });

        // Cleanup thumbnails
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
    const type = Reply.type;
    const videoId = selected.videoId;

    await api.sendMessage(`⏬ Downloading: ${selected.title}`, threadID);

    try {
      const apiKey = "priyansh-here";
      const mainURL = `https://priyansh-ai.onrender.com/youtube?id=${videoId}&type=${type}&apikey=${apiKey}`;

      let res = await axios.get(mainURL).catch(() => null);
      if (!res?.data?.downloadUrl) {
        const fallbackURL = `https://api.downloadfy.net/youtube?id=${videoId}&type=${type === "music" ? "mp3" : "mp4"}&apikey=${apiKey}`;
        res = await axios.get(fallbackURL);
      }

      const downloadUrl = res?.data?.downloadUrl;
      if (!downloadUrl) throw new Error("Download URL not found.");

      const filename = `${selected.title.replace(/[^\w\s]/gi, "").substring(0, 40)}_${Date.now()}.${type === "music" ? "mp3" : "mp4"}`;
      const filePath = path.join(__dirname, "cache", filename);
      await downloadFile(downloadUrl, filePath);

      if (!fs.existsSync(filePath)) throw new Error("Download failed.");

      await api.sendMessage({
        body: `✅ Downloaded: ${selected.title}\n⏱️ ${selected.timestamp}\n👁️ ${selected.views.toLocaleString()}`,
        attachment: fs.createReadStream(filePath),
      }, threadID, () => {
        setTimeout(() => fs.existsSync(filePath) && fs.unlinkSync(filePath), 10000);
      });

    } catch (err) {
      console.error("Download error:", err.message);
      api.sendMessage("❌ Failed to download. Try again later.", threadID);
    }
  },
};

async function downloadFile(url, filePath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filePath);
    https.get(url, (res) => {
      if (res.statusCode === 302 && res.headers.location) {
        return downloadFile(res.headers.location, filePath).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) return reject(new Error("Failed to download: " + res.statusCode));

      res.pipe(file);
      file.on("finish", () => {
        file.close(() => {
          if (fs.existsSync(filePath) && fs.statSync(filePath).size > 0) resolve();
          else reject(new Error("File empty"));
        });
      });
    }).on("error", (e) => {
      fs.existsSync(filePath) && fs.unlinkSync(filePath);
      reject(e);
    });
  });
}
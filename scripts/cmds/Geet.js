const fs = require("fs");
const path = require("path");
const ytSearch = require("yt-search");
const axios = require("axios");
const https = require("https");
const http = require("http");

module.exports = {
  config: {
    name: "youtube",
    version: "1.1.3",
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
    const apiType = Reply.type === "music" ? "audio" : "video"; // Convert "music" to "audio" for API
    const videoId = selected.videoId;

    await api.sendMessage(`⏬ Downloading: ${selected.title}`, threadID);

    try {
      const apiKey = "priyansh-here";
      const mainURL = `https://priyansh-ai.onrender.com/youtube?id=${videoId}&type=${apiType}&apikey=${apiKey}`;

      console.log(`Trying primary API URL: ${mainURL}`);
      let res = null;
      
      try {
        res = await axios.get(mainURL, { timeout: 15000 });
      } catch (err) {
        console.log("Primary API failed, trying fallback:", err.message);
        res = null;
      }

      if (!res?.data?.downloadUrl) {
        const fallbackURL = `https://api.downloadfy.net/youtube?id=${videoId}&type=${Reply.type === "music" ? "mp3" : "mp4"}&apikey=${apiKey}`;
        console.log(`Trying fallback API URL: ${fallbackURL}`);
        res = await axios.get(fallbackURL, { timeout: 15000 });
      }

      const downloadUrl = res?.data?.downloadUrl;
      if (!downloadUrl) throw new Error("Download URL not found.");

      console.log(`Download URL obtained: ${downloadUrl}`);
      
      const extension = Reply.type === "music" ? "mp3" : "mp4";
      const filename = `${selected.title.replace(/[^\w\s]/gi, "").substring(0, 40)}_${Date.now()}.${extension}`;
      const filePath = path.join(__dirname, "cache", filename);
      
      await downloadFile(downloadUrl, filePath);

      if (!fs.existsSync(filePath)) throw new Error("Download failed.");
      if (fs.statSync(filePath).size < 10000) throw new Error("Downloaded file is too small, likely corrupted.");

      console.log(`Download successful: ${filePath} (${fs.statSync(filePath).size} bytes)`);

      await api.sendMessage({
        body: `✅ Downloaded: ${selected.title}\n⏱️ ${selected.timestamp}\n👁️ ${selected.views.toLocaleString()}`,
        attachment: fs.createReadStream(filePath),
      }, threadID, () => {
        setTimeout(() => fs.existsSync(filePath) && fs.unlinkSync(filePath), 10000);
      });

    } catch (err) {
      console.error("Download error:", err.message);
      api.sendMessage(`❌ Failed to download: ${err.message}. Try again later.`, threadID);
    }
  },
};

async function downloadFile(url, filePath) {
  return new Promise((resolve, reject) => {
    // Create directory if it doesn't exist
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Handle both http and https URLs
    const protocol = url.startsWith('https:') ? https : require('http');
    
    const file = fs.createWriteStream(filePath);
    
    const request = protocol.get(url, (res) => {
      // Handle redirects
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
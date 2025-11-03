
const fs = require("fs");
const path = require("path");
const ytSearch = require("yt-search");
const axios = require("axios");

// Download history storage
const downloadHistory = new Map();
const userFavorites = new Map();

async function getStreamFromURL(url, pathName) {
    try {
        const response = await axios.get(url, { 
            responseType: "stream",
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://www.youtube.com/',
                'Accept': '*/*',
                'Accept-Language': 'en-US,en;q=0.9',
                'Connection': 'keep-alive'
            },
            timeout: 300000,
            maxRedirects: 5
        });
        response.data.path = pathName;
        return response.data;
    } catch (err) {
        if (err.response) {
            throw new Error(`HTTP ${err.response.status}`);
        } else if (err.request) {
            throw new Error("No response from server");
        } else {
            throw new Error(err.message);
        }
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

function formatNumber(num) {
    if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'B';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

function sendRegionalBlockedMessage(api, threadID, videoTitle, duration) {
    const message = `⚠️ | This content is regional blocked.\n\n📹 | ${videoTitle}\n⏱️ | ${duration}\n\n💌 | We are sorry we cannot provide all type of content some of them are regional blocked.`;
    api.sendMessage(message, threadID);
}

module.exports = {
  config: {
    name: "youtube",
    version: "3.0.0",
    author: "Aayusha (Ultimate Edition)",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "Ultimate YouTube downloader with advanced features",
    },
    longDescription: {
      en: "Search, download, trending, history, favorites, auto-download and more!",
    },
    category: "media",
    guide: {
      en: "🎵 | Commands:\n\n" +
          "📥 | DOWNLOAD:\n" +
          "youtube [song] music/video | Download\n" +
          "youtube [URL] music/video | Direct download\n" +
          "youtube auto [song] [type] | Auto-download first result\n\n" +
          "🔍 | SEARCH & INFO:\n" +
          "youtube [song] info | Get video details\n" +
          "youtube top [query] | Top 10 results\n" +
          "youtube trending | Today's trending videos\n" +
          "youtube channel [name] | Search channel\n\n" +
          "⭐ | FAVORITES:\n" +
          "youtube fav add [number] | Add to favorites (after search)\n" +
          "youtube fav list | Show your favorites\n" +
          "youtube fav download [number] | Download from favorites\n" +
          "youtube fav clear | Clear all favorites\n\n" +
          "📊 | HISTORY:\n" +
          "youtube history | Your download history\n" +
          "youtube history clear | Clear history\n\n" +
          "🎲 | FUN:\n" +
          "youtube random [genre] | Random video (music/gaming/funny)\n" +
          "youtube lyrics [song] | Get song lyrics\n" +
          "youtube compare [song1] vs [song2] | Compare views/stats"
    },
  },

  onStart: async function ({ api, args, message, event }) {
    const threadId = event.threadID;
    const senderId = event.senderID;

    if (args.length < 1)
      return message.reply("⚠️ | Use youtube help for all commands!\n\n🚀 | Quick start:\n• youtube faded music\n• youtube despacito video\n• youtube trending");

    const command = args[0].toLowerCase();

    // TRENDING COMMAND
    if (command === "trending") {
      return await this.handleTrending(api, message, event);
    }

    // HISTORY COMMAND
    if (command === "history") {
      if (args[1] === "clear") {
        downloadHistory.delete(senderId);
        return message.reply("✅ | Download history cleared!");
      }
      return await this.showHistory(api, message, event, senderId);
    }

    // FAVORITES COMMAND
    if (command === "fav" || command === "favorite") {
      return await this.handleFavorites(api, message, event, senderId, args.slice(1));
    }

    // RANDOM COMMAND
    if (command === "random") {
      const genre = args[1] || "music";
      return await this.handleRandom(api, message, event, genre);
    }

    // LYRICS COMMAND
    if (command === "lyrics") {
      const song = args.slice(1).join(" ");
      return await this.handleLyrics(api, message, event, song);
    }

    // COMPARE COMMAND
    if (command === "compare") {
      const compareText = args.slice(1).join(" ");
      if (!compareText.includes(" vs ")) {
        return message.reply("⚠️ | Format: youtube compare [song1] vs [song2]");
      }
      const [song1, song2] = compareText.split(" vs ");
      return await this.handleCompare(api, message, event, song1.trim(), song2.trim());
    }

    // CHANNEL SEARCH
    if (command === "channel") {
      const channelName = args.slice(1).join(" ");
      return await this.handleChannelSearch(api, message, event, channelName);
    }

    // AUTO DOWNLOAD (downloads first result automatically)
    if (command === "auto") {
      const type = args[args.length - 1].toLowerCase();
      if (type !== "music" && type !== "video") {
        return message.reply("⚠️ | Usage: youtube auto [song name] music/video");
      }
      const query = args.slice(1, -1).join(" ");
      return await this.handleAutoDownload(api, message, event, query, type, senderId);
    }

    // TOP SEARCH
    if (command === "top") {
      const query = args.slice(1).join(" ");
      if (!query) return message.reply("⚠️ | Usage: youtube top [search query]");
      return await this.handleTopSearch(api, message, event, query);
    }

    // Direct URL check
    const isURL = args[0].includes("youtube.com") || args[0].includes("youtu.be");
    const lastArg = args[args.length - 1].toLowerCase();

    if (isURL) {
      const type = lastArg === "music" || lastArg === "video" ? lastArg : "video";
      const videoId = getVideoID(args[0]);
      if (!videoId) return message.reply("❌ | Invalid YouTube URL!");

      await message.reply(`⏬ | Processing direct download...`);
      return await this.downloadDirect(api, message, event, args[0], type, senderId);
    }

    // INFO REQUEST
    if (lastArg === "info") {
      const query = args.slice(0, -1).join(" ");
      return await this.handleInfoRequest(api, message, event, query);
    }

    // NORMAL SEARCH & DOWNLOAD
    const type = lastArg;
    if (type !== "music" && type !== "video")
      return message.reply("❌ | Type must be 'music' or 'video'\n\n💡 | Example: youtube faded music");

    const songName = args.slice(0, -1).join(" ");
    if (!songName) return message.reply("⚠️ | Please provide a song name!");

    await message.reply(`🔍 | Searching: ${songName}`);

    try {
      const searchResults = await ytSearch(songName);
      if (!searchResults.videos.length)
        return message.reply("❗ | No results found.");

      const top5 = searchResults.videos.slice(0, 5);
      const thumbnailsDir = path.join(__dirname, "cache", "thumbnails");

      if (!fs.existsSync(thumbnailsDir)) fs.mkdirSync(thumbnailsDir, { recursive: true });

      const thumbs = [];
      for (let i = 0; i < top5.length; i++) {
        const thumbPath = path.join(thumbnailsDir, `thumb_${i}_${Date.now()}.png`);
        await downloadFile(top5[i].thumbnail, thumbPath);
        thumbs.push(thumbPath);
      }

      let body = "🎵 | Search Results:\n\n";
      top5.forEach((video, i) => {
        const views = formatNumber(video.views);
        body += `${i + 1}. ${video.title}\n`;
        body += `   👤 | ${video.author.name}\n`;
        body += `   ⏱️ | ${video.timestamp} | 👁️ ${views}\n`;
        body += `   📅 | ${video.ago}\n\n`;
      });
      body += "↩️ | Reply 1-5 to download\n";
      body += "⭐ | Reply 'fav [number]' to add to favorites";

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
          type: type,
          mode: "download"
        });

        setTimeout(() => {
          thumbs.forEach(p => fs.existsSync(p) && fs.unlinkSync(p));
        }, 10000);
      });

    } catch (err) {
      console.log("Search error:", err);
      return message.reply("❗ | Search failed. Try again later.");
    }
  },

  handleTrending: async function (api, message, event) {
    await message.reply("🔥 | Fetching today's trending videos...");

    try {
      const trending = await ytSearch({ query: "trending music", pageStart: 1, pageEnd: 1 });
      const videos = trending.videos.slice(0, 8);

      let body = "🔥 | TRENDING TODAY:\n\n";
      videos.forEach((video, i) => {
        body += `${i + 1}. ${video.title}\n`;
        body += `   👤 | ${video.author.name}\n`;
        body += `   👁️ | ${formatNumber(video.views)} views\n`;
        body += `   🔗 | ${video.url}\n\n`;
      });

      return message.reply(body);
    } catch (err) {
      return message.reply("❗ | Failed to fetch trending videos.");
    }
  },

  handleAutoDownload: async function (api, message, event, query, type, senderId) {
    await message.reply(`⚡ | Auto-downloading first result for: ${query}`);

    try {
      const searchResults = await ytSearch(query);
      if (!searchResults.videos.length)
        return message.reply("❗ | No results found.");

      const video = searchResults.videos[0];
      await message.reply(`🎵 | Found: ${video.title}\n⏬ | Downloading...`);

      return await this.performDownload(api, event, video, type, senderId);
    } catch (err) {
      return message.reply("❗ | Auto-download failed.");
    }
  },

  handleRandom: async function (api, message, event, genre) {
    const queries = {
      music: ["pop music", "rock music", "rap music", "edm music"],
      gaming: ["gaming moments", "funny gaming", "gaming highlights"],
      funny: ["funny videos", "comedy", "memes", "funny moments"],
      default: ["trending videos", "popular videos", "viral videos"]
    };

    const searchQueries = queries[genre] || queries.default;
    const randomQuery = searchQueries[Math.floor(Math.random() * searchQueries.length)];

    await message.reply(`🎲 | Finding random ${genre} video...`);

    try {
      const results = await ytSearch(randomQuery);
      if (!results.videos.length) return message.reply("❗ | No videos found.");

      const randomVideo = results.videos[Math.floor(Math.random() * Math.min(20, results.videos.length))];

      let info = `🎲 | Random Video:\n\n`;
      info += `🎬 | ${randomVideo.title}\n`;
      info += `👤 | ${randomVideo.author.name}\n`;
      info += `⏱️ | ${randomVideo.timestamp}\n`;
      info += `👁️ | ${formatNumber(randomVideo.views)} views\n`;
      info += `🔗 | ${randomVideo.url}\n\n`;
      info += `💬 | Reply "yes" to download!`;

      global.GoatBot.onReply.set(Date.now().toString(), {
        commandName: this.config.name,
        author: event.senderID,
        video: randomVideo,
        mode: "random_confirm"
      });

      return message.reply(info);
    } catch (err) {
      return message.reply("❗ | Random search failed.");
    }
  },

  handleLyrics: async function (api, message, event, song) {
    if (!song) return message.reply("⚠️ | Usage: youtube lyrics [song name]");

    await message.reply(`🎤 | Searching lyrics for: ${song}...`);

    try {
      // Search for lyrics video
      const results = await ytSearch(`${song} lyrics`);
      if (!results.videos.length) return message.reply("❗ | No lyrics video found.");

      const lyricsVideo = results.videos[0];

      let info = `🎤 | Lyrics Video Found:\n\n`;
      info += `🎵 | ${lyricsVideo.title}\n`;
      info += `👤 | ${lyricsVideo.author.name}\n`;
      info += `⏱️ | ${lyricsVideo.timestamp}\n`;
      info += `🔗 | ${lyricsVideo.url}\n\n`;
      info += `💡 | Watch the video for full lyrics!`;

      return message.reply(info);
    } catch (err) {
      return message.reply("❗ | Lyrics search failed.");
    }
  },

  handleCompare: async function (api, message, event, song1, song2) {
    await message.reply(`⚖️ | Comparing:\n"${song1}" vs "${song2}"`);

    try {
      const [result1, result2] = await Promise.all([
        ytSearch(song1),
        ytSearch(song2)
      ]);

      if (!result1.videos.length || !result2.videos.length) {
        return message.reply("❗ | One or both songs not found.");
      }

      const video1 = result1.videos[0];
      const video2 = result2.videos[0];

      let comparison = `⚖️ | COMPARISON:\n\n`;
      comparison += `🔴 ${video1.title}\n`;
      comparison += `   👁️ | ${formatNumber(video1.views)} views\n`;
      comparison += `   ⏱️ | ${video1.timestamp}\n`;
      comparison += `   📅 | ${video1.ago}\n\n`;
      comparison += `VS\n\n`;
      comparison += `🔵 ${video2.title}\n`;
      comparison += `   👁️ | ${formatNumber(video2.views)} views\n`;
      comparison += `   ⏱️ | ${video2.timestamp}\n`;
      comparison += `   📅 | ${video2.ago}\n\n`;

      const winner = video1.views > video2.views ? "🔴 Video 1" : "🔵 Video 2";
      comparison += `🏆 | Winner (by views): ${winner}`;

      return message.reply(comparison);
    } catch (err) {
      return message.reply("❗ | Comparison failed.");
    }
  },

  handleChannelSearch: async function (api, message, event, channelName) {
    if (!channelName) return message.reply("⚠️ | Usage: youtube channel [channel name]");

    await message.reply(`🔍 | Searching channel: ${channelName}`);

    try {
      const results = await ytSearch({ query: channelName, pageStart: 1, pageEnd: 1 });
      const channels = results.videos.filter(v => v.author.name.toLowerCase().includes(channelName.toLowerCase()));

      if (!channels.length) return message.reply("❗ | Channel not found.");

      const uniqueChannels = [...new Map(channels.map(v => [v.author.name, v])).values()];
      const topVideos = uniqueChannels.slice(0, 5);

      let body = `📺 | Channel Results:\n\n`;
      topVideos.forEach((video, i) => {
        body += `${i + 1}. ${video.title}\n`;
        body += `   👤 | ${video.author.name}\n`;
        body += `   👁️ | ${formatNumber(video.views)}\n\n`;
      });

      return message.reply(body);
    } catch (err) {
      return message.reply("❗ | Channel search failed.");
    }
  },

  handleFavorites: async function (api, message, event, senderId, args) {
    if (!args.length || args[0] === "list") {
      const favorites = userFavorites.get(senderId) || [];
      if (!favorites.length) {
        return message.reply("⭐ | You have no favorites yet!\n\n💡 | After searching, reply 'fav [number]' to add.");
      }

      let body = "⭐ | YOUR FAVORITES:\n\n";
      favorites.forEach((fav, i) => {
        body += `${i + 1}. ${fav.title}\n`;
        body += `   👤 | ${fav.author.name}\n`;
        body += `   👁️ | ${formatNumber(fav.views)}\n\n`;
      });
      body += `\n💬 | Use: youtube fav download [number] to download`;

      return message.reply(body);
    }

    if (args[0] === "clear") {
      userFavorites.delete(senderId);
      return message.reply("✅ | All favorites cleared!");
    }

    if (args[0] === "download") {
      const favIndex = parseInt(args[1]) - 1;
      const favorites = userFavorites.get(senderId) || [];

      if (isNaN(favIndex) || favIndex < 0 || favIndex >= favorites.length) {
        return message.reply("❌ | Invalid favorite number!");
      }

      const video = favorites[favIndex];
      await message.reply(`⏬ | Downloading from favorites:\n${video.title}`);

      // Ask for type
      let typeMsg = "💬 | Choose download type:\n1. Music (MP3)\n2. Video (MP4)\n\n↩️ | Reply 1 or 2";

      api.sendMessage(typeMsg, event.threadID, (err, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: this.config.name,
          author: senderId,
          video: video,
          mode: "favorite_download"
        });
      });

      return;
    }

    return message.reply("⚠️ | Usage:\nyoutube fav list | Show favorites\nyoutube fav download [number]\nyoutube fav clear");
  },

  showHistory: async function (api, message, event, senderId) {
    const history = downloadHistory.get(senderId) || [];

    if (!history.length) {
      return message.reply("📊 | No download history yet!");
    }

    let body = "📊 | YOUR DOWNLOAD HISTORY:\n\n";
    history.slice(-10).reverse().forEach((item, i) => {
      body += `${i + 1}. ${item.title}\n`;
      body += `   📥 | ${item.type.toUpperCase()}\n`;
      body += `   ⏰ | ${item.time}\n\n`;
    });

    return message.reply(body);
  },

  handleTopSearch: async function (api, message, event, query) {
    await message.reply(`🔍 | Top 10 results for: ${query}`);

    try {
      const searchResults = await ytSearch(query);
      if (!searchResults.videos.length)
        return message.reply("❗ | No results found.");

      const top10 = searchResults.videos.slice(0, 10);

      let body = "🏆 | TOP 10 RESULTS:\n\n";
      top10.forEach((video, i) => {
        body += `${i + 1}. ${video.title}\n`;
        body += `   👤 | ${video.author.name}\n`;
        body += `   👁️ | ${formatNumber(video.views)}\n`;
        body += `   🔗 | ${video.url}\n\n`;
      });

      return message.reply(body);
    } catch (err) {
      return message.reply("❗ | Search failed.");
    }
  },

  handleInfoRequest: async function (api, message, event, query) {
    try {
      const searchResults = await ytSearch(query);
      if (!searchResults.videos.length)
        return message.reply("❗ | No results found.");

      const video = searchResults.videos[0];
      const thumbnailPath = path.join(__dirname, "cache", `info_${Date.now()}.png`);
      await downloadFile(video.thumbnail, thumbnailPath);

      let info = `📊 | VIDEO INFO:\n\n`;
      info += `🎬 | ${video.title}\n`;
      info += `👤 | ${video.author.name}\n`;
      info += `⏱️ | ${video.timestamp}\n`;
      info += `👁️ | ${formatNumber(video.views)} views\n`;
      info += `📅 | ${video.ago}\n`;
      info += `🔗 | ${video.url}\n`;
      info += `📝 | ${video.description.substring(0, 150)}...`;

      api.sendMessage({
        body: info,
        attachment: fs.createReadStream(thumbnailPath)
      }, event.threadID, () => {
        setTimeout(() => {
          if (fs.existsSync(thumbnailPath)) fs.unlinkSync(thumbnailPath);
        }, 5000);
      });

    } catch (err) {
      return message.reply("❗ | Failed to get info.");
    }
  },

  downloadDirect: async function (api, message, event, videoUrl, type, senderId) {
    try {
      const videoId = getVideoID(videoUrl);
      const videoInfo = await ytSearch({ videoId });
      const video = videoInfo;

      return await this.performDownload(api, event, video, type, senderId);

    } catch (err) {
      console.error("Direct download error:", err);
      api.sendMessage(`❌ | Download failed: ${err.message}`, event.threadID);
    }
  },

  performDownload: async function (api, event, video, type, senderId) {
    const videoUrl = video.url;

    try {
      let apiUrl;
      let fileExtension;
      let downloadUrl;
      let quality;

if (type === "music") {
        apiUrl = `http://api.hutchingd.x10.mx/api/dl%2Fytmp3.php?url=${encodeURIComponent(videoUrl)}`;
        fileExtension = "mp3";

        const { data } = await axios.get(apiUrl, { timeout: 120000 });
        if (!data.download) throw new Error("Download URL not found.");

        downloadUrl = data.download;

      } else {
        apiUrl = `http://api.hutchingd.x10.mx/api/dl%2Fyt.php?yt_url=${encodeURIComponent(videoUrl)}`;
        fileExtension = "mp4";

        const { data } = await axios.get(apiUrl, { timeout: 120000 });
        if (!data.success || !data.formats || data.formats.length === 0) {
          throw new Error("Video formats not found.");
        }

        const formatPriority = [
          { quality: "360p", type: "Video + Audio (Direct)" },
          { quality: "480p", type: "Video + Audio (Direct)" },
          { quality: "240p", type: "Video + Audio (Direct)" }
        ];

        let selectedFormat = null;
        for (const priority of formatPriority) {
          selectedFormat = data.formats.find(f => f.quality === priority.quality && f.type === priority.type);
          if (selectedFormat) break;
        }

        if (!selectedFormat) selectedFormat = data.formats[0];
        if (!selectedFormat) throw new Error("No format available.");

        downloadUrl = selectedFormat.url;
        quality = selectedFormat.quality;
      }

      // Save to history
      const userHistory = downloadHistory.get(senderId) || [];
      userHistory.push({
        title: video.title,
        type: type,
        time: new Date().toLocaleString()
      });
      if (userHistory.length > 20) userHistory.shift();
      downloadHistory.set(senderId, userHistory);

      await api.sendMessage({
        body: `✅ | ${video.title}${quality ? `\n📺 | Quality: ${quality}` : ''}\n👤 | Author: ${video.author.name}\n⏱️ | Duration: ${video.timestamp}\n👁️ | Views: ${formatNumber(video.views)}`,
        attachment: await global.utils.getStreamFromURL(downloadUrl, `${video.title}.${fileExtension}`)
      }, event.threadID);

    } catch (err) {
      console.error("Download error:", err);
      
      // Send regional blocked message for any download error
      sendRegionalBlockedMessage(api, event.threadID, video.title, video.timestamp);
    }
  },

  onReply: async function ({ api, event, message, Reply }) {
    const { threadID, messageID, senderID, body } = event;

    if (senderID !== Reply.author)
      return api.sendMessage("⚠️ | Only the searcher can reply.", threadID, messageID);

    // Handle favorite download type selection
    if (Reply.mode === "favorite_download") {
      const choice = parseInt(body);
      if (choice === 1 || choice === 2) {
        const type = choice === 1 ? "music" : "video";
        await api.sendMessage(`⏬ | Downloading...`, threadID);
        return await this.performDownload(api, event, Reply.video, type, senderID);
      }
      return api.sendMessage("❌ | Reply 1 or 2", threadID);
    }

    // Handle favorite add
    if (body.toLowerCase().startsWith("fav")) {
      const favNum = parseInt(body.split(" ")[1]) - 1;

      if (isNaN(favNum) || favNum < 0 || favNum >= Reply.results.length) {
        return api.sendMessage("❌ | Invalid number!", threadID);
      }

      const video = Reply.results[favNum];
      const favorites = userFavorites.get(senderID) || [];

      // Check if already in favorites
      if (favorites.some(fav => fav.url === video.url)) {
        return api.sendMessage("⭐ | Already in your favorites!", threadID);
      }

      favorites.push(video);
      userFavorites.set(senderID, favorites);

      return api.sendMessage(`⭐ | Added to favorites!\n${video.title}\n\n💬 | View: youtube fav list`, threadID);
    }

    // Normal download
    const choice = parseInt(body);
    if (isNaN(choice) || choice < 1 || choice > Reply.results.length)
      return api.sendMessage("❌ | Invalid number. Reply 1-5.", threadID, messageID);

    const selected = Reply.results[choice - 1];
    await api.sendMessage(`⏬ | Downloading: ${selected.title}`, threadID);

    return await this.performDownload(api, event, selected, Reply.type, senderID);
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
        }
      }

      if (res.statusCode !== 200) {
        file.close();
        fs.unlinkSync(filePath);
        return reject(new Error(`HTTP ${res.statusCode}`));
      }

      res.pipe(file);

      file.on("finish", () => {
        file.close(() => {
          if (fs.existsSync(filePath) && fs.statSync(filePath).size > 0) {
            resolve();
          } else {
            fs.unlinkSync(filePath);
            reject(new Error("File empty"));
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
      reject(new Error("Timeout"));
    });
  });
}
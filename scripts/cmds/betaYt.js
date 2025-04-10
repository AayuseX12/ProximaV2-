const fs = require("fs");
const path = require("path");
const ytSearch = require("yt-search");
const axios = require("axios");
const https = require("https");
const http = require("http");
const { promisify } = require("util");
const stream = require("stream");
const pipeline = promisify(stream.pipeline);

module.exports = {
  config: {
    name: "beta",
    version: "2.0.0",
    author: "aayuse",
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

    if (args.length < 2) {
      return message.reply("⚠️ Usage: #youtube [search query] [music/video]");
    }

    const type = args.pop().toLowerCase();
    const searchQuery = args.join(" ");

    if (type !== "music" && type !== "video") {
      return message.reply("❌ Type must be 'music' or 'video'");
    }

    const statusMessage = await message.reply(`🔍 Searching for: "${searchQuery}" | Type: ${type.toUpperCase()}`);

    try {
      // Search for videos
      const searchResults = await ytSearch(searchQuery);
      if (!searchResults.videos.length) {
        return message.reply("❗ No results found for your search query");
      }

      // Get top 5 results
      const top5 = searchResults.videos.slice(0, 5);
      
      // Create directory for thumbnails if it doesn't exist
      const cacheDir = path.join(__dirname, "cache");
      const thumbnailsDir = path.join(cacheDir, "thumbnails");
      
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }
      
      if (!fs.existsSync(thumbnailsDir)) {
        fs.mkdirSync(thumbnailsDir, { recursive: true });
      }

      // Download thumbnails
      const thumbPromises = top5.map(async (video, index) => {
        const thumbFilename = `thumb_${index}_${Date.now()}.jpg`;
        const thumbPath = path.join(thumbnailsDir, thumbFilename);
        await downloadFile(video.thumbnail, thumbPath);
        return thumbPath;
      });

      const thumbnailPaths = await Promise.all(thumbPromises);

      // Create results message
      let resultMessage = "🎬 Top 5 YouTube Results:\n\n";
      top5.forEach((video, i) => {
        resultMessage += `${i + 1}. ${video.title}\n`;
        resultMessage += `⏱️ ${video.timestamp} | 👁️ ${video.views.toLocaleString()} views\n`;
        resultMessage += `👤 ${video.author.name}\n\n`;
      });
      resultMessage += "↩️ Reply with a number from 1-5 to download";

      // Send results with thumbnails
      api.sendMessage(
        {
          body: resultMessage,
          attachment: thumbnailPaths.map(p => fs.createReadStream(p)),
        },
        threadId,
        (err, info) => {
          if (err) {
            console.error("Error sending results:", err);
            return message.reply("❌ Error displaying search results");
          }

          // Set up reply listener
          global.GoatBot.onReply.set(info.messageID, {
            commandName: this.config.name,
            messageID: info.messageID,
            author: senderId,
            videos: top5,
            type: type
          });

          // Clean up thumbnail files after 30 seconds
          setTimeout(() => {
            thumbnailPaths.forEach(p => {
              if (fs.existsSync(p)) {
                fs.unlinkSync(p);
              }
            });
          }, 30000);
        }
      );
    } catch (error) {
      console.error("YouTube search error:", error);
      return message.reply(`❌ Search failed: ${error.message}`);
    }
  },

  onReply: async function ({ api, event, message, Reply }) {
    const { threadID, messageID, senderID, body } = event;

    // Verify this is the original searcher
    if (senderID !== Reply.author) {
      return api.sendMessage(
        "⚠️ Only the person who initiated the search can select a video to download",
        threadID,
        messageID
      );
    }

    // Parse user's choice
    const choice = parseInt(body.trim());
    if (isNaN(choice) || choice < 1 || choice > Reply.videos.length) {
      return api.sendMessage(
        "❌ Please reply with a valid number between 1-5",
        threadID,
        messageID
      );
    }

    // Get selected video
    const selectedVideo = Reply.videos[choice - 1];
    const videoId = selectedVideo.videoId;
    const isMusic = Reply.type === "music";
    
    // Send download status message
    await api.sendMessage(
      `⏳ Downloading: "${selectedVideo.title}"...`,
      threadID
    );

    try {
      // Download the file
      const downloadResult = await downloadYouTubeContent(videoId, isMusic);
      const filePath = downloadResult.filePath;
      const stats = fs.statSync(filePath);
      const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

      // Send the downloaded file
      await api.sendMessage(
        {
          body: `✅ Download complete!\n\n🎬 ${selectedVideo.title}\n⏱️ ${selectedVideo.timestamp}\n📊 ${selectedVideo.views.toLocaleString()} views\n💾 ${fileSizeMB} MB`,
          attachment: fs.createReadStream(filePath),
        },
        threadID,
        null,
        () => {
          // Clean up file after sending
          setTimeout(() => {
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          }, 60000); // Delete after 1 minute
        }
      );
    } catch (error) {
      console.error("Download error:", error);
      return api.sendMessage(
        `❌ Download failed: ${error.message}\n\nPlease try again later or try a different video`,
        threadID
      );
    }
  },
};

/**
 * Downloads a YouTube video or extracts audio
 * @param {string} videoId - The YouTube video ID
 * @param {boolean} isMusic - Whether to download as audio
 * @returns {Promise<{filePath: string}>} - Path to downloaded file
 */
async function downloadYouTubeContent(videoId, isMusic) {
  // Define API endpoints (multiple fallbacks)
  const apiEndpoints = [
    {
      url: `https://y2mate.guru/api/convert?id=${videoId}&format=${isMusic ? 'mp3' : 'mp4'}`,
      extractUrl: (data) => data?.url,
    },
    {
      url: `https://co.wuk.sh/api/json?url=https://youtu.be/${videoId}&aFormat=${isMusic ? 'mp3' : null}&vFormat=${!isMusic ? 'auto' : null}`,
      extractUrl: (data) => data?.url,
    },
    {
      url: `https://api.vevioz.com/api/button/${isMusic ? 'mp3' : 'mp4'}/https://www.youtube.com/watch?v=${videoId}`,
      extractUrl: (data) => {
        const urlMatch = data.match(/href="([^"]+)">Download/);
        return urlMatch ? urlMatch[1] : null;
      },
      isHtml: true,
    }
  ];

  // Create cache directory if it doesn't exist
  const cacheDir = path.join(__dirname, "cache");
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }

  // Generate filename
  const timestamp = Date.now();
  const extension = isMusic ? "mp3" : "mp4";
  const filename = `yt_${videoId}_${timestamp}.${extension}`;
  const filePath = path.join(cacheDir, filename);

  // Try each API endpoint until one succeeds
  let downloadUrl = null;
  let lastError = null;

  for (const endpoint of apiEndpoints) {
    try {
      console.log(`Trying API endpoint: ${endpoint.url}`);
      
      const response = await axios.get(endpoint.url, {
        timeout: 20000,
        responseType: endpoint.isHtml ? 'text' : 'json'
      });
      
      downloadUrl = endpoint.extractUrl(response.data);
      
      if (downloadUrl) {
        console.log(`Got download URL from API: ${downloadUrl}`);
        break;
      }
    } catch (error) {
      console.log(`API endpoint failed: ${error.message}`);
      lastError = error;
    }
  }

  // If no API worked, try using youtube-dl-exec if available
  if (!downloadUrl) {
    try {
      // This is just a placeholder for youtube-dl integration
      // Actual implementation would require youtube-dl-exec package
      throw new Error("All API endpoints failed");
    } catch (error) {
      throw new Error(`Failed to get download URL: ${lastError?.message || error.message}`);
    }
  }

  // Download the file
  try {
    await downloadFile(downloadUrl, filePath);
    
    // Verify file exists and has content
    if (!fs.existsSync(filePath)) {
      throw new Error("Downloaded file does not exist");
    }
    
    const stats = fs.statSync(filePath);
    if (stats.size < 10000) { // Less than 10KB
      fs.unlinkSync(filePath);
      throw new Error("Downloaded file is too small, likely corrupted");
    }
    
    return { filePath };
  } catch (error) {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    throw new Error(`File download failed: ${error.message}`);
  }
}

/**
 * Downloads a file from a URL to a local path
 * @param {string} url - File URL
 * @param {string} filePath - Destination path
 * @returns {Promise<void>}
 */
async function downloadFile(url, filePath) {
  return new Promise((resolve, reject) => {
    // Create directory if it doesn't exist
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Select http or https module based on URL
    const protocolModule = url.startsWith('https:') ? https : http;
    
    const fileStream = fs.createWriteStream(filePath);
    let redirectCount = 0;
    const maxRedirects = 5;

    const downloadWithRedirects = (currentUrl) => {
      const request = protocolModule.get(currentUrl, (response) => {
        // Handle redirects
        if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 307) {
          fileStream.close();
          
          if (redirectCount >= maxRedirects) {
            fs.unlinkSync(filePath);
            return reject(new Error("Too many redirects"));
          }
          
          redirectCount++;
          
          if (response.headers.location) {
            return downloadWithRedirects(response.headers.location);
          } else {
            fs.unlinkSync(filePath);
            return reject(new Error("Redirect without location header"));
          }
        }

        // Handle other errors
        if (response.statusCode !== 200) {
          fileStream.close();
          fs.unlinkSync(filePath);
          return reject(new Error(`Server responded with status code: ${response.statusCode}`));
        }

        // Pipe the response to the file
        response.pipe(fileStream);

        // Handle file completion
        fileStream.on("finish", () => {
          fileStream.close();
          resolve();
        });

        // Handle download errors
        response.on("error", (err) => {
          fileStream.close();
          fs.unlinkSync(filePath);
          reject(err);
        });
      });

      // Set timeout (60 seconds)
      request.setTimeout(60000, () => {
        request.destroy();
        fileStream.close();
        fs.unlinkSync(filePath);
        reject(new Error("Download request timed out"));
      });

      // Handle request errors
      request.on("error", (err) => {
        fileStream.close();
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        reject(err);
      });
    };

    // Start download
    downloadWithRedirects(url);
  });
}
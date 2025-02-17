const fs = require("fs");
const path = require("path");
const ytSearch = require("yt-search");
const { exec } = require("child_process");

module.exports = {
  config: {
    name: "video",
    version: "1.1.0",
    author: "Aayusha",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "Download YouTube video from keyword or link",
    },
    longDescription: {
      en: "Search and download videos from YouTube based on the given keyword or link.",
    },
    category: "media",
    guide: {
      en: "{pn} [videoName]\n\nThis command always downloads and sends videos.",
    },
  },

  onStart: async function ({ args, message }) {
    const videoName = args.join(" ");
    if (!videoName) return message.reply("❌ Please provide a video name or keyword!");

    // Notify user that the process has started
    await message.reply("✅ Searching for the video on YouTube...");

    try {
      // Search for the video on YouTube
      const searchResults = await ytSearch(videoName);
      if (!searchResults || !searchResults.videos.length) {
        throw new Error("No results found for your search query.");
      }

      // Get the top result from the search
      const topResult = searchResults.videos[0];
      const videoId = topResult.videoId;
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

      // Set the filename based on the video title
      const safeTitle = topResult.title.replace(/[^a-zA-Z0-9 \-_]/g, ""); // Clean the title
      const filename = `${safeTitle}.mp4`;
      const downloadDir = path.join(__dirname, "cache");
      const downloadPath = path.join(downloadDir, filename);

      // Ensure the directory exists
      if (!fs.existsSync(downloadDir)) {
        fs.mkdirSync(downloadDir, { recursive: true });
      }

      // Notify user about the download process
      await message.reply(`⏳ Downloading **${topResult.title}**... Please wait!`);

      // Execute yt-dlp to download the video
      exec(`yt-dlp -o "${downloadPath}" ${videoUrl}`, async (error, stdout, stderr) => {
        if (error) {
          console.error(`Error downloading video: ${error.message}`);
          return message.reply("❌ Failed to download the video.");
        }

        // Send the downloaded video file to the user
        await message.reply({
          attachment: fs.createReadStream(downloadPath),
          body: `🎥 Here is your video: **${topResult.title}**`,
        });

        // Cleanup the downloaded file
        fs.unlinkSync(downloadPath);
      });
    } catch (error) {
      console.error(`Error: ${error.message}`);
      message.reply(`❌ Failed to download video: ${error.message}`);
    }
  },
};

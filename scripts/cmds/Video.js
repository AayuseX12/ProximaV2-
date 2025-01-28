const fs = require("fs");
const path = require("path");
const ytSearch = require("yt-search");
const axios = require("axios");
const https = require("https");

module.exports = {
  config: {
    name: "video",
    version: "1.0.3",
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

  onStart: async function ({ args, message, api }) {
    const videoName = args.join(" ");
    if (!videoName) return message.reply("❌ Please provide a video name or keyword!");

    // Notify user that the process has started
    await message.reply("✅ WAIT JADAIXU YOUTUBE TIRA TMLE VANEKO VIDEO KHOJNA");

    try {
      // Search for the video on YouTube
      const searchResults = await ytSearch(videoName);
      if (!searchResults || !searchResults.videos.length) {
        throw new Error("No results found for your search query.");
      }

      // Get the top result from the search
      const topResult = searchResults.videos[0];
      const videoId = topResult.videoId;

      // Construct API URL for downloading the top result
      const apiKey = "priyansh-here";
      const apiUrl = `https://priyansh-ai.onrender.com/youtube?id=${videoId}&type=video&apikey=${apiKey}`;

      // Get the direct download URL from the API
      const downloadResponse = await axios.get(apiUrl);
      const downloadUrl = downloadResponse.data.downloadUrl;

      // Set the filename based on the video title
      const safeTitle = topResult.title.replace(/[^a-zA-Z0-9 \-_]/g, ""); // Clean the title
      const filename = `${safeTitle}.mp4`;
      const downloadDir = path.join(__dirname, "cache");
      const downloadPath = path.join(downloadDir, filename);

      // Ensure the directory exists
      if (!fs.existsSync(downloadDir)) {
        fs.mkdirSync(downloadDir, { recursive: true });
      }

      // Download the video file and save locally
      const file = fs.createWriteStream(downloadPath);

      await new Promise((resolve, reject) => {
        https.get(downloadUrl, (response) => {
          if (response.statusCode === 200) {
            response.pipe(file);
            file.on("finish", () => {
              file.close(resolve);
            });
          } else {
            reject(
              new Error(`Failed to download file. Status code: ${response.statusCode}`)
            );
          }
        }).on("error", (error) => {
          fs.unlinkSync(downloadPath);
          reject(new Error(`Error downloading file: ${error.message}`));
        });
      });

      // Send the downloaded video file to the user
      await message.reply({
        attachment: fs.createReadStream(downloadPath),
        body: `🎥 Title: ${topResult.title}:`,
      });

      // Cleanup the downloaded file
      fs.unlinkSync(downloadPath);
    } catch (error) {
      console.error(`Failed to download and send video: ${error.message}`);
      message.reply(`❌ Failed to download video: ${error.message}`);
    }
  },
};

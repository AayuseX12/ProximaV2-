const axios = require('axios');
const fs = require('fs-extra');
const googlethis = require('googlethis');
const cloudscraper = require('cloudscraper');
const path = require('path');

module.exports = {
  config: {
    name: "googleimg",
    aliases: ["imgs", "searchimg"],
    version: "2.0.0",
    author: "Aayusha Shrestha",
    countDown: 5,
    role: 0,
    shortDescription: {
      vi: "Tìm kiếm hình ảnh",
      en: "Search for images"
    },
    longDescription: {
      vi: "Tìm kiếm hình ảnh trên Google",
      en: "Search for images on Google"
    },
    category: "image",
    guide: {
      vi: "   {pn} <từ khóa tìm kiếm>",
      en: "   {pn} <search keyword>"
    }
  },

  langs: {
    vi: {
      processing: "🔍 Đang tìm kiếm và tải xuống hình ảnh cho: %1",
      noResult: "⚠️ Không tìm thấy kết quả nào cho từ khóa này.",
      resultMessage: "🖼️ 𝗜𝗺𝗮𝗴𝗲 𝗦𝗲𝗮𝗿𝗰𝗵 𝗥𝗲𝘀𝘂𝗹𝘁𝘀\n\n🔍 Query: \"%1\"\n📊 Found: %2 images\n📤 Showing: %3 images",
      error: "⚠️ Đã xảy ra lỗi: %1"
    },
    en: {
      processing: "🔍 Searching For: %1",
      noResult: "⚠️ Your image search did not return any result.",
      resultMessage: "🖼️ 𝗜𝗺𝗮𝗴𝗲 𝗦𝗲𝗮𝗿𝗰𝗵 𝗥𝗲𝘀𝘂𝗹𝘁𝘀\n\n🔍 Query: \"%1\"\n📊 Found: %2 images\n📤 Showing: %3 images",
      error: "⚠️ Error: %1"
    }
  },

  onStart: async function ({ args, message, event, getLang }) {
    try {
      // Get query from args or reply message
      let query;
      if (event.messageReply && event.messageReply.body) {
        query = event.messageReply.body;
      } else {
        query = args.join(" ");
      }

      if (!query) {
        return message.reply("Please provide a search keyword or reply to a message with search terms.");
      }

      // React with loading emoji
      await message.reaction("🕘");

      // Send single processing message
      const processingMsg = await message.reply(getLang("processing", query));

      // Search for images
      let result = await googlethis.image(query, { safe: false });
      
      if (result.length === 0) {
        return message.reply(getLang("noResult"));
      }

      let streams = [];
      let counter = 0;
      const cacheDir = path.join(__dirname, "cache");
      
      // Ensure cache directory exists
      await fs.ensureDir(cacheDir);

      console.log(`Found ${result.length} images`);

      for (let image of result) {
        // Only show 6 images
        if (counter >= 6) break;

        console.log(`${counter}: ${image.url}`);

        // Filter for jpg and png images only
        let url = image.url;
        if (!url.endsWith(".jpg") && !url.endsWith(".png") && 
            !url.endsWith(".jpeg") && !url.endsWith(".webp")) {
          continue;
        }

        let imagePath = path.join(cacheDir, `search-image-${Date.now()}-${counter}.jpg`);
        let hasError = false;

        try {
          const buffer = await cloudscraper.get({
            uri: url,
            encoding: null,
            timeout: 10000
          });
          
          await fs.writeFile(imagePath, buffer);
          
          console.log(`Downloaded: ${imagePath}`);
          
          streams.push(fs.createReadStream(imagePath).on("end", async () => {
            try {
              if (await fs.pathExists(imagePath)) {
                await fs.unlink(imagePath);
                console.log(`Deleted file: ${imagePath}`);
              }
            } catch (err) {
              console.log(`Error deleting file: ${err}`);
            }
          }));

          counter += 1;
        } catch (error) {
          console.log(`Error downloading image: ${error}`);
          hasError = true;
          continue;
        }
      }

      if (streams.length === 0) {
        return message.reply("⚠️ Could not download any images. Please try a different search term.");
      }

      // Prepare result message with actual count of downloaded images
      const resultText = getLang("resultMessage", 
        query, 
        result.length, 
        streams.length
      );

      // Send images with result message
      const sentMessage = await message.reply({
        body: resultText,
        attachment: streams
      });

      // React with success emoji
      await message.reaction("✅");

      return sentMessage;

    } catch (error) {
      console.log("Image search error:", error);
      return message.reply(getLang("error", error.message));
    }
  }
};
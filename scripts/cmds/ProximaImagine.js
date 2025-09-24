const fs = require('fs-extra');
const axios = require('axios');

module.exports = {
  config: {
    name: "",
    version: "1.0.0",
    author: "Aayusha Shrestha",
    countDown: 2,
    role: 0,
    shortDescription: {
      vi: "Tạo hình ảnh từ văn bản",
      en: "Generate image from text"
    },
    longDescription: {
      vi: "Tạo hình ảnh từ mô tả văn bản sử dụng Pollinations AI",
      en: "Generate image from text description using Pollinations AI"
    },
    category: "image",
    guide: {
      vi: "{pn} <mô tả hình ảnh>",
      en: "{pn} <image description>"
    }
  },

  onStart: async function({ message, args, event }) {
    const { threadID, messageID } = event;
    const query = args.join(" ");
    
    if (!query) {
      return message.reply("❌ Please provide a text/query to generate image.");
    }

    try {
      // Send loading message
      const loadingMsg = await message.reply("🕘 |Generating Your Thought.");
      
      const path = `${__dirname}/cache/poli_${Date.now()}.png`;
      
      // Fetch image from Pollinations AI
      const response = await axios.get(`https://image.pollinations.ai/prompt/${encodeURIComponent(query)}`, {
        responseType: "arraybuffer",
      });
      
      // Write image to file
      fs.writeFileSync(path, Buffer.from(response.data));
      
      // Send the generated image
      await message.reply({
        body: `✅ |𝗜𝗺𝗮𝗴𝗲 𝗚𝗲𝗻𝗲𝗿𝗮𝘁𝗲𝗱 𝗦𝘂𝗰𝗰𝗲𝘀𝘀𝗳𝘂𝗹𝗹𝘆`,
        attachment: fs.createReadStream(path)
      });
      
      // Clean up the file
      fs.unlinkSync(path);
      
      // Unsend loading message
      message.unsend(loadingMsg.messageID);
      
    } catch (error) {
      console.error("Error generating image:", error);
      message.reply("❌ An error occurred while generating the image. Please try again later.");
    }
  }
};
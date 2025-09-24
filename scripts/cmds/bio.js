module.exports = {
  config: {
    name: "bio",
    version: "1.7",
    author: "xemon",
    countDown: 5,
    role: 2,
    shortDescription: {
      vi: "Thay đổi tiểu sử bot",
      en: "Change bot biography",
    },
    longDescription: {
      vi: "Thay đổi tiểu sử của bot với văn bản được cung cấp",
      en: "Change the bot's biography with the provided text",
    },
    category: "owner",
    guide: {
      vi: "{pn} <văn bản tiểu sử mới>",
      en: "{pn} <new biography text>",
    },
  },
  onStart: async function ({ args, message, api }) {
    try {
      // Check if bio text is provided
      if (!args || args.length === 0) {
        return message.reply("❌ | Please provide text for the new biography.");
      }

      const newBio = args.join(" ");
      
      // Check bio length (most platforms have limits)
      if (newBio.length > 101) {
        return message.reply("❌ | Biography too long. Please keep it under 101 characters.");
      }

      // Change the bio
      await api.changeBio(newBio);
      message.reply(`👨‍🔬 | Biography changed successfully!\nNew bio: "${newBio}"`);
      
    } catch (error) {
      console.error("Error changing bio:", error);
      message.reply("❌ | Failed to change biography. Please try again later.");
    }
  },
};
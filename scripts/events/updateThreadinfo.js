const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const stream = require('stream');

module.exports = {
  config: {
    name: "adminUpdate",
    version: "1.0.0",
    author: "Aayusha Miss",
    countDown: 5,
    role: "admin",
    shortDescription: {
      vi: "Thông báo cập nhật nhóm",
      en: "Group update notification",
    },
    longDescription: {
      vi: "Thông báo cập nhật về nhóm như thay đổi tên, ảnh đại diện, admin, v.v.",
      en: "Group update notification for events like name change, profile picture change, admins, etc.",
    },
    category: "Group Management",
    guide: {
      en: "{pn}",
    },
  },
  onStart: async function ({ args, message, api, Threads, Users, event, usersData }) {
    if (!event || !event.logMessageData) {
      return;
    }

    const { threadID, logMessageType, logMessageData } = event;

    if (!logMessageData) {
      return;
    }

    if (logMessageType === "log:thread-admins") {
      let msg = '';

      if (logMessageData.ADMIN_EVENT === "add_admin") {
        const id = logMessageData.TARGET_ID;
        const userData = await usersData.get(id);
        const name = userData.name;

        msg = `===🎬 UPDATE NOTICE 🎥 ===
🚀 *New Admin Added:*
 ✅ *${name} has been added as an admin.*`;
      } 
      else if (logMessageData.ADMIN_EVENT === "remove_admin") {
        const id = logMessageData.TARGET_ID;
        const userData = await usersData.get(id);
        const name = userData.name;

        msg = `===🎬 UPDATE NOTICE 🎥 ===
🚫 *Admin Rights Removed:* ${name} is no longer an admin.`;
      }

      const gifLinks = [
        'https://i.imgur.com/Uqi6bc4.gif',
        'https://i.imgur.com/g0ejQG2.gif',
        'https://i.imgur.com/VmWyhV7.gif',
        'https://i.imgur.com/SzMeWtW.gif',
        'https://i.imgur.com/L8mJYjZ.gif'
      ];

      const randomGif = gifLinks[Math.floor(Math.random() * gifLinks.length)];

      try {
        const response = await axios.get(randomGif, {
          responseType: 'stream',
        });

        api.sendMessage({
          body: msg,
          attachment: response.data,
        }, threadID);

      } catch (error) {
        console.error("Error fetching the GIF:", error);
        api.sendMessage("An error occurred while fetching the GIF.", threadID);
      }
    }
  }
};
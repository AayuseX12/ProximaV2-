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
  'https://drive.google.com/uc?export=download&id=11s3HFeAesnyDFgvp_Ptz6leqyUND7lEe',
  'https://drive.google.com/uc?export=download&id=11xPbYHSsuT6YDSPOl3tzoD8C1yPzvdz3',
  'https://drive.google.com/uc?export=download&id=11Z93iJd7wi7pwU4T-obZf3PoBY1JqYFZ',
  'https://drive.google.com/uc?export=download&id=11lDqn1BsfdVsAPyelp5A8pSMjSeTeBir',
  'https://drive.google.com/uc?export=download&id=11VN0cWfqELpH9KbCpR4akF302P0aMesU',
  'https://drive.google.com/uc?export=download&id=11tuhu4erVZdyLX6GBQ__LBnRh4bt8Cux',
  'https://drive.google.com/uc?export=download&id=11vRIOCdaXAvx0cO22Mwiz9lhtC20cL-L',
  'https://drive.google.com/uc?export=download&id=11wvXpaaVCVJMp_ZkPzFk8p6Hdk2dzfl4',
  'https://drive.google.com/uc?export=download&id=11cTn6yeiwv5iFd6EYyLksTWlRKcIknJx',
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
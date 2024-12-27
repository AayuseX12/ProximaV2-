const axios = require('axios'); // For making HTTP requests (to fetch data from external sources)
const fs = require('fs-extra'); // For working with the filesystem
const path = require('path'); // For handling and transforming file paths

module.exports = {
  config: {
    name: "adminUpdate",
    version: "1.0.0",
    author: "Your Name",
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
  onStart: async function ({ args, message, api, Threads, Users, event }) {
    // Log the entire event for debugging purposes
    console.log("Event received:", event);

    // Check if event is undefined or missing important data
    if (!event || !event.logMessageData) {
      console.error("No logMessageData provided or event is undefined.");
      return;
    }

    const { author, threadID, logMessageType, logMessageData } = event;

    // If logMessageData is missing, return early
    if (!logMessageData) {
      console.error("logMessageData is missing in the event.");
      return;
    }

    console.log("logMessageData:", logMessageData);

    // Check if this event is related to admin changes
    if (logMessageType === "log:thread-admins") {
      let msg = '';
      
      // Handle when a user is added as an admin
      if (logMessageData.ADMIN_EVENT === "add_admin") {
        msg = `===🎬UPDATE NOTICE🎥===\n\nUSER ADDED ${logMessageData.TARGET_ID} ADMIN AS GROUP ADMINISTRATION.`;
        
        // Use the provided Imgur GIF URL
        const imgUrl = 'https://i.imgur.com/iZg3KrH.gif';
        
        api.sendMessage({
          body: msg,
          attachment: imgUrl  // Send the Imgur GIF URL as attachment
        }, threadID);
        
      } 
      // Handle when a user is removed as an admin
      else if (logMessageData.ADMIN_EVENT === "remove_admin") {
        msg = `===🎬UPDATE NOTICE🎥===\n\nTO REMOVE ADMINISTRATIVE RIGHTS OF ${logMessageData.TARGET_ID}.`;
        
        // Use the provided Imgur GIF URL
        const imgUrl = 'https://i.imgur.com/iZg3KrH.gif';
        
        api.sendMessage({
          body: msg,
          attachment: imgUrl  // Send the Imgur GIF URL as attachment
        }, threadID);
      }
    }
  }
};
const axios = require('axios');  // Add this line to import axios

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
        
        // Send the video and gif
        const res = (await axios.get('https://vnhhoang206-16.vnhoang06.repl.co/api/gif/gifchill')).data.data;
        const t = (await axios.get(`${res}`, {
                    responseType: "stream"
                }))
                .data;
        api.sendMessage({
          body: msg,
          attachment: t
        }, threadID);
        
      } 
      // Handle when a user is removed as an admin
      else if (logMessageData.ADMIN_EVENT === "remove_admin") {
        msg = `===🎬UPDATE NOTICE🎥===\n\nTO REMOVE ADMINISTRATIVE RIGHTS OF ${logMessageData.TARGET_ID}.`;
        
        // Send the video and gif
        const res = (await axios.get('https://vnhhoang206-16.vnhoang06.repl.co/api/gif/gifchill')).data.data;
        const t = (await axios.get(`${res}`, {
                    responseType: "stream"
                }))
                .data;
        api.sendMessage({
          body: msg,
          attachment: t
        }, threadID);
      }
    }
  }
};
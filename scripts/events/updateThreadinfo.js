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
  onStart: async function ({ args, message, api, Threads, Users }) {
    // Log the incoming event data for debugging
    console.log("Event args:", args);
    
    const { author, threadID, logMessageType, logMessageData } = args || {};
    
    // If threadID is not available, skip processing
    if (!logMessageData) {
      console.error("No logMessageData provided.");
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
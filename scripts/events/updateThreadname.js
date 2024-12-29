module.exports = {
  config: {
    name: "groupNameChangeNotifier",
    version: "1.0.0",
    author: "Aayusha",  // Author Name
    countDown: 5,  // Countdown time before action is taken
    role: "admin", // Role-based permissions
    shortDescription: {
      vi: "Thông báo khi ai đó thay đổi tên nhóm",
      en: "Notifies when someone changes the group name",
    },
    longDescription: {
      vi: "Bot này thông báo người thay đổi tên nhóm và hiển thị tên hiện tại của nhóm.",
      en: "This bot notifies who changed the group name and shows the current group name.",
    },
    category: "Moderation",
    guide: {
      en: "{pn} (text)",
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

    // Check for group name change event
    if (logMessageType === "log:thread-name") {
      let msg = '';

      // Check if the logMessageData contains the name change event
      if (logMessageData.NAME_EVENT === "change") {
        const oldName = logMessageData.OLD_NAME;
        const newName = logMessageData.NEW_NAME;
        const userID = logMessageData.TARGET_ID;

        // Get the user who changed the group name
        const userData = await usersData.get(userID);
        const userName = userData.name || "Unknown";

        // Construct the notification message
        msg = `${userName} changed the group name from "${oldName}" to "${newName}".`;

        // Send the notification message to the group
        api.sendMessage(msg, threadID);
      }
    }
  },
};
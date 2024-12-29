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

    // Check if the event type is log:thread-name (group name change)
    if (logMessageType === "log:thread-name" && logMessageData.name) {
      const newName = logMessageData.name;  // New group name from event data
      const userID = event.author;  // ID of the user who changed the name

      // Get user information (the one who changed the group name)
      const userData = await usersData.get(userID);
      const userName = userData ? userData.name : "Unknown";

      // Prepare the message
      const msg = `${userName} named the group as "${newName}".`;

      // Send the notification message to the group
      api.sendMessage(msg, threadID);
    }
  },
};
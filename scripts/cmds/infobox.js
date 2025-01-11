module.exports = {
  config: {
    name: "infobox",
    version: "1.0.0",
    author: "Aayuse",
    countDown: 5,
    role: "member",
    shortDescription: {
      en: "View group details",
    },
    longDescription: {
      en: "Get detailed information about the group, including its name, member count, emoji, and more.",
    },
    category: "group",
    guide: {
      en: "{pn}",
    },
  },
  onStart: async function ({ message, api, event }) {
    try {
      const threadInfo = await api.getThreadInfo(event.threadID);
      const {
        name: groupName = "Unnamed Group",
        emoji: groupEmoji = "✨",
        participantIDs,
        isGroup,
        adminIDs = [],
        theme,
      } = threadInfo;

      const memberCount = participantIDs.length;
      const adminCount = adminIDs.length;
      const isGroupText = isGroup ? "Yes" : "No";
      const themeName = theme ? theme.name : "Default";

      // Prepare the response
      const groupInfoMessage = `
━━━━━━━━━━━━━━━
📋  *Group Info*  📋
━━━━━━━━━━━━━━━
📛 *Group Name:* ${groupName}
👥 *Total Members:* ${memberCount}
🛡️ *Admins:* ${adminCount}
🎭 *Group Emoji:* ${groupEmoji}
🎨 *Theme:* ${themeName}
👥 *Is Group Chat:* ${isGroupText}
━━━━━━━━━━━━━━━
      `;

      return message.reply(groupInfoMessage.trim());
    } catch (error) {
      console.error("Error fetching group info:", error);
      return message.reply("❌ *Error:* Unable to fetch group information.");
    }
  },
};
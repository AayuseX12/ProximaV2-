module.exports = {
  config: {
    name: "leavegc",
    version: "1.2.0",
    author: "Aayusha",
    countDown: 5,
    role: "admin",
    shortDescription: {
      en: "Remove the bot or a user from the group.",
    },
    longDescription: {
      en: "This command allows the admin to remove the bot or any user from a specified group using their UID. It includes a leave message with the reason.",
    },
    category: "group management",
    guide: {
      en: "{pn} [userUID] [groupUID] [reason]\n\nExamples:\n{pn} bot 123456789 Spamming messages\n{pn} 987654321 123456789 Violating rules",
    },
  },
  onStart: async function ({ args, message, api }) {
    if (!args[1]) {
      return message.reply(
        "Please provide both a user UID (or 'bot'), a group UID, and optionally a reason. Example: !leavegc bot 123456789 Spamming messages"
      );
    }

    const userUID = args[0].toLowerCase() === "bot" ? api.getCurrentUserID() : args[0];
    const groupUID = args[1];
    const reason = args.slice(2).join(" ") || "No reason provided";

    try {
      let userName = "the user";

      if (userUID !== api.getCurrentUserID()) {
        const groupInfo = await api.getThreadInfo(groupUID);
        const user = groupInfo.participantIDs.find((id) => id === userUID);

        if (user) {
          userName = groupInfo.nicknames?.[userUID] || userUID; // Use nickname if available, fallback to UID
        }
      }

      if (userUID === api.getCurrentUserID()) {
        const leaveMessage = `My admin has requested me to leave this group.\nReason: ${reason}`;
        await api.sendMessage(leaveMessage, groupUID);
      } else {
        const removeMessage = `My admin has requested to remove ${userName} from this group.\nReason: ${reason}`;
        await api.sendMessage(removeMessage, groupUID);
      }

      await api.removeUserFromGroup(userUID, groupUID);

      const response =
        userUID === api.getCurrentUserID()
          ? `The bot has successfully left the group with UID: ${groupUID}`
          : `Successfully removed ${userName} (UID: ${userUID}) from the group with UID: ${groupUID}`;
      
      message.reply(response);
    } catch (error) {
      message.reply(
        `Failed to remove user or bot from the group. Please check the UIDs or ensure the bot has sufficient permissions.\n\nError: ${error.message}`
      );
    }
  },
};
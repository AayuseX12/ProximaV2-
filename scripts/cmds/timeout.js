const moment = require("moment-timezone");

module.exports = {
  config: {
    name: "timeout",
    version: "1.0.0",
    author: "Aayuse",
    countDown: 5,
    role: "admin",
    shortDescription: {
      en: "Timeout a member temporarily",
    },
    longDescription: {
      en: "Timeout a member from the group temporarily for a specific period.",
    },
    category: "group",
    guide: {
      en: "{pn} UID <time_in_minutes>",
    },
  },
  onStart: async function ({ args, message, api, event }) {
    if (args.length < 2) {
      return message.reply("Please provide the user's UID and the timeout duration in minutes.");
    }

    const userID = args[0]; // UID passed as first argument
    const timeoutDuration = parseInt(args[1], 10);

    if (isNaN(timeoutDuration) || timeoutDuration <= 0) {
      return message.reply("Please provide a valid time in minutes for the timeout.");
    }

    const timeInMilliseconds = timeoutDuration * 60000; // Convert minutes to milliseconds
    const timeoutEndTime = moment().add(timeoutDuration, 'minutes').format('YYYY-MM-DD HH:mm:ss');
    console.log(`Timeout for ${timeoutDuration} minutes will end at: ${timeoutEndTime}`);

    // Validate if the userID is a valid number or string
    if (isNaN(userID) || !userID) {
      return message.reply("Invalid UID provided.");
    }

    try {
      // Fetch the user's info to get their name
      const userInfo = await api.getUserInfo(userID);
      const userName = userInfo[userID] ? userInfo[userID].name : "Unknown User";

      // Remove the user from the group
      await api.removeUserFromGroup(userID, event.threadID);
      console.log(`Successfully removed user with UID: ${userID} from the group.`);

      // Notify that the timeout has started
      await message.reply(`⏳ **Timeout Started** ⏳

User: *${userName}*  
Timeout: *${timeoutDuration} minutes*  
Timeout End: *${timeoutEndTime}*

User has been temporarily removed from the group. 🚫`);

      // Wait for the timeout duration before adding the user back to the group
      setTimeout(async () => {
        try {
          console.log(`Re-adding user with UID: ${userID} back to the group...`);
          await api.addUserToGroup(userID, event.threadID);
          await message.reply(`🎉 **Timeout Ended** 🎉

User *${userName}* has been un-timed out and re-added to the group! 🎊`);
        } catch (addError) {
          console.error(`Error adding user with UID: ${userID} back to the group:`, addError);
          await message.reply(`❌ *Error:* Unable to re-add user *${userName}* to the group.`);
        }
      }, timeInMilliseconds);

    } catch (error) {
      console.error(`Error during removal of user with UID: ${userID}:`, error);
      message.reply(`❌ *Error:* Unable to timeout user with UID: *${userID}*. Could not remove the user from the group.`);
    }
  },
};
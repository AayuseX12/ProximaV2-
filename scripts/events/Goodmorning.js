const moment = require('moment-timezone');

module.exports = {
  config: {
    name: "GoodMorning",
    version: "1.0",
    author: "Aayusha",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "Send a Good Morning message at 7 AM Nepal Time.",
    },
    longDescription: {
      en: "This feature sends a daily 'Good Morning' message to all groups at 7 AM Nepal Time.",
    },
    category: "Automation",
    guide: {
      en: "{pn} (no parameters needed)",
    },
  },

  onStart: async function ({ args, message, api }) {
    // Schedule the Good Morning message
    this.scheduleMorningMessage(api);
  },

  // Function to calculate the time remaining until 7:00 AM Nepal Time
  calculateTimeUntilMorning: function () {
    const now = moment().tz('Asia/Kathmandu'); // Get the current time in Nepal
    const nextMorning = moment().tz('Asia/Kathmandu').set({ hour: 7, minute: 0, second: 0, millisecond: 0 });

    // If it's already 7 AM or later today, schedule for tomorrow
    if (now.isAfter(nextMorning)) {
      nextMorning.add(1, 'days');
    }

    const duration = moment.duration(nextMorning.diff(now)); // Calculate time difference
    return duration;
  },

  // Function to send the Good Morning message
  sendGoodMorningMessage: async function (api) {
    try {
      // List of all group IDs
      const groups = [
        '8377400502364081', // Unnamed Group
        '25474144258867783', // Termux Nepal
        '8958205690942920', // Unnamed Group
        '9939753312706963', // " Underground " ♥️
        '9762008810495171', // Unnamed Group
        '8925230984259946', // GoddssXjods!!
        '8901175216586336', // Aayusha ko bot baulayo💗🫠
        '8936367856442452', // Homiess [»🔰«]
        '9083905265008575', // Unnamed Group
        '8280810022019531', // Unnamed Group
        '8889231454485706', // Unnamed Group
        '9069580566441486', // Unnamed Group
        '9124285520972019', // Unnamed Group
        '27870151895965427', // Unnamed Group
        '8836336893124263', // Unnamed Group
      ];

      const messageText = "Good Morning, everyone! Have a wonderful day! 🌞 -Aayuse!!";

      // Send message to each group
      for (const groupID of groups) {
        api.sendMessage(messageText, groupID);
      }

      console.log('Good Morning message sent successfully!');
    } catch (error) {
      console.error('Error sending Good Morning message:', error);
    }
  },

  // Function to schedule the Good Morning message
  scheduleMorningMessage: function (api) {
    const timeUntilMorning = this.calculateTimeUntilMorning();

    // Set a one-time timer to send the message at the next 7:00 AM Nepal time
    setTimeout(() => {
      this.sendGoodMorningMessage(api);

      // After sending the first message, set up a daily repeat interval for 7 AM
      setInterval(() => {
        this.sendGoodMorningMessage(api);
      }, 24 * 60 * 60 * 1000); // 24 hours in milliseconds
    }, timeUntilMorning.asMilliseconds());
  },
};
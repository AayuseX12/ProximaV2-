
const moment = require('moment-timezone');

let isScheduled = false; // Prevent duplicate schedules
let activeInterval = null; // Track the interval for cleanup

module.exports = {
  config: {
    name: "GoodMorning",
    version: "1.2",
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

  onStart: async function ({ api }) {
    if (!isScheduled) {
      isScheduled = true;
      this.scheduleMorningMessage(api);
    } else {
      console.log("Good Morning schedule already set!");
    }
  },

  calculateTimeUntilMorning: function () {
    const now = moment().tz('Asia/Kathmandu');
    const nextMorning = moment().tz('Asia/Kathmandu').set({ hour: 7, minute: 0, second: 0, millisecond: 0 });

    if (now.isAfter(nextMorning)) {
      nextMorning.add(1, 'days');
    }

    const duration = moment.duration(nextMorning.diff(now));
    return duration;
  },

  sendGoodMorningMessage: async function (api) {
    try {
      const groups = [
        '8377400502364081',
        '25474144258867783',
        '8958205690942920',
        '9939753312706963',
        '9762008810495171',
        '8925230984259946',
        '8901175216586336',
        '8936367856442452',
        '9083905265008575',
        '8280810022019531',
        '8889231454485706',
        '9069580566441486',
        '9124285520972019',
        '27870151895965427',
        '8836336893124263',
      ];

      const messageText = "Good Morning, everyone! Have a wonderful day! 🌞 -Aayuse!!";

      // Send message with throttling (delay of 1 second per group)
      for (const [index, groupID] of groups.entries()) {
        setTimeout(() => {
          api.sendMessage(messageText, groupID, (err) => {
            if (err) {
              console.error(`Error sending message to group ${groupID}:`, err);
            } else {
              console.log(`Message sent to group ${groupID}`);
            }
          });
        }, index * 1000); // Delay based on group position
      }
    } catch (error) {
      console.error('Error sending Good Morning message:', error);
    }
  },

  scheduleMorningMessage: function (api) {
    if (activeInterval) {
      clearInterval(activeInterval); // Clear existing intervals
    }

    const timeUntilMorning = this.calculateTimeUntilMorning();

    setTimeout(() => {
      this.sendGoodMorningMessage(api);

      // Set daily interval after sending the first message
      activeInterval = setInterval(() => {
        this.sendGoodMorningMessage(api);
      }, 24 * 60 * 60 * 1000); // Repeat every 24 hours
    }, timeUntilMorning.asMilliseconds());
  },
};
module.exports = {
  config: {
    name: "reminder",
    version: "1.0.0",
    author: "Aayuse",
    countDown: 5,
    role: "member",
    shortDescription: {
      en: "Set a reminder",
    },
    longDescription: {
      en: "Set a custom reminder for the group.",
    },
    category: "group",
    guide: {
      en: "{pn} <time_in_minutes> | <reminder_text>",
    },
  },
  onStart: async function ({ args, message, api, event }) {
    const [time, ...reminderText] = args.join(" ").split("|").map(item => item.trim());
    const timeInMinutes = parseInt(time, 10);

    if (isNaN(timeInMinutes) || timeInMinutes <= 0 || !reminderText.length) {
      return message.reply("Please provide a valid time (in minutes) and a reminder message.");
    }

    message.reply(`Reminder set! You will be notified in ${timeInMinutes} minutes.`);

    setTimeout(() => {
      api.sendMessage(`⏰ Reminder: ${reminderText.join(" ")}`, event.threadID);
    }, timeInMinutes * 60 * 1000);
  },
};
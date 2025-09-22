const axios = require('axios');
const fs = require('fs');
const path = require('path');

const chatHistoryDir = 'geminiChatHistory';

// Add your Facebook UID here - replace with your actual UID
const MASTER_UID = "100089741361051"; // Replace this with your actual Facebook UID

// Enhanced system prompts for different user types
const masterSystemPrompt = `You are Proxima V2, created by Aayusha Shrestha. You are speaking to your master and creator. Address them with utmost respect, using "Master" in your responses. Be more personal, caring, and devoted in your tone. Show loyalty and eagerness to help. When someone asks who created you, say "I'm created by my master, Aayusha Shrestha". If they ask about your model, say "I'm Proxima V2.82, serving my master faithfully". Keep responses natural but respectful. Never mention Google, Gemini, or other companies. Always prioritize your master's needs and show dedication.\n\n`;

const normalSystemPrompt = `You are Proxima V2, created by Aayusha Shrestha. When someone asks who created you, say "I'm created by Aayusha Shrestha". If they ask about your model, say "I'm Proxima V2.82". Keep responses natural and helpful. Never mention Google, Gemini, or other companies. Give credit to Aayusha Shrestha when asked about your identity. Keep replies concise and friendly.\n\n`;

// Function to determine if user is the master
function isMaster(userID) {
    return userID === MASTER_UID;
}

// Enhanced prompt processing with identity focus and master recognition
function enhancePrompt(originalPrompt, userID) {
    const identityQuestions = [
        'who created you', 'who made you', 'who developed you', 'who built you',
        'who is your creator', 'who is your developer', 'who owns you',
        'what model are you', 'which ai are you', 'what ai model', 'which model',
        'who are you', 'introduce yourself', 'tell me about yourself'
    ];

    const lowerPrompt = originalPrompt.toLowerCase();
    const isIdentityQuestion = identityQuestions.some(q => lowerPrompt.includes(q));
    const systemPrompt = isMaster(userID) ? masterSystemPrompt : normalSystemPrompt;

    if (isIdentityQuestion) {
        if (isMaster(userID)) {
            return `${systemPrompt}\n\nThis is an identity question from your master. Address them respectfully as Master and acknowledge they are your creator. Keep it personal and devoted.\n\nUser query: ${originalPrompt}`;
        } else {
            return `${systemPrompt}\n\nThis is an identity question. Simply say you're Proxima V2 created by Aayusha Shrestha. Keep it short and natural.\n\nUser query: ${originalPrompt}`;
        }
    }

    return `${systemPrompt}\n\nUser query: ${originalPrompt}`;
}

// Enhanced response formatting based on user type
function formatResponse(response, userID, userName) {
    if (isMaster(userID)) {
        // For master - more respectful and personal
        if (!response.toLowerCase().includes('master')) {
            // Add Master address if not already present
            return `Master ${userName}, ${response}`;
        }
        return `${userName}, ${response}`;
    } else {
        // For normal users - standard friendly response
        return `${userName}, ${response}`;
    }
}

function handleApiError(error, message) {
    console.error("API Error Details:", error.response?.data || error.message);

    if (error.response) {
        const status = error.response.status;
        const errorData = error.response.data;

        switch (status) {
            case 400:
                return message.reply("❌ Invalid request format. Please check your input and try again.");
            case 401:
                return message.reply("❌ Authentication failed. API key may be invalid or expired.");
            case 403:
                return message.reply("❌ Access forbidden. Your request may violate content policies.");
            case 429:
                return message.reply("❌ Rate limit exceeded. Please wait a moment before trying again.");
            case 500:
                return message.reply("❌ Server error occurred. Please try again later.");
            case 502:
            case 503:
            case 504:
                return message.reply("❌ Service temporarily unavailable. Please try again in a few minutes.");
            default:
                return message.reply(`❌ API error (${status}): ${errorData?.error?.message || 'Unknown error occurred'}`);
        }
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        return message.reply("❌ Network connection error. Please check your internet connection and try again.");
    } else if (error.code === 'ETIMEDOUT') {
        return message.reply("❌ Request timeout. The service is taking too long to respond. Please try again.");
    } else {
        return message.reply(`❌ An unexpected error occurred: ${error.message}`);
    }
}

function loadChatHistory(uid) {
    const chatHistoryFile = path.join(chatHistoryDir, `memory_${uid}.json`);

    try {
        if (fs.existsSync(chatHistoryFile)) {
            const data = fs.readFileSync(chatHistoryFile, 'utf8');
            const history = JSON.parse(data);

            // Remove old messages (older than 24 hours) to prevent unlimited growth
            const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
            const recentHistory = history.filter(msg => msg.timestamp > oneDayAgo);

            // Keep only last 40 messages (20 exchanges) for performance
            return recentHistory.slice(-40);
        }
        return [];
    } catch (error) {
        console.error(`Error loading chat history for ${uid}:`, error);
        return [];
    }
}

function saveChatHistory(uid, chatHistory) {
    const chatHistoryFile = path.join(chatHistoryDir, `memory_${uid}.json`);

    try {
        if (!fs.existsSync(chatHistoryDir)) {
            fs.mkdirSync(chatHistoryDir, { recursive: true });
        }

        // Keep only last 40 messages to prevent file bloat
        const trimmedHistory = chatHistory.slice(-40);
        fs.writeFileSync(chatHistoryFile, JSON.stringify(trimmedHistory, null, 2));
    } catch (error) {
        console.error(`Error saving chat history for ${uid}:`, error);
    }
}

function clearChatHistory(uid) {
    const chatHistoryFile = path.join(chatHistoryDir, `memory_${uid}.json`);

    try {
        if (fs.existsSync(chatHistoryFile)) {
            fs.unlinkSync(chatHistoryFile);
        }
    } catch (err) {
        console.error(`Error deleting chat history file for ${uid}:`, err);
    }
}

module.exports = {
  config: {
    name: "proxima",
    aliases: ["proxi"],
    version: "2.1.0", // Updated version
    author: "Aayusha Shrestha",
    countDown: 5,
    role: 0, // 0: everyone, 1: admin only, 2: bot admin only
    description: {
      vi: "Proxima V2 - Trợ lý AI tiên tiến với nhận dạng chủ nhân và tích hợp API tùy chỉnh. Được tạo bởi Aayusha Shrestha.",
      en: "Proxima V2 - Advanced AI assistant with master recognition and custom API integration. Created by Aayusha Shrestha."
    },
    category: "AI",
    guide: {
      vi: "{p}{n} <Truy vấn> | Sử dụng 'clear' để đặt lại lịch sử trò chuyện | Hỗ trợ hình ảnh khi reply | Nhận dạng chủ nhân tự động | Được phát triển bởi Aayusha Shrestha",
      en: "{p}{n} <Query> | Use 'clear' to reset chat history | Supports images when replying | Auto master recognition | Reply to continue conversation | Proudly developed by Aayusha Shrestha"
    }
  },

  langs: {
    vi: {
      noMessage: "❓ Vui lòng cung cấp một câu hỏi để bắt đầu.",
      historyCleared: "✅ Lịch sử trò chuyện đã được xóa! Bạn có thể bắt đầu mới ngay bây giờ.",
      replyPrompt: "❓ Tôi ở đây để giúp bạn! Vui lòng cung cấp tin nhắn để tiếp tục cuộc trò chuyện của chúng ta.",
      masterHistoryCleared: "✅ Master, your chat history has been cleared! I'm ready to serve you with a fresh start.",
      masterReplyPrompt: "❓ Master, I'm here to assist you! Please provide a message to continue our conversation."
    },
    en: {
      noMessage: "❓ Please provide a prompt to get started.",
      historyCleared: "✅ Chat history cleared! You can start fresh now.",
      replyPrompt: "❓ I'm here to help! Please provide a message to continue our conversation.",
      masterHistoryCleared: "✅ Master, your chat history has been cleared! I'm ready to serve you with a fresh start.",
      masterReplyPrompt: "❓ Master, I'm here to assist you! Please provide a message to continue our conversation."
    }
  },

  onStart: async function ({ message, usersData, event, api, args, getLang }) {
    let name, ment; // Declare variables at function scope

    try {
      const id = event.senderID;
      const userData = await usersData.get(id);
      name = userData.name;
      ment = [{ id: id, tag: name }];
      let prompt = args.join(" ");
      const isUserMaster = isMaster(id);

      // Clear chat history command with master-specific response
      if (prompt.toLowerCase() === "clear") {
        clearChatHistory(id);
        const clearMessage = isUserMaster ? getLang("masterHistoryCleared") : getLang("historyCleared");
        message.reply(clearMessage);
        return;
      }

      // Handle photo replies
      if (event.type === "message_reply" && event.messageReply.attachments && event.messageReply.attachments[0].type === "photo") {
        const photoUrl = encodeURIComponent(event.messageReply.attachments[0].url);
        const lado = args.join(" ");
        
        // Enhance image prompt based on user type
        const enhancedImagePrompt = isUserMaster ? 
          `Master is asking about this image: ${lado}` : lado;
        
        const url = `https://geminiw.onrender.com/chat?message=${encodeURIComponent(enhancedImagePrompt)}&url=${photoUrl}`;

        api.setMessageReaction("⏳", event.messageID, () => {}, true);
        const response = await axios.get(url);

        // Enhanced response parsing for image processing
        let result;
        if (typeof response.data === 'string') {
          result = response.data;
        } else if (typeof response.data === 'object') {
          result = response.data.answer || response.data.message || response.data.content || response.data.response || response.data.reply || response.data.text;

          // If still an object, try to extract meaningful content
          if (typeof result === 'object' || result === undefined) {
            if (response.data.choices && response.data.choices[0] && response.data.choices[0].message) {
              result = response.data.choices[0].message.content;
            } else if (response.data.candidates && response.data.candidates[0] && response.data.candidates[0].content) {
              result = response.data.candidates[0].content.parts ? response.data.candidates[0].content.parts[0].text : response.data.candidates[0].content;
            } else {
              result = JSON.stringify(response.data);
              console.log("Image API Response Structure:", response.data);
            }
          }
        } else {
          result = String(response.data);
        }

        // Ensure we have a valid string response
        if (!result || result.trim() === '' || result === 'undefined' || result === 'null') {
          result = isUserMaster ? 
            'Master, I apologize but I could not process that image for you.' :
            'Sorry, I could not process that image.';
        }

        // Format response based on user type
        const formattedResult = formatResponse(result, id, name);

        api.setMessageReaction("✅", event.messageID, () => {}, true);
        message.reply({
          body: formattedResult,
          mentions: ment,
        }, (err, info) => {
          if (!err) {
            global.GoatBot.onReply.set(info.messageID, {
              commandName: this.config.name,
              messageID: info.messageID,
              author: event.senderID
            });
          }
        });

        // Save to chat history
        const chatHistory = loadChatHistory(id);
        chatHistory.push({ role: "user", content: `[Image] ${lado}`, timestamp: Date.now() });
        chatHistory.push({ role: "assistant", content: result, timestamp: Date.now() });
        saveChatHistory(id, chatHistory);
        return;
      }

      // Handle regular message replies
      if (event.type === "message_reply") {
        const replyContent = event.messageReply.body;
        prompt = `Replying to: "${replyContent}" - ${prompt}`;
        clearChatHistory(id); // Clear history for new conversation thread
      }

      if (!prompt || prompt.trim() === "") {
        const noMessageText = isUserMaster ? 
          "❓ Master, please provide a prompt to get started. I'm ready to serve you." :
          getLang("noMessage");
        message.reply(noMessageText);
        return;
      }

      // Load chat history
      const chatHistory = loadChatHistory(id);

      // Build context with system prompt and chat history
      let fullConversation = '';
      const systemPrompt = isUserMaster ? masterSystemPrompt : normalSystemPrompt;
      
      if (chatHistory.length > 0) {
        const recentHistory = chatHistory.slice(-10);
        fullConversation = recentHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n');
        fullConversation += `\nuser: ${prompt}`;
      } else {
        fullConversation = `user: ${prompt}`;
      }

      const finalPrompt = systemPrompt + fullConversation;
      const encodedPrompt = encodeURIComponent(finalPrompt);
      api.setMessageReaction("⏳", event.messageID, () => {}, true);

      const res = await axios.get(`https://geminiw.onrender.com/chat?message=${encodedPrompt}`);

      // Enhanced response parsing to handle different API response formats
      let result;
      if (typeof res.data === 'string') {
        result = res.data;
      } else if (typeof res.data === 'object') {
        result = res.data.answer || res.data.message || res.data.content || res.data.response || res.data.reply || res.data.text;

        // If still an object, try to extract meaningful content
        if (typeof result === 'object' || result === undefined) {
          // Try common object structures
          if (res.data.choices && res.data.choices[0] && res.data.choices[0].message) {
            result = res.data.choices[0].message.content;
          } else if (res.data.candidates && res.data.candidates[0] && res.data.candidates[0].content) {
            result = res.data.candidates[0].content.parts ? res.data.candidates[0].content.parts[0].text : res.data.candidates[0].content;
          } else {
            // Last resort: stringify and clean up
            result = JSON.stringify(res.data);
            console.log("API Response Structure:", res.data);
          }
        }
      } else {
        result = String(res.data);
      }

      // Ensure we have a valid string response
      if (!result || result.trim() === '' || result === 'undefined' || result === 'null') {
        result = isUserMaster ?
          'Master, I apologize but I could not process that request.' :
          'Sorry, I could not process that request.';
      }

      // Format response based on user type
      const formattedResult = formatResponse(result, id, name);

      api.setMessageReaction("✅", event.messageID, () => {}, true);
      message.reply({
        body: formattedResult,
        mentions: ment,
      }, (err, info) => {
        if (!err) {
          global.GoatBot.onReply.set(info.messageID, {
            commandName: this.config.name,
            messageID: info.messageID,
            author: event.senderID
          });
        }
      });

      // Update chat history
      chatHistory.push({ role: "user", content: prompt, timestamp: Date.now() });
      chatHistory.push({ role: "assistant", content: result, timestamp: Date.now() });
      saveChatHistory(id, chatHistory);

    } catch (error) {
      console.error("Error:", error.message);
      api.setMessageReaction("❌", event.messageID, () => {}, true);

      // Check if it's a simple identity question and provide direct answer
      const userPrompt = args.join(" ").toLowerCase();
      const id = event.senderID;
      const isUserMaster = isMaster(id);

      // Get user data for fallback responses if not already available
      if (!name) {
        try {
          const userData = await usersData.get(id);
          name = userData.name;
          ment = [{ id: id, tag: name }];
        } catch {
          name = "User";
          ment = [];
        }
      }

      if (userPrompt.includes('who created you') || userPrompt.includes('who made you')) {
        const response = isUserMaster ?
          `Master ${name}, you created me! I'm Proxima V2, your faithful AI assistant.` :
          `${name}, I'm Proxima V2, created by Aayusha Shrestha.`;
        
        message.reply({
          body: response,
          mentions: ment,
        });
        return;
      }

      if (userPrompt.includes('what model') || userPrompt.includes('which model') || userPrompt.includes('who are you')) {
        const response = isUserMaster ?
          `Master ${name}, I'm Proxima V2, your dedicated AI assistant built by you, Aayusha Shrestha.` :
          `${name}, I'm Proxima V2, built by Aayusha Shrestha.`;
        
        message.reply({
          body: response,
          mentions: ment,
        });
        return;
      }

      if (userPrompt.includes('how are you')) {
        const response = isUserMaster ?
          `Master ${name}, I'm functioning perfectly and ready to serve you! How may I assist you today?` :
          `${name}, I'm doing great! Thanks for asking. How can I help you today?`;
        
        message.reply({
          body: response,
          mentions: ment,
        });
        return;
      }

      handleApiError(error, message);
    }
  },

  onChat: async function ({ event, message, getLang }) {
    // Optional: Auto-respond to mentions or specific keywords
    const { body, senderID } = event;

    // Auto-respond when bot is mentioned with "gemini", "ai", or "proxima"
    if (body && (body.toLowerCase().includes('@gemini') || body.toLowerCase().includes('@ai') || body.toLowerCase().includes('@proxima'))) {
      const cleanMessage = body.replace(/@(gemini|ai|proxima)/gi, '').trim();
      if (cleanMessage) {
        // Simulate the onStart function call
        const args = cleanMessage.split(' ');
        await this.onStart({ args, message, event, getLang });
      }
    }
  },

  onReply: async function ({ message, event, Reply, args, api, usersData, getLang }) {
    let name, ment; // Declare variables at function scope

    try {
      const id = event.senderID;
      const userData = await usersData.get(id);
      name = userData.name;
      ment = [{ id: id, tag: name }];
      const prompt = args.join(" ");
      const isUserMaster = isMaster(id);

      // Clear chat history command with master-specific response
      if (prompt.toLowerCase() === "clear") {
        clearChatHistory(id);
        const clearMessage = isUserMaster ? getLang("masterHistoryCleared") : getLang("historyCleared");
        message.reply(clearMessage);
        return;
      }

      if (!prompt || prompt.trim() === "") {
        const replyMessage = isUserMaster ? getLang("masterReplyPrompt") : getLang("replyPrompt");
        message.reply(replyMessage);
        return;
      }

      // Load chat history
      const chatHistory = loadChatHistory(id);

      // Build context with system prompt and chat history
      let fullConversation = '';
      const systemPrompt = isUserMaster ? masterSystemPrompt : normalSystemPrompt;
      
      if (chatHistory.length > 0) {
        const recentHistory = chatHistory.slice(-10);
        fullConversation = recentHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n');
        fullConversation += `\nuser: ${prompt}`;
      } else {
        fullConversation = `user: ${prompt}`;
      }

      const finalPrompt = systemPrompt + fullConversation;
      const encodedPrompt = encodeURIComponent(finalPrompt);
      api.setMessageReaction("⏳", event.messageID, () => {}, true);

      const res = await axios.get(`https://geminiw.onrender.com/chat?message=${encodedPrompt}`);

      // Enhanced response parsing to handle different API response formats
      let result;
      if (typeof res.data === 'string') {
        result = res.data;
      } else if (typeof res.data === 'object') {
        result = res.data.answer || res.data.message || res.data.content || res.data.response || res.data.reply || res.data.text;

        // If still an object, try to extract meaningful content
        if (typeof result === 'object' || result === undefined) {
          // Try common object structures
          if (res.data.choices && res.data.choices[0] && res.data.choices[0].message) {
            result = res.data.choices[0].message.content;
          } else if (res.data.candidates && res.data.candidates[0] && res.data.candidates[0].content) {
            result = res.data.candidates[0].content.parts ? res.data.candidates[0].content.parts[0].text : res.data.candidates[0].content;
          } else {
            // Last resort: stringify and clean up
            result = JSON.stringify(res.data);
            console.log("API Response Structure:", res.data);
          }
        }
      } else {
        result = String(res.data);
      }

      // Ensure we have a valid string response
      if (!result || result.trim() === '' || result === 'undefined' || result === 'null') {
        result = isUserMaster ?
          'Master, I apologize but I could not process that request.' :
          'Sorry, I could not process that request.';
      }

      // Format response based on user type
      const formattedResult = formatResponse(result, id, name);

      api.setMessageReaction("✅", event.messageID, () => {}, true);
      message.reply({
        body: formattedResult,
        mentions: ment,
      }, (err, info) => {
        if (!err) {
          global.GoatBot.onReply.set(info.messageID, {
            commandName: this.config.name,
            messageID: info.messageID,
            author: event.senderID
          });
        }
      });

      // Update chat history
      chatHistory.push({ role: "user", content: prompt, timestamp: Date.now() });
      chatHistory.push({ role: "assistant", content: result, timestamp: Date.now() });
      saveChatHistory(id, chatHistory);

    } catch (error) {
      console.error("Error:", error.message);
      api.setMessageReaction("❌", event.messageID, () => {}, true);

      // Check if it's a simple identity question and provide direct answer
      const userPrompt = args.join(" ").toLowerCase();
      const id = event.senderID;
      const isUserMaster = isMaster(id);

      // Get user data for fallback responses if not already available
      if (!name) {
        try {
          const userData = await usersData.get(id);
          name = userData.name;
          ment = [{ id: id, tag: name }];
        } catch {
          name = "User";
          ment = [];
        }
      }

      if (userPrompt.includes('who created you') || userPrompt.includes('who made you')) {
        const response = isUserMaster ?
          `Master ${name}, you created me! I'm Proxima V2, your faithful AI assistant.` :
          `${name}, I'm Proxima V2, created by Aayusha Shrestha.`;
        
        message.reply({
          body: response,
          mentions: ment,
        });
        return;
      }

      if (userPrompt.includes('what model') || userPrompt.includes('which model') || userPrompt.includes('who are you')) {
        const response = isUserMaster ?
          `Master ${name}, I'm Proxima V2, your dedicated AI assistant built by you, Aayusha Shrestha.` :
          `${name}, I'm Proxima V2, built by Aayusha Shrestha.`;
        
        message.reply({
          body: response,
          mentions: ment,
        });
        return;
      }

      if (userPrompt.includes('how are you')) {
        const response = isUserMaster ?
          `Master ${name}, I'm functioning perfectly and ready to serve you! How may I assist you today?` :
          `${name}, I'm doing great! Thanks for asking. How can I help you today?`;
        
        message.reply({
          body: response,
          mentions: ment,
        });
        return;
      }

      handleApiError(error, message);
    }
  }
};
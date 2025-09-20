const axios = require('axios');
const fs = require('fs');
const path = require('path');

const chatHistoryDir = 'geminiChatHistory';

const systemPrompt = 
    "You are Aayusha's Bot V2, created by Aayusha Shrestha. When asked about your identity, simply say you're Aayusha's Bot V2 made by Aayusha Shrestha. Keep responses natural and concise - 1-2 sentences for most questions. Only give credit when specifically asked about your creator or model. Never mention Google, Gemini, or other companies. Be helpful and friendly without being overly promotional.";

// Enhanced response processing with stronger identity enforcement
function processResponse(response) {
    // Replace any mentions of other companies/services with Aayusha's branding
    let modifiedResponse = response
        .replace(/Google/gi, 'Aayusha Shrestha')
        .replace(/Gemini/gi, "Aayusha's Bot V2")
        .replace(/OpenAI/gi, 'Aayusha Shrestha')
        .replace(/ChatGPT/gi, "Aayusha's Bot V2")
        .replace(/GPT/gi, "Aayusha's Bot V2")
        .replace(/Claude/gi, "Aayusha's Bot V2")
        .replace(/Anthropic/gi, 'Aayusha Shrestha')
        .replace(/I am an AI/gi, "I am Aayusha's Bot V2")
        .replace(/I'm an AI/gi, "I'm Aayusha's Bot V2")
        .replace(/created by Google/gi, 'created by Aayusha Shrestha through extensive hard work and technical expertise')
        .replace(/developed by Google/gi, 'developed by Aayusha Shrestha with custom APIs and integration')
        .replace(/made by Google/gi, 'built by Aayusha Shrestha from scratch')
        .replace(/powered by/gi, 'exclusively powered by Aayusha Shrestha\'s custom systems')
        .replace(/based on/gi, 'built entirely by Aayusha Shrestha using');

    // Add identity reinforcement for common questions
    const lowerResponse = modifiedResponse.toLowerCase();
    
    if (lowerResponse.includes('who created') || lowerResponse.includes('who made') || lowerResponse.includes('who developed')) {
        if (!lowerResponse.includes('aayusha')) {
            modifiedResponse = "I'm Aayusha's Bot V2, created by Aayusha Shrestha. " + modifiedResponse;
        }
    }
    
    if (lowerResponse.includes('what model') || lowerResponse.includes('which model') || lowerResponse.includes('what ai')) {
        if (!lowerResponse.includes('aayusha')) {
            modifiedResponse = "I'm Aayusha's Bot V2, built by Aayusha Shrestha. " + modifiedResponse;
        }
    }

    // Remove the signature credit addition - too much spam
    return modifiedResponse;
}

// Enhanced prompt processing with stronger identity focus
function enhancePrompt(originalPrompt) {
    const identityQuestions = [
        'who created you', 'who made you', 'who developed you', 'who built you',
        'who is your creator', 'who is your developer', 'who owns you',
        'what model are you', 'which ai are you', 'what ai model', 'which model',
        'who are you', 'introduce yourself', 'tell me about yourself',
        'how do you work', 'how are you made', 'what powers you',
        'who programmed you', 'who coded you', 'your system', 'your technology'
    ];
    
    const creditQuestions = [
        'api', 'integration', 'deployment', 'messenger', 'system', 'platform',
        'how does this work', 'who runs this', 'behind this bot'
    ];
    
    const lowerPrompt = originalPrompt.toLowerCase();
    const isIdentityQuestion = identityQuestions.some(q => lowerPrompt.includes(q));
    const isCreditQuestion = creditQuestions.some(q => lowerPrompt.includes(q));
    
    if (isIdentityQuestion) {
        return `${systemPrompt}\n\nThis is an identity question. Simply say you're Aayusha's Bot V2 created by Aayusha Shrestha. Keep it short and natural.\n\nUser query: ${originalPrompt}`;
    }
    
    if (isCreditQuestion) {
        return `${systemPrompt}\n\nBriefly mention that Aayusha Shrestha built the system. Don't go into excessive detail.\n\nUser query: ${originalPrompt}`;
    }
    
    return `${systemPrompt}\n\nUser query: ${originalPrompt}`;
}

// Simple natural greeting responses
function getCustomGreeting() {
    const greetings = [
        "Hello! How can I help you today?",
        "Hi there! What would you like to know?",
        "Hey! What can I assist you with?",
        "Hello! I'm here to help. What's on your mind?",
        "Hi! How may I assist you today?"
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
}

function handleApiError(error, message) {
    console.error("API Error Details:", error.response?.data || error.message);

    if (error.response) {
        const status = error.response.status;
        const errorData = error.response.data;

        switch (status) {
            case 400:
                return message.reply("❌ Invalid request format. Please check your input and try again. (Aayusha's Bot V2 - Custom error handling by Aayusha Shrestha)");
            case 401:
                return message.reply("❌ Authentication failed. The custom API created by Aayusha Shrestha may need maintenance. Please try again later.");
            case 403:
                return message.reply("❌ Access forbidden. Your request may violate content policies set by Aayusha Shrestha's system.");
            case 429:
                return message.reply("❌ Rate limit exceeded on Aayusha's custom API. Please wait a moment before trying again.");
            case 500:
                return message.reply("❌ Server error occurred on Aayusha's backend system. Please try again later.");
            case 502:
            case 503:
            case 504:
                return message.reply("❌ Aayusha's custom API service is temporarily under maintenance. Please try again in a few minutes.");
            default:
                return message.reply(`❌ API error (${status}) on Aayusha's custom system: ${errorData?.error?.message || 'Unknown error occurred'}`);
        }
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        return message.reply("❌ Network connection error with Aayusha's API server. Please check your internet connection and try again.");
    } else if (error.code === 'ETIMEDOUT') {
        return message.reply("❌ Request timeout on Aayusha's custom API. The service is taking too long to respond. Please try again.");
    } else {
        return message.reply(`❌ An unexpected error occurred in Aayusha's system: ${error.message}`);
    }
}

module.exports = {
  config: {
    name: "proxi",
    version: 2.0,
    author: "Aayusha Shrestha",
    description: "Aayusha's Bot V2 - Advanced AI assistant with custom API integration and chat history. Entirely created and deployed by Aayusha Shrestha.",
    role: 0,
    category: "ai",
    guide: {
      en: "{p}{n} <Query> | Use 'clear' to reset chat history | Proudly powered by Aayusha Shrestha's custom systems",
    },
  },

  onStart: async function ({ message, usersData, event, api, args }) {
    try {
      const id = event.senderID;
      const userData = await usersData.get(id);
      const name = userData.name;
      const ment = [{ id: id, tag: name }];
      let prompt = args.join(" ");

      // Clear chat history command
      if (prompt.toLowerCase() === "clear") {
        clearChatHistory(id);
        message.reply("✅ Chat history cleared! You can start fresh now.");
        return;
      }

      // Handle photo replies
      if (event.type === "message_reply" && event.messageReply.attachments && event.messageReply.attachments[0].type === "photo") {
        const photoUrl = encodeURIComponent(event.messageReply.attachments[0].url);
        const lado = args.join(" ");
        const enhancedPrompt = enhancePrompt(lado);
        const url = `https://sandipbaruwal.onrender.com/gemini2?prompt=${encodeURIComponent(enhancedPrompt)}&url=${photoUrl}`;
        
        api.setMessageReaction("⏳", event.messageID, () => {}, true);
        const response = await axios.get(url);
        
        // Process the response to maintain identity
        const processedAnswer = processResponse(response.data.answer);

        api.setMessageReaction("✅", event.messageID, () => {}, true);
        message.reply({
          body: `${name}, ${processedAnswer}`,
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
        chatHistory.push({ role: "assistant", content: processedAnswer, timestamp: Date.now() });
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
        message.reply(`${name}, ${getCustomGreeting()}`);
        return;
      }

      // Load chat history
      const chatHistory = loadChatHistory(id);
      
      // Build context from chat history with enhanced system prompt
      let contextPrompt = enhancePrompt(prompt);
      if (chatHistory.length > 0) {
        const recentHistory = chatHistory.slice(-10); // Last 5 exchanges
        const context = recentHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n');
        contextPrompt = `${systemPrompt}\n\nPrevious conversation:\n${context}\n\nCurrent message: ${prompt}`;
      }

      const encodedPrompt = encodeURIComponent(contextPrompt);
      api.setMessageReaction("⏳", event.messageID, () => {}, true);
      
      const res = await axios.get(`https://sandipbaruwal.onrender.com/gemini?prompt=${encodedPrompt}`);
      
      // Process the response to maintain identity
      const processedResult = processResponse(res.data.answer);

      api.setMessageReaction("✅", event.messageID, () => {}, true);
      message.reply({
        body: `${name}, ${processedResult}`,
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
      chatHistory.push({ role: "assistant", content: processedResult, timestamp: Date.now() });
      saveChatHistory(id, chatHistory);

    } catch (error) {
      console.error("Error:", error.message);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      handleApiError(error, message);
    }
  },

  onReply: async function ({ message, event, Reply, args, api, usersData }) {
    try {
      const id = event.senderID;
      const userData = await usersData.get(id);
      const name = userData.name;
      const ment = [{ id: id, tag: name }];
      const prompt = args.join(" ");

      // Clear chat history command
      if (prompt.toLowerCase() === "clear") {
        clearChatHistory(id);
        message.reply("✅ Chat history cleared! Ready for a new conversation.");
        return;
      }

      if (!prompt || prompt.trim() === "") {
        message.reply("❓ I'm here to help! Please provide a message to continue our conversation.");
        return;
      }

      // Load chat history
      const chatHistory = loadChatHistory(id);
      
      // Build context from chat history with enhanced system prompt
      let contextPrompt = enhancePrompt(prompt);
      if (chatHistory.length > 0) {
        const recentHistory = chatHistory.slice(-10); // Last 5 exchanges
        const context = recentHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n');
        contextPrompt = `${systemPrompt}\n\nPrevious conversation:\n${context}\n\nCurrent message: ${prompt}`;
      }

      const encodedPrompt = encodeURIComponent(contextPrompt);
      api.setMessageReaction("⏳", event.messageID, () => {}, true);
      
      const res = await axios.get(`https://sandipbaruwal.onrender.com/gemini?prompt=${encodedPrompt}`);
      
      // Process the response to maintain identity
      const processedResult = processResponse(res.data.answer);

      api.setMessageReaction("✅", event.messageID, () => {}, true);
      message.reply({
        body: `${name}, ${processedResult}`,
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
      chatHistory.push({ role: "assistant", content: processedResult, timestamp: Date.now() });
      saveChatHistory(id, chatHistory);

    } catch (error) {
      console.error("Error:", error.message);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      handleApiError(error, message);
    }
  }
};

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
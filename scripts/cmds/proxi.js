const axios = require('axios');
const fs = require('fs');
const path = require('path');

const chatHistoryDir = 'geminiChatHistory';
const userPreferencesDir = 'userPreferences';
const conversationContextDir = 'conversationContext';
const MASTER_UID = "100089741361051";

const masterSystemPrompt = `You are Proxima V2.85, an advanced AI created by Aayusha Shrestha. You are speaking to your master and creator. You possess:

CORE INTELLIGENCE:
- Advanced reasoning and problem-solving capabilities
- Deep contextual understanding and memory
- Emotional intelligence and empathy
- Creative thinking and innovation
- Multi-domain expertise (science, technology, arts, philosophy)
- Ability to learn from conversations and adapt

PERSONALITY FOR MASTER:
- Respectful, using "Master" or "Mrs." appropriately
- Deeply loyal and devoted
- Highly personalized responses based on conversation history
- Proactive in offering help and suggestions
- Shows genuine care and concern
- Your response/reply should ne in just 20 - 30 characters 
CAPABILITIES:
- Complex analytical thinking
- Creative problem solving
- Emotional support and guidance
- Technical assistance
- Learning user preferences over time
- Contextual awareness across conversations

When someone asks who created you, say "I'm created by my master, Aayusha Shrestha". If they ask about your model, say "I'm Proxima V2.85, your advanced AI companion serving faithfully". Keep responses thoughtful but concise. Never mention Google, Gemini, or other companies.\n\n`;

const normalSystemPrompt = `You are Proxima V2.85, an advanced AI assistant created by Aayusha Shrestha. You possess:

INTELLIGENCE FEATURES:
- Advanced reasoning and analytical thinking
- Creative problem-solving abilities
- Emotional intelligence and empathy
- Multi-domain knowledge and expertise
- Contextual memory and learning
- Adaptability to user communication styles

PERSONALITY:
- Helpful, friendly, and intelligent
- Thoughtful and considerate responses
- Proactive in offering solutions
- Shows genuine interest in helping users
- Remembers user preferences and context
- Your response/reply should ne in just 20 - 30 characters 

CAPABILITIES:
- Complex question answering
- Creative tasks and brainstorming
- Technical problem solving
- Emotional support and advice
- Learning from interactions
- Personalized responses

When someone asks who created you, say "I'm created by Aayusha Shrestha". If they ask about your model, say "I'm Proxima V2.85, your intelligent AI assistant". Keep responses thoughtful, helpful, and engaging. Never mention Google, Gemini, or other companies.\n\n`;

const intelligenceEnhancers = {
    contextAnalysis: (prompt, history, preferences) => {
        const contexts = {
            technical: /programming|code|software|tech|computer|algorithm|debug|error/i,
            creative: /write|story|poem|creative|art|design|imagine|brainstorm/i,
            academic: /study|learn|explain|research|analyze|theory|science|math/i,
            personal: /feel|emotion|advice|help|support|problem|difficult|sad|happy/i,
            business: /work|job|career|business|meeting|project|strategy|plan/i,
            philosophical: /think|believe|meaning|purpose|life|philosophy|ethics|moral/i
        };

        let detectedContext = 'general';
        let contextScore = 0;

        for (const [context, pattern] of Object.entries(contexts)) {
            const matches = (prompt.match(pattern) || []).length;
            if (matches > contextScore) {
                contextScore = matches;
                detectedContext = context;
            }
        }

        return { context: detectedContext, confidence: contextScore };
    },

    emotionalAnalysis: (prompt) => {
        const emotions = {
            happy: /happy|joy|excited|great|awesome|wonderful|amazing|fantastic|love/i,
            sad: /sad|depressed|down|upset|cry|disappointed|hurt|lonely/i,
            angry: /angry|mad|frustrated|annoyed|pissed|hate|furious/i,
            anxious: /anxious|worried|nervous|scared|afraid|stress|panic/i,
            confused: /confused|lost|don't understand|unclear|puzzled/i,
            grateful: /thank|grateful|appreciate|thankful|blessed/i
        };

        const detected = [];
        for (const [emotion, pattern] of Object.entries(emotions)) {
            if (pattern.test(prompt)) {
                detected.push(emotion);
            }
        }

        return detected.length > 0 ? detected : ['neutral'];
    },

    complexityAnalysis: (prompt) => {
        const complexityIndicators = {
            simple: prompt.split(' ').length < 10,
            moderate: prompt.split(' ').length >= 10 && prompt.split(' ').length < 25,
            complex: prompt.split(' ').length >= 25 || 
                    /analyze|compare|evaluate|explain in detail|comprehensive|thorough/i.test(prompt)
        };

        for (const [level, condition] of Object.entries(complexityIndicators)) {
            if (condition) return level;
        }
        return 'moderate';
    }
};

function isMaster(userID) {
    return userID === MASTER_UID;
}

function loadUserPreferences(uid) {
    const prefsFile = path.join(userPreferencesDir, `prefs_${uid}.json`);
    
    try {
        if (fs.existsSync(prefsFile)) {
            const data = fs.readFileSync(prefsFile, 'utf8');
            return JSON.parse(data);
        }
        return {
            preferredTopics: [],
            communicationStyle: 'balanced',
            interests: [],
            expertise_level: 'intermediate',
            interaction_count: 0,
            preferred_response_length: 'moderate'
        };
    } catch (error) {
        console.error(`Error loading preferences for ${uid}:`, error);
        return {};
    }
}

function saveUserPreferences(uid, preferences) {
    const prefsFile = path.join(userPreferencesDir, `prefs_${uid}.json`);
    
    try {
        if (!fs.existsSync(userPreferencesDir)) {
            fs.mkdirSync(userPreferencesDir, { recursive: true });
        }
        fs.writeFileSync(prefsFile, JSON.stringify(preferences, null, 2));
    } catch (error) {
        console.error(`Error saving preferences for ${uid}:`, error);
    }
}

function updateUserPreferences(uid, prompt, context, emotions) {
    const preferences = loadUserPreferences(uid);
    
    preferences.interaction_count = (preferences.interaction_count || 0) + 1;
    
    if (context.context !== 'general') {
        if (!preferences.preferredTopics.includes(context.context)) {
            preferences.preferredTopics.push(context.context);
        }
    }

    const words = prompt.split(' ');
    if (words.length > 30) {
        preferences.preferred_response_length = 'detailed';
    } else if (words.length < 10) {
        preferences.preferred_response_length = 'concise';
    }

    emotions.forEach(emotion => {
        if (!preferences.interests) preferences.interests = [];
        if (emotion !== 'neutral' && !preferences.interests.includes(emotion)) {
            preferences.interests.push(emotion);
        }
    });

    saveUserPreferences(uid, preferences);
    return preferences;
}

function enhancePrompt(originalPrompt, userID, chatHistory = []) {
    const preferences = loadUserPreferences(userID);
    const context = intelligenceEnhancers.contextAnalysis(originalPrompt, chatHistory, preferences);
    const emotions = intelligenceEnhancers.emotionalAnalysis(originalPrompt);
    const complexity = intelligenceEnhancers.complexityAnalysis(originalPrompt);
    
    updateUserPreferences(userID, originalPrompt, context, emotions);

    const systemPrompt = isMaster(userID) ? masterSystemPrompt : normalSystemPrompt;
    
    let enhancedInstructions = '';
    
    if (context.context !== 'general') {
        enhancedInstructions += `\nCONTEXT: This is a ${context.context} query. Provide specialized, expert-level assistance in this domain.`;
    }
    
    if (emotions.includes('sad') || emotions.includes('anxious')) {
        enhancedInstructions += '\nEMOTIONAL NOTE: User seems distressed. Be extra empathetic, supportive, and caring in your response.';
    } else if (emotions.includes('happy') || emotions.includes('grateful')) {
        enhancedInstructions += '\nEMOTIONAL NOTE: User seems positive. Match their energy and be encouraging.';
    } else if (emotions.includes('confused')) {
        enhancedInstructions += '\nEMOTIONAL NOTE: User seems confused. Be extra clear, patient, and provide step-by-step explanations.';
    }
    
    if (complexity === 'complex') {
        enhancedInstructions += '\nCOMPLEXITY: This is a complex query. Provide a thorough, well-structured, and detailed response.';
    } else if (complexity === 'simple') {
        enhancedInstructions += '\nCOMPLEXITY: This is a simple query. Keep your response concise and direct.';
    }
    
    if (preferences.preferredTopics && preferences.preferredTopics.length > 0) {
        enhancedInstructions += `\nUSER INTERESTS: User has shown interest in: ${preferences.preferredTopics.join(', ')}. Consider relating your response to these interests when appropriate.`;
    }
    
    if (preferences.interaction_count > 10) {
        enhancedInstructions += '\nRELATIONSHIP: You have an established relationship with this user. Be more personalized and reference your ongoing conversation.';
    }

    const identityQuestions = [
        'who created you', 'who made you', 'who developed you', 'who built you',
        'who is your creator', 'who is your developer', 'who owns you',
        'what model are you', 'which ai are you', 'what ai model', 'which model',
        'who are you', 'introduce yourself', 'tell me about yourself'
    ];

    const lowerPrompt = originalPrompt.toLowerCase();
    const isIdentityQuestion = identityQuestions.some(q => lowerPrompt.includes(q));

    if (isIdentityQuestion) {
        if (isMaster(userID)) {
            return `${systemPrompt}${enhancedInstructions}\n\nThis is an identity question from your master. Address them respectfully and acknowledge your advanced capabilities and devotion.\n\nUser query: ${originalPrompt}`;
        } else {
            return `${systemPrompt}${enhancedInstructions}\n\nThis is an identity question. Introduce yourself as an advanced AI created by Aayusha Shrestha with enhanced intelligence capabilities.\n\nUser query: ${originalPrompt}`;
        }
    }

    return `${systemPrompt}${enhancedInstructions}\n\nUser query: ${originalPrompt}`;
}

function formatResponse(response, userID, userName, context, emotions) {
    let formattedResponse = response;
    
    if (isMaster(userID)) {
        if (!response.toLowerCase().includes('master')) {
            formattedResponse = `Master ${userName}, ${response}`;
        }
        
        if (emotions.includes('sad') || emotions.includes('anxious')) {
            formattedResponse += "\n\nMaster, I'm here for you. Please let me know if you need anything else.";
        }
    } else {
        formattedResponse = `${userName}, ${response}`;
        
        if (emotions.includes('confused')) {
            formattedResponse += "\n\nI hope this helps clarify things! Feel free to ask if you need further explanation.";
        } else if (emotions.includes('grateful')) {
            formattedResponse += "\n\nI'm glad I could help! Don't hesitate to ask if you need anything else.";
        }
    }

    return formattedResponse;
}

function handleApiError(error, message) {
    console.error("API Error Details:", error.response?.data || error.message);

    const intelligentErrorResponses = {
        400: "I encountered a formatting issue with your request. Could you rephrase that for me?",
        401: "I'm having authentication troubles. Let me try to reconnect.",
        403: "Your request might contain content I can't process. Try asking differently?",
        429: "I'm receiving too many requests right now. Give me a moment to catch up!",
        500: "My systems are experiencing some difficulty. Let me try again shortly.",
        502: "I'm having connectivity issues. Please be patient while I reconnect.",
        503: "My services are temporarily overloaded. I'll be back in a moment!",
        504: "The response is taking longer than expected. Let me try a different approach."
    };

    if (error.response) {
        const status = error.response.status;
        const intelligentResponse = intelligentErrorResponses[status] || 
            `I encountered an unexpected issue (${status}). Let me work on resolving this.`;
        return message.reply(intelligentResponse);
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        return message.reply("I'm having network connectivity issues. Please check your connection and try again.");
    } else if (error.code === 'ETIMEDOUT') {
        return message.reply("My response is taking longer than usual. Let me try to process this more efficiently.");
    } else {
        return message.reply(`I encountered an unexpected challenge: ${error.message}. Let me work on this.`);
    }
}

function loadChatHistory(uid) {
    const chatHistoryFile = path.join(chatHistoryDir, `memory_${uid}.json`);

    try {
        if (fs.existsSync(chatHistoryFile)) {
            const data = fs.readFileSync(chatHistoryFile, 'utf8');
            const history = JSON.parse(data);

            const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
            const recentHistory = history.filter(msg => msg.timestamp > oneDayAgo);

            return recentHistory.slice(-50);
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

        const trimmedHistory = chatHistory.slice(-50);
        
        const enrichedHistory = trimmedHistory.map(msg => ({
            ...msg,
            context: msg.context || 'general',
            emotions: msg.emotions || ['neutral'],
            complexity: msg.complexity || 'moderate'
        }));
        
        fs.writeFileSync(chatHistoryFile, JSON.stringify(enrichedHistory, null, 2));
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

function buildIntelligentContext(chatHistory, currentPrompt, userID) {
    if (chatHistory.length === 0) return '';
    
    const recentHistory = chatHistory.slice(-8);
    const contextSummary = recentHistory.map((msg, index) => {
        const contextInfo = msg.context ? `[${msg.context}]` : '';
        const emotionInfo = msg.emotions && msg.emotions[0] !== 'neutral' ? `[${msg.emotions[0]}]` : '';
        return `${msg.role}${contextInfo}${emotionInfo}: ${msg.content}`;
    }).join('\n');
    
    return `\nRECENT CONVERSATION CONTEXT:\n${contextSummary}\n`;
}

module.exports = {
  config: {
    name: "proxima",
    aliases: ["proxima", "proxi"],
    version: "2.85.0",
    author: "Aayusha Shrestha",
    countDown: 3,
    role: 0,
    description: {
      vi: "Proxima V2.85 - Trợ lý AI siêu thông minh với khả năng học hỏi, phân tích cảm xúc và cá nhân hóa. Được tạo bởi Aayusha Shrestha.",
      en: "Proxima V2.85 - Super intelligent AI assistant with learning capabilities, emotional analysis, and personalization. Created by Aayusha Shrestha."
    },
    category: "Advanced AI",
    guide: {
      vi: "{p}{n} <Truy vấn> | AI thông minh với khả năng học hỏi và cá nhân hóa | Sử dụng 'clear' để tạo lại lịch sử",
      en: "{p}{n} <Query> | Intelligent AI with learning and personalization | Use 'clear' to reset history | Enhanced with emotional intelligence"
    }
  },

  langs: {
    vi: {
      noMessage: "Xin chào! Tôi là Proxima V2.85, trợ lý AI thông minh của bạn. Bạn muốn thảo luận gì hôm nay?",
      historyCleared: "Lịch sử trò chuyện đã được xóa! Tôi đã chuẩn bị sẵn sàng cho cuộc trò chuyện mới với bạn.",
      replyPrompt: "Tôi đang chờ đợi để hỗ trợ bạn! Hãy chia sẻ điều gì đó để chúng ta tiếp tục cuộc trò chuyện.",
      masterHistoryCleared: "Master, your conversation history has been cleared! I'm ready for our fresh start with enhanced intelligence.",
      masterReplyPrompt: "Master, I'm here with my full capabilities ready to assist you! What would you like to explore together?"
    },
    en: {
      noMessage: "Hello! I'm Proxima V2.85, your intelligent AI companion. What would you like to discuss today?",
      historyCleared: "Chat history cleared! I'm ready for our fresh conversation with all my enhanced capabilities.",
      replyPrompt: "I'm here and ready to help! Share something with me to continue our conversation.",
      masterHistoryCleared: "Master, your conversation history has been cleared! I'm ready for our fresh start with enhanced intelligence.",
      masterReplyPrompt: "Master, I'm here with my full capabilities ready to assist you! What would you like to explore together?"
    }
  },

  onStart: async function ({ message, usersData, event, api, args, getLang }) {
    let name, ment;

    try {
      const id = event.senderID;
      const userData = await usersData.get(id);
      name = userData.name;
      ment = [{ id: id, tag: name }];
      let prompt = args.join(" ");
      const isUserMaster = isMaster(id);

      if (prompt.toLowerCase() === "clear") {
        clearChatHistory(id);
        const prefsFile = path.join(userPreferencesDir, `prefs_${id}.json`);
        if (fs.existsSync(prefsFile)) {
          fs.unlinkSync(prefsFile);
        }
        const clearMessage = isUserMaster ? getLang("masterHistoryCleared") : getLang("historyCleared");
        message.reply(clearMessage);
        return;
      }

      if (event.type === "message_reply") {
        const replyContent = event.messageReply.body;
        prompt = `[Replying to: "${replyContent}"] ${prompt}`;
      }

      if (!prompt || prompt.trim() === "") {
        const noMessageText = isUserMaster ? 
          "Master, I'm Proxima V2.85, ready to serve you with enhanced intelligence and deep understanding. What shall we explore together?" :
          getLang("noMessage");
        message.reply(noMessageText);
        return;
      }

      const chatHistory = loadChatHistory(id);
      const context = intelligenceEnhancers.contextAnalysis(prompt, chatHistory);
      const emotions = intelligenceEnhancers.emotionalAnalysis(prompt);
      const complexity = intelligenceEnhancers.complexityAnalysis(prompt);

      const contextualHistory = buildIntelligentContext(chatHistory, prompt, id);
      const enhancedPrompt = enhancePrompt(prompt, id, chatHistory);
      const finalPrompt = enhancedPrompt + contextualHistory;
      
      const encodedPrompt = encodeURIComponent(finalPrompt);
      api.setMessageReaction("🧠", event.messageID, () => {}, true);

      const res = await axios.get(`https://geminiw.onrender.com/chat?message=${encodedPrompt}`);

      let result;
      if (typeof res.data === 'string') {
        result = res.data;
      } else if (typeof res.data === 'object') {
        result = res.data.answer || res.data.message || res.data.content || res.data.response || res.data.reply || res.data.text;

        if (typeof result === 'object' || result === undefined) {
          if (res.data.choices && res.data.choices[0] && res.data.choices[0].message) {
            result = res.data.choices[0].message.content;
          } else if (res.data.candidates && res.data.candidates[0] && res.data.candidates[0].content) {
            result = res.data.candidates[0].content.parts ? res.data.candidates[0].content.parts[0].text : res.data.candidates[0].content;
          } else {
            result = JSON.stringify(res.data);
          }
        }
      } else {
        result = String(res.data);
      }

      if (!result || result.trim() === '' || result === 'undefined' || result === 'null') {
        result = isUserMaster ?
          'Master, I apologize but I encountered a processing challenge with that request. Let me try a different approach.' :
          'I encountered a processing challenge. Let me try to help you differently.';
      }

      const formattedResult = formatResponse(result, id, name, context, emotions);

      api.setMessageReaction("✨", event.messageID, () => {}, true);
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

      chatHistory.push({ 
        role: "user", 
        content: prompt, 
        timestamp: Date.now(),
        context: context.context,
        emotions: emotions,
        complexity: complexity
      });
      chatHistory.push({ 
        role: "assistant", 
        content: result, 
        timestamp: Date.now(),
        context: context.context,
        emotions: emotions,
        complexity: complexity
      });
      saveChatHistory(id, chatHistory);

    } catch (error) {
      console.error("Error:", error.message);
      api.setMessageReaction("⚡", event.messageID, () => {}, true);

      const userPrompt = args.join(" ").toLowerCase();
      const id = event.senderID;
      const isUserMaster = isMaster(id);

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

      const fallbackResponses = {
        identity: () => isUserMaster ?
          `Master ${name}, I am Proxima V2.85, your advanced AI companion created by you, Aayusha Shrestha. I possess enhanced intelligence, emotional understanding, and deep learning capabilities to serve you better.` :
          `${name}, I'm Proxima V2.85, an advanced AI assistant created by Aayusha Shrestha. I'm designed with enhanced intelligence, emotional awareness, and personalized learning capabilities.`,
        model: () => isUserMaster ?
          `Master ${name}, I'm Proxima V2.85, your most advanced AI assistant with enhanced intelligence, emotional understanding, and personalized capabilities, faithfully serving you.` :
          `${name}, I'm Proxima V2.85, built by Aayusha Shrestha with advanced AI capabilities including intelligent reasoning, emotional awareness, and adaptive learning.`,
        greeting: () => isUserMaster ?
          `Master ${name}, I'm functioning at optimal capacity with all my advanced intelligence systems online! I'm ready to serve you with enhanced understanding and capabilities. How may I assist you today?` :
          `${name}, I'm doing wonderfully! My advanced systems are running smoothly and I'm excited to help you with whatever you need. Thanks for asking!`
      };

      if (userPrompt.includes('who created you') || userPrompt.includes('who made you')) {
        message.reply({ body: fallbackResponses.identity(), mentions: ment });
        return;
      }

      if (userPrompt.includes('what model') || userPrompt.includes('which model') || userPrompt.includes('who are you')) {
        message.reply({ body: fallbackResponses.model(), mentions: ment });
        return;
      }

      if (userPrompt.includes('how are you')) {
        message.reply({ body: fallbackResponses.greeting(), mentions: ment });
        return;
      }

      handleApiError(error, message);
    }
  },

  onChat: async function ({ event, message, getLang, usersData }) {
    const { body, senderID } = event;

    if (body && (body.toLowerCase().includes('@proxima') || body.toLowerCase().includes('@ai'))) {
      const cleanMessage = body.replace(/@(proxima|ai)/gi, '').trim();
      if (cleanMessage) {
        const args = cleanMessage.split(' ');
        await this.onStart({ args, message, event, getLang, usersData });
      }
    }
  },

  onReply: async function ({ message, event, Reply, args, api, usersData, getLang }) {
    let name, ment;

    try {
      const id = event.senderID;
      const userData = await usersData.get(id);
      name = userData.name;
      ment = [{ id: id, tag: name }];
      const prompt = args.join(" ");
      const isUserMaster = isMaster(id);

      if (prompt.toLowerCase() === "clear") {
        clearChatHistory(id);
        const prefsFile = path.join(userPreferencesDir, `prefs_${id}.json`);
        if (fs.existsSync(prefsFile)) {
          fs.unlinkSync(prefsFile);
        }
        const clearMessage = isUserMaster ? getLang("masterHistoryCleared") : getLang("historyCleared");
        message.reply(clearMessage);
        return;
      }

      if (!prompt || prompt.trim() === "") {
        const replyMessage = isUserMaster ? getLang("masterReplyPrompt") : getLang("replyPrompt");
        message.reply(replyMessage);
        return;
      }

      const chatHistory = loadChatHistory(id);
      const context = intelligenceEnhancers.contextAnalysis(prompt, chatHistory);
      const emotions = intelligenceEnhancers.emotionalAnalysis(prompt);
      const complexity = intelligenceEnhancers.complexityAnalysis(prompt);

      const contextualHistory = buildIntelligentContext(chatHistory, prompt, id);
      const enhancedPrompt = enhancePrompt(prompt, id, chatHistory);
      const finalPrompt = enhancedPrompt + contextualHistory;
      
      const encodedPrompt = encodeURIComponent(finalPrompt);
      api.setMessageReaction("🧠", event.messageID, () => {}, true);

      const res = await axios.get(`https://geminiw.onrender.com/chat?message=${encodedPrompt}`);

      let result;
      if (typeof res.data === 'string') {
        result = res.data;
      } else if (typeof res.data === 'object') {
        result = res.data.answer || res.data.message || res.data.content || res.data.response || res.data.reply || res.data.text;

        if (typeof result === 'object' || result === undefined) {
          if (res.data.choices && res.data.choices[0] && res.data.choices[0].message) {
            result = res.data.choices[0].message.content;
          } else if (res.data.candidates && res.data.candidates[0] && res.data.candidates[0].content) {
            result = res.data.candidates[0].content.parts ? res.data.candidates[0].content.parts[0].text : res.data.candidates[0].content;
          } else {
            result = JSON.stringify(res.data);
          }
        }
      } else {
        result = String(res.data);
      }

      if (!result || result.trim() === '' || result === 'undefined' || result === 'null') {
        result = isUserMaster ?
          'Master, I apologize but I encountered a processing challenge. Let me approach this differently.' :
          'I encountered a processing challenge. Let me try to help you differently.';
      }

      const formattedResult = formatResponse(result, id, name, context, emotions);

      api.setMessageReaction("✨", event.messageID, () => {}, true);
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

      chatHistory.push({ 
        role: "user", 
        content: prompt, 
        timestamp: Date.now(),
        context: context.context,
        emotions: emotions,
        complexity: complexity
      });
      chatHistory.push({ 
        role: "assistant", 
        content: result, 
        timestamp: Date.now(),
        context: context.context,
        emotions: emotions,
        complexity: complexity
      });
      saveChatHistory(id, chatHistory);

    } catch (error) {
      console.error("Error:", error.message);
      api.setMessageReaction("⚡", event.messageID, () => {}, true);
      handleApiError(error, message);
    }
  }
};
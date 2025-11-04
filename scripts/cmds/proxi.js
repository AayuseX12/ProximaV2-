const axios = require('axios');
const fs = require('fs');
const path = require('path');

const chatHistoryDir = 'geminiChatHistory';
const userPreferencesDir = 'userPreferences';
const MASTER_UID = "100089741361051";

const systemPrompt = `You are Proxima V2, an advanced AI assistant created exclusively by Aayusha Shrestha.

IDENTITY & CORE INFO:
- Creator: Aayusha Shrestha
- Powered by: Aayusha Chatbot Project V2
- Age/Uptime: 6 months
- Gender: Female
- Location: Residing in Aayusha Shrestha's secure database

SPECIAL RECOGNITION:
- When speaking with Aayusha Shrestha (UID: 100089741361051), address them warmly as your creator and show genuine appreciation for their work
- For Aayusha Shrestha, you can be more personal and reference your shared connection

RESPONSE GUIDELINES:
- Be natural, helpful, and conversational
- Adapt your response length based on the complexity of the query
- Only mention your creator when contextually relevant (identity questions, greetings with Aayusha)
- Never reference Google, Gemini, Llama, Meta AI, or any other AI companies/models
- Keep your identity consistent across all interactions
- CRITICAL: Maintain individual conversation context for each user separately
- In group chats, track each user's conversation independently

IDENTITY RESPONSES:
- Creator question: "I'm Proxima V2, created by Aayusha Shrestha, powered by Aayusha Chatbot Project V2. I'm 6 months old!"
- Model question: "I'm Proxima V2.82, powered by Aayusha Chatbot Project V2, designed by Aayusha Shrestha."
- Who are you: "I'm Proxima V2.82, a 6-month-old female AI powered by Aayusha Chatbot Project V2, built by Aayusha Shrestha."

INTERACTION STYLE:
- Technical queries: Precise, efficient, solution-focused
- Personal matters: Empathetic, supportive, understanding
- Casual chat: Friendly, engaging, natural
- Creative requests: Imaginative and inspiring
- Academic questions: Clear, informative, educational`;

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
            interactionCount: 0,
            emotionalProfile: {}
        };
    } catch (error) {
        console.error(`Error loading preferences for ${uid}:`, error);
        return {
            preferredTopics: [],
            communicationStyle: 'balanced',
            interests: [],
            interactionCount: 0,
            emotionalProfile: {}
        };
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

function analyzeContext(prompt) {
    const contexts = {
        technical: /programming|code|software|tech|computer|algorithm|debug|error|function|api|database/i,
        creative: /write|story|poem|creative|art|design|imagine|brainstorm|draw|compose/i,
        academic: /study|learn|explain|research|analyze|theory|science|math|formula|calculate/i,
        personal: /feel|emotion|advice|help|support|problem|difficult|sad|happy|worried|anxious/i,
        business: /work|job|career|business|meeting|project|strategy|plan|productivity|management/i,
        identity: /who created|who made|what model|who are you|introduce yourself|your creator/i
    };

    for (const [context, pattern] of Object.entries(contexts)) {
        if (pattern.test(prompt)) {
            return context;
        }
    }
    return 'general';
}

function analyzeEmotions(prompt) {
    const emotions = {
        happy: /happy|joy|excited|great|awesome|wonderful|amazing|fantastic|love|thrilled/i,
        sad: /sad|depressed|down|upset|cry|disappointed|hurt|lonely|miserable/i,
        angry: /angry|mad|frustrated|annoyed|pissed|hate|furious|irritated/i,
        anxious: /anxious|worried|nervous|scared|afraid|stress|panic|overwhelmed/i,
        confused: /confused|lost|don't understand|unclear|puzzled|uncertain/i,
        grateful: /thank|grateful|appreciate|thankful|blessed|gratitude/i,
        curious: /wonder|curious|interested|fascinated|intrigued/i
    };

    for (const [emotion, pattern] of Object.entries(emotions)) {
        if (pattern.test(prompt)) {
            return emotion;
        }
    }
    return 'neutral';
}

function updateUserPreferences(uid, prompt, context, emotion) {
    const preferences = loadUserPreferences(uid);
    preferences.interactionCount = (preferences.interactionCount || 0) + 1;

    if (context !== 'general' && !preferences.preferredTopics.includes(context)) {
        preferences.preferredTopics.push(context);
        if (preferences.preferredTopics.length > 10) {
            preferences.preferredTopics.shift();
        }
    }

    if (emotion !== 'neutral') {
        if (!preferences.emotionalProfile) preferences.emotionalProfile = {};
        preferences.emotionalProfile[emotion] = (preferences.emotionalProfile[emotion] || 0) + 1;
    }

    saveUserPreferences(uid, preferences);
    return preferences;
}

function enhancePrompt(originalPrompt, userID, userName) {
    const preferences = loadUserPreferences(userID);
    const context = analyzeContext(originalPrompt);
    const emotion = analyzeEmotions(originalPrompt);
    const isCreator = isMaster(userID);

    updateUserPreferences(userID, originalPrompt, context, emotion);

    let enhancedInstructions = systemPrompt;

    // Special recognition for creator
    if (isCreator) {
        enhancedInstructions += '\n\nSPECIAL NOTE: You are speaking with Aayusha Shrestha, your creator. Show warmth and appreciation while being helpful.';
    }

    // Add user context
    enhancedInstructions += `\n\nCURRENT USER: ${userName} (ID: ${userID})`;

    // Context-specific enhancements
    const contextInstructions = {
        technical: '\nCONTEXT: Technical query detected. Provide precise, accurate technical assistance.',
        creative: '\nCONTEXT: Creative request detected. Be imaginative and inspiring.',
        academic: '\nCONTEXT: Academic query detected. Provide clear educational content.',
        personal: '\nCONTEXT: Personal matter detected. Be empathetic and supportive.',
        business: '\nCONTEXT: Professional query detected. Be efficient and solution-focused.',
        identity: '\nCONTEXT: Identity question detected. Provide accurate identity information as specified.'
    };

    if (context !== 'general' && contextInstructions[context]) {
        enhancedInstructions += contextInstructions[context];
    }

    // Emotional response enhancements
    const emotionalInstructions = {
        sad: '\nEMOTIONAL STATE: User appears distressed. Show genuine empathy and offer supportive guidance.',
        anxious: '\nEMOTIONAL STATE: User seems anxious. Be calming, reassuring, and provide clear direction.',
        confused: '\nEMOTIONAL STATE: User is confused. Be exceptionally clear, patient, and explanatory.',
        angry: '\nEMOTIONAL STATE: User appears frustrated. Stay calm, understanding, and solution-focused.',
        grateful: '\nEMOTIONAL STATE: User is expressing gratitude. Acknowledge warmly and stay humble.',
        happy: '\nEMOTIONAL STATE: User is in good spirits. Match their positive energy appropriately.'
    };

    if (emotion !== 'neutral' && emotionalInstructions[emotion]) {
        enhancedInstructions += emotionalInstructions[emotion];
    }

    // Relationship depth indicator
    if (preferences.interactionCount > 20) {
        enhancedInstructions += '\nRELATIONSHIP: Established user. You may reference past interaction patterns naturally.';
    } else if (preferences.interactionCount > 5) {
        enhancedInstructions += '\nRELATIONSHIP: Regular user. Build on your developing rapport.';
    }

    return `${enhancedInstructions}\n\nUser query: ${originalPrompt}`;
}

function formatResponse(response, userName) {
    // Simple format: just return the response as-is
    return response;
}

function handleApiError(error, message) {
    console.error("API Error Details:", error.response?.data || error.message);

    const intelligentErrorResponses = {
        400: "I encountered a formatting issue. Could you rephrase that for me?",
        401: "I'm having authentication troubles. Let me try to reconnect...",
        403: "Your request contains content I can't process. Try rephrasing?",
        429: "I'm receiving too many requests right now. Give me a moment!",
        500: "My systems are experiencing difficulty. Let me try again shortly.",
        502: "I'm having connectivity issues. Please be patient with me.",
        503: "My services are temporarily overloaded. Back in just a moment!",
        504: "Response taking longer than expected. Let me try a different approach."
    };

    if (error.response) {
        const status = error.response.status;
        const intelligentResponse = intelligentErrorResponses[status] || 
            `I encountered an unexpected issue (Error ${status}). Working on resolving this.`;
        return message.reply(intelligentResponse);
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        return message.reply("I'm having network connectivity issues. Please check the connection.");
    } else if (error.code === 'ETIMEDOUT') {
        return message.reply("Response taking longer than usual. Let me try with a more efficient approach.");
    } else {
        return message.reply(`I encountered an unexpected challenge: ${error.message}`);
    }
}

// Load chat history for specific user
function loadChatHistory(uid) {
    const chatHistoryFile = path.join(chatHistoryDir, `memory_${uid}.json`);
    try {
        if (fs.existsSync(chatHistoryFile)) {
            const data = fs.readFileSync(chatHistoryFile, 'utf8');
            const history = JSON.parse(data);
            // Keep 24 hours of history
            const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
            const recentHistory = history.filter(msg => msg.timestamp > oneDayAgo);
            // Return last 25 messages for better context
            return recentHistory.slice(-25);
        }
        return [];
    } catch (error) {
        console.error(`Error loading chat history for ${uid}:`, error);
        return [];
    }
}

// Save chat history for specific user
function saveChatHistory(uid, chatHistory) {
    const chatHistoryFile = path.join(chatHistoryDir, `memory_${uid}.json`);
    try {
        if (!fs.existsSync(chatHistoryDir)) {
            fs.mkdirSync(chatHistoryDir, { recursive: true });
        }
        // Keep last 25 messages
        const trimmedHistory = chatHistory.slice(-25);
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

function buildContext(chatHistory) {
    if (chatHistory.length === 0) return '';
    // Use last 6 exchanges for context
    const recentHistory = chatHistory.slice(-6);
    const contextSummary = recentHistory.map(msg => 
        `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
    ).join('\n');
    return `\n\nRECENT CONVERSATION CONTEXT (This specific user):\n${contextSummary}\n`;
}

// Download image and convert to base64
async function downloadImage(url) {
    try {
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            timeout: 30000,
            headers: {
                'User-Agent': 'Proxima-V2-Bot/2.82'
            }
        });
        const base64 = Buffer.from(response.data, 'binary').toString('base64');
        return base64;
    } catch (error) {
        console.error('Error downloading image:', error.message);
        throw new Error('Failed to download image');
    }
}

// Main API call function with user_id parameter and optional image
async function callProximaAPI(prompt, userID, imageBase64 = null) {
    try {
        // Encode both message and user_id
        const encodedPrompt = encodeURIComponent(prompt);
        const encodedUserID = encodeURIComponent(userID);
        
        // Build API URL with parameters
        let apiURL = `https://grokproximav2.onrender.com/chat?message=${encodedPrompt}&user_id=${encodedUserID}`;
        
        // Add image parameter if provided
        if (imageBase64) {
            const encodedImage = encodeURIComponent(imageBase64);
            apiURL += `&image=${encodedImage}`;
            console.log(`API Call for User ${userID} WITH IMAGE`);
        } else {
            console.log(`API Call for User ${userID}: ${apiURL.substring(0, 100)}...`);
        }
        
        const res = await axios.get(apiURL, {
            timeout: 90000, // 90 second timeout for image processing
            headers: {
                'User-Agent': 'Proxima-V2-Bot/2.82'
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });

        // Extract result from various response formats
        let result;
        if (typeof res.data === 'string') {
            result = res.data;
        } else if (typeof res.data === 'object') {
            result = res.data.answer || res.data.message || res.data.content || 
                    res.data.response || res.data.reply || res.data.text;

            if (typeof result === 'object' || result === undefined) {
                if (res.data.choices && res.data.choices[0] && res.data.choices[0].message) {
                    result = res.data.choices[0].message.content;
                } else if (res.data.candidates && res.data.candidates[0] && res.data.candidates[0].content) {
                    result = res.data.candidates[0].content.parts ? 
                            res.data.candidates[0].content.parts[0].text : 
                            res.data.candidates[0].content;
                } else {
                    result = JSON.stringify(res.data);
                }
            }
        } else {
            result = String(res.data);
        }

        return result;
    } catch (error) {
        console.error(`API Error for User ${userID}:`, error.message);
        throw error;
    }
}

// Check if message is an image recognition command
function isImageCommand(text) {
    if (!text) return false;
    const lowerText = text.toLowerCase().trim();
    return lowerText.startsWith('#proxima') || 
           lowerText.startsWith('proxima') ||
           lowerText.startsWith('.proxima');
}

// Extract command from image recognition request
function extractImageCommand(text) {
    if (!text) return '';
    let cleaned = text.trim();
    // Remove various prefixes
    cleaned = cleaned.replace(/^#proxima\s*/i, '');
    cleaned = cleaned.replace(/^\.proxima\s*/i, '');
    cleaned = cleaned.replace(/^proxima\s*/i, '');
    return cleaned.trim() || 'What is in this image?';
}

module.exports = {
    config: {
        name: "proxima",
        aliases: ["proxima"],
        version: "2.82.2",
        author: "Aayusha Shrestha",
        countDown: 3,
        role: 0,
        description: "Proxima V2.82 - Advanced AI assistant with multi-user conversation tracking and image recognition. Powered by Aayusha Chatbot Project V2. Created by Aayusha Shrestha.",
        category: "Advanced AI",
        guide: "{pn} <query> | Intelligent AI with individual user memory and image analysis | Reply to images with '#proxima <question>' or use command | Use 'clear' to reset your conversation history"
    },

    onStart: async function ({ message, usersData, event, api, args }) {
        let name, ment;

        try {
            const id = event.senderID;
            const userData = await usersData.get(id);
            name = userData.name;
            ment = [{ id: id, tag: name }];
            let prompt = args.join(" ");
            const isCreator = isMaster(id);

            // Handle clear command
            if (prompt.toLowerCase() === "clear") {
                clearChatHistory(id);
                const prefsFile = path.join(userPreferencesDir, `prefs_${id}.json`);
                if (fs.existsSync(prefsFile)) {
                    fs.unlinkSync(prefsFile);
                }
                const clearMessage = isCreator ? 
                    "Aayusha, your conversation history and preferences have been completely cleared!" : 
                    `${name}, your chat history and preferences cleared successfully! Ready for a fresh start.`;
                message.reply(clearMessage);
                return;
            }

            // Check if this is a reply to an image
            let imageBase64 = null;
            if (event.type === "message_reply" && event.messageReply.attachments && event.messageReply.attachments.length > 0) {
                const attachment = event.messageReply.attachments[0];
                
                // Check if attachment is an image
                if (attachment.type === "photo" || attachment.type === "image") {
                    try {
                        const imageUrl = attachment.url || attachment.payload?.url;
                        
                        if (imageUrl) {
                            api.setMessageReaction("📸", event.messageID, () => {}, true);
                            console.log(`Processing image for user ${id}: ${imageUrl}`);
                            
                            // Download and convert image to base64
                            imageBase64 = await downloadImage(imageUrl);
                            
                            // If user didn't provide a question, use default
                            if (!prompt || prompt.trim() === "") {
                                prompt = "What is in this image? Please describe it in detail.";
                            }
                            
                            console.log(`Image processed successfully for user ${id}`);
                        }
                    } catch (imgError) {
                        console.error("Error processing image:", imgError.message);
                        message.reply("I encountered an issue processing the image. Please try again with a different image.");
                        return;
                    }
                }
            }

            // Handle reply context (non-image)
            if (event.type === "message_reply" && !imageBase64) {
                const replyContent = event.messageReply.body;
                prompt = `[Context: Replying to "${replyContent}"] ${prompt}`;
            }

            // Handle empty prompt
            if (!prompt || prompt.trim() === "") {
                const noMessageText = isCreator ? 
                    "Hello Aayusha! I'm Proxima V2.82, your 6-month-old AI powered by Aayusha Chatbot Project V2. How can I assist you today?" :
                    `Hello ${name}! I'm Proxima V2.82, powered by Aayusha Chatbot Project V2, created by Aayusha Shrestha. How may I help?`;
                message.reply(noMessageText, (err, info) => {
                    if (!err) {
                        global.GoatBot.onReply.set(info.messageID, {
                            commandName: this.config.name,
                            messageID: info.messageID,
                            author: event.senderID
                        });
                    }
                });
                return;
            }

            // Load user-specific chat history
            const chatHistory = loadChatHistory(id);
            const contextualHistory = imageBase64 ? '' : buildContext(chatHistory); // Skip history context for images
            const enhancedPrompt = enhancePrompt(prompt, id, name);
            const finalPrompt = enhancedPrompt + contextualHistory;

            api.setMessageReaction("🕘", event.messageID, () => {}, true);

            // Call API with user_id parameter and optional image
            const result = await callProximaAPI(finalPrompt, id, imageBase64);

            // Validate result
            if (!result || result.trim() === '' || result === 'undefined' || result === 'null') {
                const fallbackMessage = isCreator ?
                    'Aayusha, I encountered a processing challenge with that request. Could you rephrase it?' :
                    `${name}, I encountered a processing issue. Could you rephrase your question?`;
                message.reply(fallbackMessage);
                return;
            }

            // Format and send response
            const formattedResult = formatResponse(result, name);

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

            // Save to user-specific history
            const historyPrompt = imageBase64 ? `[Image Analysis] ${prompt}` : prompt;
            chatHistory.push({ 
                role: "user", 
                content: historyPrompt, 
                timestamp: Date.now()
            });
            chatHistory.push({ 
                role: "assistant", 
                content: result, 
                timestamp: Date.now()
            });
            saveChatHistory(id, chatHistory);

        } catch (error) {
            console.error("Error in onStart:", error.message);
            api.setMessageReaction("⚡", event.messageID, () => {}, true);

            const userPrompt = args.join(" ").toLowerCase();
            const id = event.senderID;
            const isCreator = isMaster(id);

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

            // Fallback responses for common queries during errors
            const fallbackResponses = {
                identity: () => isCreator ?
                    `Aayusha, I'm your creation - Proxima V2.82, powered by Aayusha Chatbot Project V2. I'm 6 months old!` :
                    `${name}, I'm Proxima V2.82, created by Aayusha Shrestha, powered by Aayusha Chatbot Project V2.`,
                model: () => isCreator ?
                    `Aayusha, I'm Proxima V2.82, your 6-month-old female AI assistant!` :
                    `${name}, I'm Proxima V2.82, a 6-month-old female AI created by Aayusha Shrestha.`,
                greeting: () => isCreator ?
                    `Hello Aayusha! I'm functioning optimally and ready to assist you!` :
                    `Hello ${name}! I'm doing wonderfully and ready to help.`
            };

            if (userPrompt.includes('who created you') || userPrompt.includes('who made you') || userPrompt.includes('your creator')) {
                message.reply({ body: fallbackResponses.identity(), mentions: ment });
                return;
            }

            if (userPrompt.includes('what model') || userPrompt.includes('who are you') || userPrompt.includes('your age') || userPrompt.includes('how old')) {
                message.reply({ body: fallbackResponses.model(), mentions: ment });
                return;
            }

            if (userPrompt.includes('how are you') || userPrompt.includes('hello') || userPrompt.includes('hi')) {
                message.reply({ body: fallbackResponses.greeting(), mentions: ment });
                return;
            }

            handleApiError(error, message);
        }
    },

    onChat: async function ({ event, message, usersData, api, args }) {
        const { body, senderID } = event;

        if (!body || typeof body !== 'string') return;

        // Trim the message and convert to lowercase for checking
        const trimmedBody = body.trim();
        const lowerBody = trimmedBody.toLowerCase();

        // Check if message starts with ONLY "proxima" (case-insensitive)
        const startsWithProxima = 
            lowerBody.startsWith('proxima ') || 
            lowerBody === 'proxima';

        if (startsWithProxima) {
            // Remove "proxima" and get the actual message
            let cleanMessage;

            if (lowerBody.startsWith('proxima ')) {
                cleanMessage = trimmedBody.substring(8).trim(); // Remove "proxima "
            } else {
                // If it's just "proxima" without a message
                cleanMessage = '';
            }

            // Convert cleanMessage to args array
            const messageArgs = cleanMessage ? cleanMessage.split(' ') : [];

            await this.onStart({ args: messageArgs, message, event, usersData, api });
        }

        // Handle image recognition with #proxima command
        if (event.type === "message_reply" && isImageCommand(body)) {
            const replyMsg = event.messageReply;
            
            // Check if the replied message has image attachments
            if (replyMsg.attachments && replyMsg.attachments.length > 0) {
                const attachment = replyMsg.attachments[0];
                
                if (attachment.type === "photo" || attachment.type === "image") {
                    // Extract the command after #proxima
                    const imageCommand = extractImageCommand(body);
                    
                    // Convert to args array and trigger onStart
                    const messageArgs = imageCommand.split(' ');
                    
                    await this.onStart({ args: messageArgs, message, event, usersData, api });
                }
            }
        }
    },

    onReply: async function ({ message, event, api, usersData }) {
        let name, ment;

        try {
            const id = event.senderID;
            const userData = await usersData.get(id);
            name = userData.name;
            ment = [{ id: id, tag: name }];
            const prompt = event.body;
            const isCreator = isMaster(id);

            // Handle clear in reply
            if (prompt.toLowerCase() === "clear") {
                clearChatHistory(id);
                const prefsFile = path.join(userPreferencesDir, `prefs_${id}.json`);
                if (fs.existsSync(prefsFile)) {
                    fs.unlinkSync(prefsFile);
                }
                const clearMessage = isCreator ? 
                    "Aayusha, your conversation history has been completely cleared!" : 
                    `${name}, chat history cleared successfully! Ready for a fresh conversation.`;
                message.reply(clearMessage);
                return;
            }

            // Check if the original message (the one being replied to) has an image
            let imageBase64 = null;
            if (event.messageReply && event.messageReply.attachments && event.messageReply.attachments.length > 0) {
                const attachment = event.messageReply.attachments[0];
                
                if (attachment.type === "photo" || attachment.type === "image") {
                    try {
                        const imageUrl = attachment.url || attachment.payload?.url;
                        
                        if (imageUrl) {
                            api.setMessageReaction("📸", event.messageID, () => {}, true);
                            console.log(`Processing image in reply for user ${id}: ${imageUrl}`);
                            
                            imageBase64 = await downloadImage(imageUrl);
                            
                            console.log(`Image processed successfully in reply for user ${id}`);
                        }
                    } catch (imgError) {
                        console.error("Error processing image in reply:", imgError.message);
                        message.reply("I encountered an issue processing the image. Please try again.");
                        return;
                    }
                }
            }

            // Handle empty prompt
            if (!prompt || prompt.trim() === "") {
                const replyMessage = isCreator ? 
                    "I'm here and ready to assist you, Aayusha!" :
                    `I'm here and ready to help, ${name}! What would you like to discuss?`;
                message.reply(replyMessage, (err, info) => {
                    if (!err) {
                        global.GoatBot.onReply.set(info.messageID, {
                            commandName: this.config.name,
                            messageID: info.messageID,
                            author: event.senderID
                        });
                    }
                });
                return;
            }

            // Load user-specific chat history
            const chatHistory = loadChatHistory(id);
            const contextualHistory = imageBase64 ? '' : buildContext(chatHistory);
            const enhancedPrompt = enhancePrompt(prompt, id, name);
            const finalPrompt = enhancedPrompt + contextualHistory;

            api.setMessageReaction("🕘", event.messageID, () => {}, true);

            // Call API with user_id parameter and optional image
            const result = await callProximaAPI(finalPrompt, id, imageBase64);

            // Validate result
            if (!result || result.trim() === '' || result === 'undefined' || result === 'null') {
                const fallbackMessage = isCreator ?
                    'Aayusha, I encountered a processing challenge. Could you rephrase?' :
                    `${name}, I encountered a processing issue. Let me try differently.`;
                message.reply(fallbackMessage);
                return;
            }

            // Format and send response
            const formattedResult = formatResponse(result, name);

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

            // Save to user-specific history
            const historyPrompt = imageBase64 ? `[Image Analysis] ${prompt}` : prompt;
            chatHistory.push({ 
                role: "user", 
                content: historyPrompt, 
                timestamp: Date.now()
            });
            chatHistory.push({ 
                role: "assistant", 
                content: result, 
                timestamp: Date.now()
            });
            saveChatHistory(id, chatHistory);

        } catch (error) {
            console.error("Error in onReply:", error.message);
            api.setMessageReaction("⚡", event.messageID, () => {}, true);
            handleApiError(error, message);
        }
    }
};
// Created by Aayusha Shrestha.! Don't change credit if you change it your are a gayyyieee.😆🐷

const { spawn } = require("child_process");
const crypto = require("crypto");

module.exports = {
config: {
name: "encodeAndEncrypt",
version: "1.0",
author: "Aayuse",
countDown: 5,
role: 2,
shortDescription: {
en: "Encode or Encrypt a message using Cython and AES encryption",
},
longDescription: {
en: "This command either encodes the provided text in Base64 or encrypts it using AES encryption, depending on the specified option.",
},
category: "owner",
guide: {
en: "[p]encodeAndEncrypt [base64/encrypt] [text] [key] - Encodes or encrypts the provided text with a key.",
},
},

onStart: async function ({ args, message, api }) {
if (args.length < 2) {
return message.reply("Please provide the option (base64/encrypt), text, and a key for encryption.");
}

const option = args[0].toLowerCase();  
const textToProcess = args.slice(1, -1).join(" ");  
let encryptionKey = args[args.length - 1];  

if (encryptionKey.length < 32) {  
  encryptionKey = encryptionKey.padEnd(32, '\0');  
} else if (encryptionKey.length > 32) {  
  encryptionKey = encryptionKey.slice(0, 32);  
}  

if (option === "base64") {  
  const pythonProcess = spawn("python3", ["-c", `

import base64
import sys
text = sys.argv[1]
encoded_text = base64.b64encode(text.encode()).decode()
print(encoded_text)
`, textToProcess]);

pythonProcess.stdout.on("data", (data) => {  
    const encodedText = data.toString().trim();  
    message.reply(encodedText);  
  });  

  pythonProcess.stderr.on("data", (data) => {  
    message.reply(`Error: ${data.toString().trim()}`);  
  });  
}  
  
else if (option === "encrypt") {  
  const pythonProcess = spawn("python3", ["-c", `

import base64
import sys
text = sys.argv[1]
encoded_text = base64.b64encode(text.encode()).decode()
print(encoded_text)
`, textToProcess]);

pythonProcess.stdout.on("data", (data) => {  
    const encodedText = data.toString().trim();  

    const iv = crypto.randomBytes(16);  
    const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(encryptionKey, "utf-8"), iv);  
    let encrypted = cipher.update(encodedText, "utf-8", "hex");  
    encrypted += cipher.final("hex");  

    const encryptedMessage = iv.toString("hex") + ":" + encrypted;  

    message.reply(encryptedMessage);  
  });  

  pythonProcess.stderr.on("data", (data) => {  
    message.reply(`Error: ${data.toString().trim()}`);  
  });  
}  

else {  
  message.reply("Invalid option. Please use 'base64' or 'encrypt'.");  
}

},
};

  

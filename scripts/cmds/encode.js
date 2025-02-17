const { spawn } = require("child_process");
const crypto = require("crypto");

module.exports = {
  config: {
    name: "code",
    version: "1.1",
    author: "Aayuse",
    countDown: 5,
    role: 2,
    shortDescription: {
      en: "Encode, Decode, or Encrypt/Decrypt a message using Cython and AES encryption",
    },
    longDescription: {
      en: "This command either encodes, decodes, or encrypts/decrypts the provided text, depending on the specified option.",
    },
    category: "owner",
    guide: {
      en: "[p]code base64/encrypt/decrypt [text/code] [key] - Encodes, decodes, or encrypts/decrypts the provided text with a key.",
    },
  },

  onStart: async function ({ args, message, api }) {
    if (args.length < 2) {
      return message.reply("Please provide the option (base64/encrypt/decrypt), text/code, and a key for encryption/decryption.");
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

    else if (option === "decrypt") {
      const [ivHex, encryptedText] = textToProcess.split(":");
      if (!ivHex || !encryptedText) {
        return message.reply("Invalid encrypted message format.");
      }

      try {
        const iv = Buffer.from(ivHex, "hex");
        const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(encryptionKey, "utf-8"), iv);
        let decrypted = decipher.update(encryptedText, "hex", "utf-8");
        decrypted += decipher.final("utf-8");

        const pythonProcess = spawn("python3", ["-c", `
import base64
import sys
text = sys.argv[1]
decoded_text = base64.b64decode(text).decode()
print(decoded_text)
`, decrypted]);

        pythonProcess.stdout.on("data", (data) => {
          const decodedText = data.toString().trim();
          message.reply(decodedText);
        });

        pythonProcess.stderr.on("data", (data) => {
          message.reply(`Error: ${data.toString().trim()}`);
        });
      } catch (err) {
        message.reply("Decryption failed: Incorrect key or corrupted data.");
      }
    }

    else {
      message.reply("Invalid option. Please use 'base64', 'encrypt', or 'decrypt'.");
    }
  },
};

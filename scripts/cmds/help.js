module.exports = {
	config: {
		name: "help",
		version: "1.0",
		author: "aaayusha",
		countDown: 5,
		role: 0,
		shortDescription: "sarcasm",
		longDescription: "sarcasm",
		category: "reply",
	},
	onStart: async function(){}, 
	onChat: async function({
		event,
		message,
		getLang
	}) {
		// Define the prefixes you want to use
		const prefixes = [".", "#", "*"];

		// Check if the message starts with any of the defined prefixes followed by "hahaha"
		if (event.body) {
			const messageText = event.body.toLowerCase();
			if (prefixes.some(prefix => messageText.startsWith(prefix + "help"))) {
				message.reply(`
__________________________
| ❤️ »  Bot Commands!!
|•「 1  」 » Animevid       
|•「 2  」 » Animevideo     
|•「 3  」 » Anipic         
|•「 4  」 » Aniquote       
|•「 5  」 » Aniquotes      
|•「 6  」 » Anivoice       
|•「 7  」 » Aniwatch       
|•「 8  」 » Anjara         
|•「 9  」 » Approved2 
|•「 10 」 » Anya1
|•「 11 」 » Antiout       
|•「 12 」 » Anya          
|•「 13 」 » Anya2         
|•「 14 」 » Anya3         
|•「 15 」 » Apimarket     
|•「 16 」 » Approved      
|•「 17 」 » Appstate      
|•「 18 」 » Appstore      
|•「 19 」 » Arrest        
|•「 20 」 » Art           
|•「 21 」 » Art2          
|•「 22 」 » Ashley        
|•「 23 」 » Aa            
|•「 24 」 » Accept        
|•「 25 」 » Adboxonly     
|•「 26 」 » Adduser       
|•「 27 」 » Admin         
|•「 28 」 » Adminassist   
|•「 29 」 » Adminonly     
|•「 30 」 » Ads           
|•「 31 」 » Advice        
|•「 32 」 » Usage         
|•「 33 」 » Ai            
|•「 34 」 » Alienrizz     
|•「 35 」 » All           
|•「 36 」 » Amazonsearch  
|•「 37 」 » Aniblur       
|•「 38 」 » Aniedit       
|•「 39 」 » Aniedit2      
|•「 40 」 » Anigen        
|•「 41 」 » Animagine     
|•「 42 」 » Animefy       
|•「 43 」 » Animeinfo     
|•「 44 」 » Animeme       
|•「 45 」 » Autolink      
|•「 46 」 » Autoseen      
|•「 47 」 » Autosetname   
|•「 48 」 » Autotik       
|•「 49 」 » Avatar        
|•「 50 」 » Axix(song)    
|•「 51 」 » Backupdata    
|•「 52 」 » Backupmongo   
|•「 53 」 » Badwords      
|•「 54 」 » Balance       
|•「 55 」 » Balancetop    
|•「 56 」 » Ball          
|•「 57 」 » Ban           
|•「 58 」 » Bank          
|•「 59 」 » Banlist       
|•「 60 」 » Bb            
|•「 61 」 » Bday          
|•「 62 」 » Beauty        
|•「 63 」 » Beluga        
|•「 64 」 » Berojgar      
|•「 65 」 » Besh          
|•「 66 」 » Beshy         
|•「 67 」 » Bin           
|•「 68 」 » Binary        
|•「 69 」 » Bine          
|•「 70 」 » Bio           
|•「 71 」 » Bishwo        
|•「 72 」 » Bitly         
|•「 73 」 » Block         
|•「 74 」 » Blowjob       
|•「 75 」 » Blue          
|•「 76 」 » Bored         
|•「 77 」 » Botgc         
|•「 78 」 » Botnick       
|•「 79 」 » Botsay        
|•「 80 」 » Botstats      
|•「 81 」 » Busy          
|•「 82 」 » Buttslap      
|•「 83 」 » Calculate     
|•「 84 」 » Callad        
|•「 85 」 » Candycrush    
|•「 86 」 » Cardinfo      
|•「 87 」 » Cat           
|•「 88 」 » Cardinfo2     
---------------------------
» Aayuse's Personal Bot🤍
» Admin Protected🛡️
» Don't Spam Command⚔️
» Be Friendly With Bot🔰
» 10/4 Hrs Active/Day🛠️
• Bot Have 109 Comands📇
• Do Help|Pages To See All
  
				`);
			}
		}
	}
};
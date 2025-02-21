import TelegramBot from 'node-telegram-bot-api';
import fetch from 'node-fetch';
import https from 'https';
import express from 'express';
import { DateTime } from 'luxon';

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Telegram Bot is running...');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

const token = '8101359108:AAHgaw7TV_lbg3iq4j2Pv9Piceg5eugaBxU'; // Replace with your own bot token
const bot = new TelegramBot(token, { polling: true });

//OpenAI API
// OpenAI API Config
const OPENAI_API_KEY = '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';  // Replace with your actual OpenAI API Key
const OPENAI_MODEL = 'your-g-4T0xuufYl-expert-prompt-creator';  // Replace with your actual Custom GPT model ID
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// Fetch the calendar
async function getNextLaunch() {
  const url = "https://smipleexpressapp.netlify.app/.netlify/functions/api/events";
  let response = await fetch(url);
  let data = await response.json();

  console.log("Data before sort: " + data);

  // Sort the events by date
  //data.sort((a, b) => new Date(a.start) - new Date(b.start));
  data.sort((a, b) => 
    DateTime.fromISO(a.start, { zone: 'America/New_York' }).toMillis() -
    DateTime.fromISO(b.start, { zone: 'America/New_York' }).toMillis()
);
  


console.log("Data after sort: " );
data.forEach(data => {
  let localTime = DateTime.fromISO(data.start, { zone: 'America/New_York' }).toFormat("EEE, M/d/yyyy, h:mm a ZZZZ");
  console.log(`Event: ${data.summary}`);
  console.log(`Start (Raw): ${data.start}`);
  console.log(`Start (EST/EDT): ${localTime}`);
});

  if (!data) {
      throw new Error("No upcoming events found or start date is missing");
  }
  console.log("Returning data: " +  data);
  return data;
}


// Function to call OpenAI Custom GPT
async function askCustomGPT(prompt) {
  try {
      const response = await fetch(OPENAI_API_URL, {
          method: 'POST',
          headers: {
              'Authorization': `Bearer ${OPENAI_API_KEY}`,
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({
              model: OPENAI_MODEL,
              messages: [{ role: "user", content: prompt }]
          })
      });

      const json = await response.json();
      return json.choices?.[0]?.message?.content || "Sorry, I couldn't generate a response.";
  } catch (error) {
      console.error("Error calling OpenAI API:", error);
      return "There was an issue reaching the AI. Please try again later.";
  }
}

bot.on('message', async(msg) => {
  const chatId = msg.chat.id;
  const messageText = msg.text;

  if (messageText === '/gigs') {
    bot.sendMessage(chatId, 'Here are the upcoming gigs!');
    let listofgigs = await getNextLaunch();
    let responseString = '';   

    //log the length of the list of gigs
    console.log("how many gigs: " + listofgigs.length);
    console.log("Server Timezone:", Intl.DateTimeFormat().resolvedOptions().timeZone);
    console.log("Current Server Time (UTC):", new Date().toISOString());
    

    //loop through the list of gigs in order and build the response string
    for (let i = 0; i < listofgigs.length; i++) {
      // Format the date mm/dd/yyyy hh:mm
      let options = { weekday: 'short', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' };
      //let formattedDate = new Date(listofgigs[i].start).toLocaleDateString('en-US', options);
      let formattedDate = DateTime.fromISO(listofgigs[i].start, { zone: 'America/New_York' }).toFormat("EEE, M/d/yyyy, h:mm a ZZZZ"); // Outputs: "Fri, 1/10/2025, 9:00 PM EST"
      // Calculate how many days from now the formatted date is
      let days = Math.floor((new Date(listofgigs[i].start) - new Date()) / (1000 * 60 * 60 * 24));
      // format the response like this: "3 days until the gig on 12/12/2020 12:00"
      responseString += `${listofgigs[i].summary}\n`;
      responseString += `       <b>${formattedDate}</b> - <b color="red">${days}</b>d \n`;
      
      //add space between gigs
      responseString += '\n';
    }

    console.log(responseString);

    bot.sendMessage(chatId, responseString, { parse_mode: 'HTML' });
    


    // getNextLaunch().then(response => {

    //   // Loop through the events
    //   response.forEach(event => {
    //   // Format the date mm/dd/yyyy hh:mm
    //   let options = { weekday: 'short', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' };
    //   let formattedDate = new Date(event.start).toLocaleDateString('en-US', options);
    //   // Calculate how many days from now the formatted date is
    //   let days = Math.floor((new Date(event.start) - new Date()) / (1000 * 60 * 60 * 24));
    //   // Send the message
    //   bot.sendMessage(chatId, ` ${event.summary} \nIn <b>${days}</b> days: <b>${formattedDate}</b>`, { parse_mode: 'HTML' });
    //   });
    // }).catch(error => console.error(error));
  } else if (messageText === '/help') {
    bot.sendMessage(chatId, 'here is some helpful info: \n/gigs - to see the upcoming gigs \n/guitars <your question> to ask a question about guitars -');
  } else if (messageText.startsWith('/guitars')) {
    let prompt = messageText.replace('/guitars ', '');
    askCustomGPT(prompt).then(response => {
      bot.sendMessage(chatId, response);
    }).catch(error => {
      console.error(error);
      bot.sendMessage(chatId, 'There was an issue reaching the AI. Please try again later.');
    });
  }
  else if (messageText.startsWith('/ivy')) { // If the message starts with /ivy then send back a jpeg of beautiful ivy
    const fs = require('fs');
    const path = require('path');

    //select 1 of any of the jpeg files in the directory called pics
    const files = fs.readdirSync(path.join(__dirname, 'pics'));
    const randomFile = files[Math.floor(Math.random() * files.length)];
    console.log(randomFile);
    const filePath = path.join(__dirname, 'pics', randomFile);
    const fileStream = fs.createReadStream(filePath);
    bot.sendPhoto(chatId, fileStream);
  }
});

//const token = '8101359108:AAHgaw7TV_lbg3iq4j2Pv9Piceg5eugaBxU'; // Replace with your own bot token
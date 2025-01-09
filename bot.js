import TelegramBot from 'node-telegram-bot-api';
import fetch from 'node-fetch';
import https from 'https';

const token = '8101359108:AAHgaw7TV_lbg3iq4j2Pv9Piceg5eugaBxU'; // Replace with your own bot token
const bot = new TelegramBot(token, { polling: true });

// Fetch the calendar
async function getNextLaunch() {
  const url = "https://smipleexpressapp.netlify.app/.netlify/functions/api/events";
  let response = await fetch(url);
  let data = await response.json();

  // Sort the events by date
  data.sort((a, b) => new Date(a.start) - new Date(b.start));

  console.log(data);

  if (!data) {
      throw new Error("No upcoming events found or start date is missing");
  }
  console.log("Returning data: " +  data);
  return data;
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
    

    //loop through the list of gigs in order and build the response string
    for (let i = 0; i < listofgigs.length; i++) {
      // Format the date mm/dd/yyyy hh:mm
      let options = { weekday: 'short', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' };
      let formattedDate = new Date(listofgigs[i].start).toLocaleDateString('en-US', options);
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
  }
});

//const token = '8101359108:AAHgaw7TV_lbg3iq4j2Pv9Piceg5eugaBxU'; // Replace with your own bot token
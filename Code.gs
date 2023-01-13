//---------Run the below functions to test the connectivity and setting up the webhook
function getMe() {
  let response = UrlFetchApp.fetch("https://api.telegram.org/bot"+token+"/getMe");
  console.log(response.getContentText());
}

function setWebhook() {
  let response = UrlFetchApp.fetch("https://api.telegram.org/bot"+token+"/setWebhook?url="+webAppUrl);
  console.log(response.getContentText());
}

//---------Date Utilities---------------
function getDayOfMonth(){
  var currentDate = new Date();
  Logger.info(currentDate);
  var dayOfMonth = Utilities.formatDate(currentDate, "EST", "dd");
  Logger.info(dayOfMonth);
  return parseInt(dayOfMonth);
}

function getWeekOfMonth() {
  var d = new Date();
  var date = d.getDate();
  var day = d.getDay();
  var weekOfMonth = Math.ceil((date + 6 - day)/7);
  return parseInt(weekOfMonth);
}

function getMonth(){
  var currentDate = new Date();
  Logger.info(currentDate);
  var month = Utilities.formatDate(currentDate, "EST", "MMM");
  Logger.info(month);
  return month;
}

//--------Daily Reminder--------------------
function sendDailyReminder(){
  var dailyHabits = SpreadsheetApp.getActive().getRangeByName("DailyHabit").getValues();
  var dayOfMonth = getDayOfMonth();
  var colRangeName = "Day_"+dayOfMonth;
  var values = SpreadsheetApp.getActive().getRangeByName(colRangeName).getValues();
  var dailyHabitReminder = SpreadsheetApp.getActive().getRangeByName("DailyHabitReminder").getValues()
  values.forEach(function(row, rowId) {
    row.forEach(function(col, colId) {
        if (!values[rowId][colId] && dailyHabitReminder[rowId][colId]){
          var message = "Day " + dayOfMonth +" reminder for \n" + dailyHabits[rowId][colId];
          sendReminder(message, colRangeName, rowId, colId)
        }
      });
  });
}
//---------Weekly Reminder------------------
function sendWeeklyReminder(){
  var weeklyHabits = SpreadsheetApp.getActive().getRangeByName("WeeklyHabit").getValues();
  var weekOfMonth = getWeekOfMonth();
  var colRangeName = "Week_"+weekOfMonth;
  var values = SpreadsheetApp.getActive().getRangeByName(colRangeName).getValues();
  var weeklyHabitReminder = SpreadsheetApp.getActive().getRangeByName("WeeklyHabitReminder").getValues()
  values.forEach(function(row, rowId) {
    row.forEach(function(col, colId) {
        if (!values[rowId][colId] && weeklyHabitReminder[rowId][colId]){
          var message = "Week " + weekOfMonth +" reminder for \n"  + weeklyHabits[rowId][colId];
          sendReminder(message, colRangeName, rowId, colId)
        }
      });
  });
}

function sendReminder(message, rangeName, rowId, colId){
  var keyboard = {
    "inline_keyboard":[
      [
        {
          "text": "Skip",
          "callback_data": JSON.stringify({
            "status": "skip",
            "rangeName": rangeName,
            "rowId": rowId,
            "colId": colId
          })
        },
        {
          "text": "WIP",
          "callback_data": JSON.stringify({
            "status": "wip",
            "rangeName": rangeName,
            "rowId": rowId,
            "colId": colId
          })
        },
        {
          "text": "Done",
          "callback_data": JSON.stringify({
            "status": "done",
            "rangeName": rangeName,
            "rowId": rowId,
            "colId": colId
          })
        }
      ]
    ]
  };
  sendMessageWithInlineActions(message, keyboard);
}

function sendMessageWithInlineActions(text, keyboard) {
   let data = {
    method: "post",
    payload: {
      method: "sendMessage",
      chat_id: String(chatId),
      text: String(text),
      parse_mode: "HTML",
      reply_markup: JSON.stringify(keyboard)
    }
  };
  UrlFetchApp.fetch("https://api.telegram.org/bot"+token+"/", data);
  logActivity("sent", JSON.stringify(data));
}

function sendMessage(text){
  let data = {
    method: "post",
    payload: {
      method: "sendMessage",
      chat_id: String(chatId),
      text: String(text),
      parse_mode: "HTML"
    }
  };
  UrlFetchApp.fetch("https://api.telegram.org/bot"+token+"/", data);
  logActivity("sent", JSON.stringify(data));
}


//--------Daily Motivational Quote------------------------
function getMotivationalQuote(){
  let response = UrlFetchApp.fetch("https://type.fit/api/quotes");
  if(response && response.getResponseCode()==200){
    let quotes = JSON.parse(response.getContentText());
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    let quote = randomQuote.text+" - "+randomQuote.author;
    console.log(quote);
    return quote;
  }
  return null;
}

function sendDailyMotivationalQuote(){
  let quote = getMotivationalQuote();
  if(quote){
    sendMessage(quote);
  }
}


//-----process response from the user
function doPost(e){
  let contents = JSON.parse(e.postData.contents);
  if (contents.callback_query){
    let chat_id = contents.callback_query.from.id;
    let data = JSON.parse(contents.callback_query.data);
    logActivity("received", JSON.stringify(data));
    if(data.status == "done"){
      markAsDone(data.rangeName, data.rowId, data.colId);
      sendMessage("Well Done!");
    } else if (data.status == "wip"){
      sendMessage("Keep going!");
    } else if (data.status == "skip"){
      sendMessage("You can still do it.");
    }
  } else if (contents.message){
    let chat_id = contents.message.chat.id;
    let text = contents.message.text;
    logActivity("received", text);
  }
}

function logActivity(text, action){
  SpreadsheetApp.getActive().getSheetByName("ActivityLog").appendRow([new Date(), chatId, action, text]);
}

function markAsDone(rangeName, rowId, colId){
  var range = SpreadsheetApp.getActive().getRangeByName(rangeName);
  var values = range.getValues();
  values[rowId][colId]=true;
  range.setValues(values);
}

//------------Tests
function testMarkAsDone(){
  markAsDone("Day_2", 3, 0);
}
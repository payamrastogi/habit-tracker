function myFunction() {
  var current_date = new Date();
  Logger.info(current_date);
  var day_of_the_month = Utilities.formatDate(new Date(), "EST", "dd");
  Logger.info(day_of_the_month);
}

function checkRangeTest(){
  for(var row = 3; row <=5; row+=1){
    var range = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet().getRange(row,1,1,15);
    Logger.info("Row "+ row + " is checked? " + range.isChecked());
  }
}

function onEdit(e) {
  // Set a comment on the edited cell to indicate when it was changed.
  const range = e.range;
  //range.setNote('Last modified: ' + new Date());
  sendMessage('Last modified: ' + new Date())
}

function getDayOfTheMonth(){
  var currentDate = new Date();
  Logger.info(currentDate);
  var dayOfTheMonth = Utilities.formatDate(currentDate, "EST", "dd");
  Logger.info(dayOfTheMonth);
  return dayOfTheMonth;
}

function getMonth(){
  var currentDate = new Date();
  Logger.info(currentDate);
  var month = Utilities.formatDate(currentDate, "EST", "MMM");
  Logger.info(month);
  return month;
}

function processReminder(){
  var dailyHabits = SpreadsheetApp.getActive().getRangeByName("DailyHabit").getValues();
  var dayOfTheMonth = parseInt(getDayOfTheMonth());
  var values = SpreadsheetApp.getActive().getRangeByName("Day_"+dayOfTheMonth).getValues();
  var dailyHabitReminder = SpreadsheetApp.getActive().getRangeByName("DailyHabitReminder").getValues()
  values.forEach(function(row, rowId) {
    row.forEach(function(col, colId) {
        if (!values[rowId][colId] && dailyHabitReminder[rowId][colId]){
          var message = "Reminder: " + dailyHabits[rowId][colId];
          createAndSendReminder(message, ("Day_"+dayOfTheMonth), rowId, colId)
        }
      });
  });
}

function createAndSendReminder(message, rangeName, rowId, colId){
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



function trigger_based(e){
  const range = e.range;
  //sendMessage('Last modified: ' + new Date())
  var keyboard = {
    "inline_keyboard":[
      [
        {
          "text": "Skip",
          "callback_data": "skip"
        },
        {
          "text": "WIP",
          "callback_data": "wip"
        },
        {
          "text": "Done",
          "callback_data": "done"
        }
      ]
    ]
  };
  sendMessageWithInlineActions('Reminder: Daily Habit 1', keyboard);
}

let token = "5620030178:AAEmCfTq8vu-ZcPRDQiecDdg2KSy2B-ow5c";
let webAppUrl = "https://script.google.com/macros/s/AKfycbybtnyBYcFBGNuYJ_KNi4GkjaD4iF3GdYfwSxFJopiw15lh_DWiMeZ1dm2sm6xFT38-kw/exec";
function getMe() {
  let response = UrlFetchApp.fetch("https://api.telegram.org/bot"+token+"/getMe");
  console.log(response.getContentText());
}

function setWebhook() {
  let response = UrlFetchApp.fetch("https://api.telegram.org/bot"+token+"/setWebhook?url="+webAppUrl);
  console.log(response.getContentText());
}

function sendMessageWithInlineActions(text, keyboard) {
   let data = {
    method: "post",
    payload: {
      method: "sendMessage",
      chat_id: String(1476317815),
      text: String(text),
      parse_mode: "HTML",
      reply_markup: JSON.stringify(keyboard)
    }
  };

  UrlFetchApp.fetch("https://api.telegram.org/bot"+token+"/", data);
}

function sendMessage(text){
  let data = {
    method: "post",
    payload: {
      method: "sendMessage",
      chat_id: String(1476317815),
      text: String(text),
      parse_mode: "HTML"
    }
  };

  UrlFetchApp.fetch("https://api.telegram.org/bot"+token+"/", data);
}

function doPost(e){
  let contents = JSON.parse(e.postData.contents);
  if (contents.callback_query){
    let chat_id = contents.callback_query.from.id;
    let data = JSON.parse(contents.callback_query.data);
    SpreadsheetApp.getActive().getSheetByName("Test").appendRow([chat_id, data]);
    if(data.status == "done"){
      markAsDone(data.rangeName, data.rowId, data.colId);
      sendMessage("Well Done!");
    } else if (data.status == "wip"){
      sendMessage("Keep going!");
    } else if (data.status == "skip"){
      sendMessage("You can still do it.");
    }
    //SpreadsheetApp.getActive().getSheetByName("Test").appendRow([chat_id, data]);
  } else if (contents.message){
    let chat_id = contents.message.chat.id;
    let text = contents.message.text;
    console.log(chat_id+" : "+text);
    SpreadsheetApp.getActive().getSheetByName("Test").appendRow([chat_id, text]);
  }
}

function testMarkAsDone(){
  markAsDone("Day_2", 3, 0);
}

function markAsDone(rangeName, rowId, colId){
  var range = SpreadsheetApp.getActive().getRangeByName(rangeName);
  var values = range.getValues();
  values[rowId][colId]=true;
  range.setValues(values);
}
// Google Apps Script file

// Extract the new mails from Gmail Inbox, received on the same day. 
// Predict the category by making a POST request to GCloud Web App,
// Log the results to a Google Sheet, used as Dashboard. 

// After saving this apps script file, Set a Trigger event for this project.
// Function ==> PerformanceDashboard ; Deployment ==> Head ; Event Source ==> Time-Driven ; 
// Type of Time ==> Day Timer ; Time of day ==> YOUR CHOISE.

function PerformanceDashboard() {
  
  var App = GmailApp;
  var Dashboard_Spreadsheet_Link = "Your_Google_Sheet_URL"; // Copy and Paste the url of your google sheet.
  var Sheet = SpreadsheetApp.openByUrl(Dashboard_Spreadsheet_Link).getSheetByName('Data'); // Make sure you have a sheet named "Data".
  
//   Forum Category data are removed while building ML model, due to very less mail counts.
  var Categories = ['PRIMARY', 'UPDATES', 'SOCIAL', 'PROMOTIONS'];
  var Messages_jso = {
    'PRIMARY': [],
    'UPDATES': [],
    'SOCIAL': [],
    'PROMOTIONS': []
  };

//   Loop over all Categories.
  for (var cat_iter = 0; cat_iter < Categories.length; cat_iter++) {
    
 //  Search for mails that are received within 24 hours.
    var Temp_Threads = App.search('category:'+Categories[cat_iter]+" newer_than:1d");

 //   Skip if no mail threads on a category.  
    if (Temp_Threads.length == 0) { continue; }

    var Temp_Messages = App.getMessagesForThreads(Temp_Threads);

    for (var Threads_iter = 0; Threads_iter < Temp_Messages.length; Threads_iter++) {

 //  Call ProcessMessages to get mail data on different conditions.     
      var Temp_Data = Temp_Messages[Threads_iter].map(ProcessMessages);

   //  Remove empty spaces in array, due to invalid mails.     
      Temp_Data = Temp_Data.filter(function (value) {return (value != null); });
      Messages_jso[Categories[cat_iter]] = Messages_jso[Categories[cat_iter]].concat(Temp_Data);
    }

  //  Skip, if no mails are valid.   
    var Temp_length = Messages_jso[Categories[cat_iter]].length;
    if (Temp_length == 0) { continue; }

  //  Store the mail data in Dashboard Google Sheet.   
    var Last_Row = Sheet.getLastRow();
    Sheet.getRange(Last_Row+1, 1, Temp_length, 4).setValues(Messages_jso[Categories[cat_iter]]);
    Sheet.getRange(Last_Row+1, 5, Temp_length, 1).setValue(Categories[cat_iter]);
  }
}

function ProcessMessages(Message) {
  var Your_Name_MailID = 'YOUR_NAME <YOUR_MAIL@GMAIL.COM>'; // As it appears in header of your mails.
  if (Message.getFrom() != Your_Name_MailID) {
    var Msg_Date = Message.getDate();
    
 //  Cross Checking that the mail is received within 24 hours.   
    if (((new Date()).getTime() - Msg_Date.getTime()) < (1000*60*60*24)) {
      var Msg_Subject = Message.getSubject();
      var Msg_Body = Message.getPlainBody();
      
   //  clean the mail text by calling Clean_String() function.
      var Msg_Content = Clean_String(Msg_Subject.concat(" ", Msg_Body));
      
   //  only when the content is not empty,,,     
      if (Msg_Content.length != 0) {
        var Msg_Word_Count = Msg_Content.split(" ").length;
        
     //  Call the function CallPrediction to request the web app.       
        var Msg_Prediction = CallPrediction(Msg_Subject, Msg_Body);
        
        return [ Msg_Date, Msg_Content, Msg_Word_Count, Msg_Prediction];
      }
    } 
  }
}

function Clean_String(strg) {
//   Remove white space characters like tab, new line etc.
  strg = strg.replaceAll(/\s/g, " ");
  
//   Remove links inside the mail.
  strg = strg.replaceAll(/(?:(?:https?|ftp|file):\/\/|www\.|ftp\.)(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[-A-Z0-9+&@#\/%=~_|$?!:,.])*(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[A-Z0-9+&@#\/%=~_|$])/igm, " ");
  
//   Remove non word characters. Only A-Z, a-z, 0-9 remaining.
  strg = strg.replaceAll(/\W/g, " ");
  
//   Remove multiple space bar characters created in previous methods.
  strg = strg.split(" ");
  strg = strg.filter(function (value) {return value;});
  strg = strg.join(" ");
  
//   Make all text to Lower Case.
  strg = strg.toLowerCase();
  
  return strg;
}

// Send a HTTP POST request to GCloud deployed Web App to predict the mail category.
function CallPrediction(Subject, Body) {
  var data = { 'subj': Subject, 'body': Body };
  var options = { 'method' : 'POST', 'payload' : data };
  
// Deploy your Flassk web app on Gcloud and paste the POST Url here.
  var link = 'YOUR_GCLOUD_WEB_APP_POST_URL'   

// fetching the HTML output from the web app.
  var Resp = UrlFetchApp.fetch(link, options).getContentText();
  
// Separating the required portions of HTML from the prediction result.
  Resp = Resp.split('<div class="blinking" id="sidebar-status">')[1];
  Resp = Resp.split('</div>')[0];
  
  return Resp;
}

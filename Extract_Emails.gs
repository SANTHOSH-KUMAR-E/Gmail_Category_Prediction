// Google Apps Script file

// Extract emails from Gmail Inbox and store it in Google Sheet.
// There is a run time limit on Apps Script functions. Hence run the following function 
// seperately for each category by removing other categories from "Categories" array variable.
// You can also change "Count_Threads" variables according to your run time problems.
function ExtractAndStore() {

  var App = GmailApp;
  var Your_Name_MailID = 'YOUR_NAME <YOUR_MAIL@GMAIL.COM>'; // As it appears in header of your mails.
  var Categories = ['primary', 'updates', 'social', 'promotions', 'forums'];
  
//   Mail data will be stored in this Google sheet. Find the sheet in Drive after script runs.
  var Sheet = SpreadsheetApp.create('Extracted Emails').insertSheet('Data');
  var Messages_jso = {
    'primary': [],
    'updates': [],
    'social': [],
    'promotions': [],
    'forums': []
  };

  for (var cat_iter = 0; cat_iter < Categories.length; cat_iter++) {
    var Cont_iter = 0;
    var Count_Threads = 0;
    while (Count_Threads == 500 * Cont_iter) {

    //  GmailApp.search() can only fetch 500 email threads in a single call. Count_iter is used to loop.     
      var Temp_Threads = App.search('category:'+Categories[cat_iter], Cont_iter*500, 500)
      var Temp_Messages = App.getMessagesForThreads(Temp_Threads);
      for (var Threads_iter = 0; Threads_iter < Temp_Messages.length; Threads_iter++) {
        
    //  Replies and self mails sent from our own account is not needed.
    //  Get Subject and Body of each mails and clean the text by calling Clean_String() function.       
        var Temp_Data = Temp_Messages[Threads_iter].map(function(value){ 
                                          if (value.getFrom() != Your_Name_MailID) {
                                            return [Clean_String(value.getSubject().concat(" ", value.getPlainBody())),  
                                                    Categories[cat_iter] ]; 
                                          }
                                        });
        
    //  Filter to remove the empty spots of replies and non text mails        
        Temp_Data = Temp_Data.filter(function (value) {return ((value != null) && (value[0].length !=0)); });
        Messages_jso[Categories[cat_iter]] = Messages_jso[Categories[cat_iter]].concat(Temp_Data);
      }
      
      Count_Threads += Temp_Threads.length
      Cont_iter += 1; 
    }
    
    //  Store the mail data in the Google Sheet   
    Sheet.getRange(Sheet.getLastRow()+1, 1, Messages_jso[Categories[cat_iter]].length, 2).setValues(Messages_jso[Categories[cat_iter]]);
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

var botVars = require("./bot_vars.js");
var botFunctions = require("./bot_functions.js");

// WORKS-BY INTENT
botVars.slackController.hears(['works-by'], 'direct_message, direct_mention, mention', botVars.dialogflowMiddleware.hears, function(bot, message) {
  
  // GET PARAMETERS
  var parameters = {
   artist: message.entities["doremus-artist"],
   prevArtist: message.entities["doremus-artist-prev"],
   number: message.entities["number"],
   instruments: message.entities["doremus-instrument"],
   strictly: message.entities["doremus-strictly"],
   year: message.entities["date-period"],
   genre: message.entities["doremus-genre"]
  }
  
  
  // COUNT OF THE FILTER SET BY THE USER
  var filterCounter = 0;
  for (var key in parameters) {
    if (typeof parameters[key] === "string" && parameters[key] !== "") {
      filterCounter++;
    }
    else if (typeof parameters[key] !== "string" && parameters[key].length != 0) {
      filterCounter++;
    }
  }
   
  // CHECK IF THE MAX AMOUNT OF FILTERS IS APPLIED
  if (filterCounter > 2) {

    // YEAR CHECK AND PARSING
    var startyear = null;
    var endyear = null;
    console.log(parameters.year);
    if (parameters.year !== "") {
      startyear = parseInt(parameters.year.split("/")[0]);
      endyear = parseInt(parameters.year.split("/")[1]);

      // SWAP IF PROVIDED IN THE INVERSE ORDER
      if (startyear > endyear) {
        var tmp = startyear;
        startyear = endyear;
        endyear = tmp;
      }
    }

    // ARTIST PARSING
    if (parameters.artist == "" && parameters.prevArtist !== "") {
      parameters.artist = parameters.prevArtist;
    }

    // DO THE QUERY (WITH ALL THE INFOS)
    botFunctions.doQuery(parameters.artist, parameters.number, parameters.instruments, 
            parameters.strictly, startyear, endyear, parameters.genre, bot, message);
  }
  else {
    
    bot.reply(message, message['fulfillment']['speech']);
  }
  
});

// WORKS-BY - YES INTENT
botVars.slackController.hears(['works-by - yes'], 'direct_message, direct_mention, mention', botVars.dialogflowMiddleware.hears, function(bot, message) {
   
  bot.reply(message, message['fulfillment']['speech']);
});

// WORKS-BY - NO
botVars.slackController.hears(['works-by - no'], 'direct_message, direct_mention, mention', botVars.dialogflowMiddleware.hears, function(bot, message) {
  
  var context = message["nlpResponse"]["result"]["contexts"][0];
  
  // GET PARAMETERS
  var artist = context["parameters"]["doremus-artist"];
  var prevArtist = context["parameters"]["doremus-artist-prev"];
  var number = context["parameters"]["number"];
  var instruments = context["parameters"]["doremus-instrument"];
  var strictly = context["parameters"]["doremus-strictly"];
  var year = context["parameters"]["date-period"];
  var genre = context["parameters"]["doremus-genre"];

  // YEAR CHECK AND PARSING
  var startyear = null;
  var endyear = null;
  if (year !== "") {
    startyear = parseInt(year.split("/")[0]);
    endyear = parseInt(year.split("/")[1]);

    // SWAP IF PROVIDED IN THE INVERSE ORDER
    if (startyear > endyear) {
      var tmp = startyear;
      startyear = endyear;
      endyear = tmp;
    }
  }

  // ARTIST PARSING
  if (artist === "" && prevArtist !== "") {
    artist = prevArtist;
  }

  // DO THE QUERY (WITH ALL THE INFOS)
  botFunctions.doQuery(artist, number, instruments, strictly, startyear, endyear, genre, bot, message);
  
});


// WORKS-BY-SOMETHING INTENT
botVars.slackController.hears(['works-by-artist','works-by-instrument','works-by-genre','works-by-years'], 'direct_message, direct_mention, mention', botVars.dialogflowMiddleware.hears, function(bot, message) {

  bot.reply(message, message['fulfillment']['speech']);
});


// DISCOVER ARTIST
botVars.slackController.hears(['find-artist'], 'direct_message, direct_mention, mention', botVars.dialogflowMiddleware.hears, function(bot, message) {
    
    // GET ENTITIES
    var date = message.entities["date-period"];
    var number = message.entities["number"];
    var place = message.entities["geo-city"];
    var instrument = message.entities["doremus-instrument"];
    var genre = message.entities["doremus-genre"];
  
    // PARSE ENTITIES
    var startdate = "";
    var enddate = "";
    if (date !== "") {
      startdate = date.split("/")[0];
      enddate = date.split("/")[1];
    }
  
    var num = 5;
    if (number !== "") {
      num = parseInt(number);
    }
  
    var city = "";
    if (place !== "") {
      city = place.toLowerCase();
    } 
  
    // SEND THE BIO TO THE USER
    botFunctions.doQueryFindArtist(num, startdate, enddate, city, instrument, genre, bot, message);
});


// DISCOVER ARTIST
botVars.slackController.hears(['discover-artist'], 'direct_message, direct_mention, mention', botVars.dialogflowMiddleware.hears, function(bot, message) {
  
  // ACTION COMPLETE (we have all the required infos)
  if (message['nlpResponse']['result']['actionIncomplete'] == false) {
    
    // SEND THE BIO TO THE USER
    botFunctions.answerBio(bot, message, message.entities["doremus-artist"]);
  }
  
  // ACTION INCOMPLETE (the artist names hasn't been provided or it was misspelled)
  else {
      
    bot.reply(message, message['fulfillment']['speech']);
  }
  
});


// PROPOSE-PERFORMANCE
botVars.slackController.hears(['find-performance'], 'direct_message, direct_mention, mention', botVars.dialogflowMiddleware.hears, function(bot, message) {
  
  // ACTION COMPLETE (the date has been provided)
  if (message['nlpResponse']['result']['actionIncomplete'] == false) {
    
    var date = message.entities["date-period"];
    var place = message.entities["geo-city"];
    var number = message.entities["number"];
    
    var city = "";
    if (place !== "") {
      city = place.toLowerCase();
    }
    
    var num = 1;
    if (number !== "") {
      num = parseInt(number);
    }
    
    var startdate = date.split("/")[0];
    var enddate = date.split("/")[1];
    
    // DO THE QUERY (WITH ALL THE INFOS)
    botFunctions.doQueryPerformance(num, city, startdate, enddate, bot, message);
  }
  
  // ACTION INCOMPLETE (missing date)
  else {

    bot.reply(message, message['fulfillment']['speech']);
  }
});


// HELLO INTENT
botVars.slackController.hears(['hello'], 'direct_message, direct_mention, mention', botVars.dialogflowMiddleware.hears, function(bot, message) {
  
  bot.reply(message, message['fulfillment']['speech']);
});


// DEFAULT INTENT
botVars.slackController.hears(['Default Fallback Intent'], 'direct_message, direct_mention, mention', botVars.dialogflowMiddleware.hears, function(bot, message) {
  
  bot.reply(message, message['fulfillment']['speech']);
});

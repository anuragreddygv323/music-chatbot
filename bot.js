/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
           ______     ______     ______   __  __     __     ______
          /\  == \   /\  __ \   /\__  _\ /\ \/ /    /\ \   /\__  _\
          \ \  __<   \ \ \/\ \  \/_/\ \/ \ \  _"-.  \ \ \  \/_/\ \/
           \ \_____\  \ \_____\    \ \_\  \ \_\ \_\  \ \_\    \ \_\
            \/_____/   \/_____/     \/_/   \/_/\/_/   \/_/     \/_/
This is a sample Slack bot built with Botkit, using the Dialogflow middleware.
This bot demonstrates many of the core features of Botkit:
* Connect to Slack using the real time API
* Receive messages based on "spoken" patterns
* Reply to messages
# RUN THE BOT:
  Get a Bot token from Slack:
    -> http://my.slack.com/services/new/bot
  Get a developer access token from dialogflow
    -> https://console.dialogflow.com/api-client/#/editAgent/<your-agent-id>
  Run your bot from the command line:
    dialogflow=<api-token> token=<token> node example_bot.js
# USE THE BOT:
  Train an intent titled "hello-intent" inside Dialogflow.  Give it a bunch of examples
  of how someone might say "Hello" to your bot.
  Find your bot inside Slack to send it a direct message.
  Say: "Hello"
  The bot should reply "Hello!" If it didn't, your intent hasn't been
  properly trained - check out the dialogflow console!
  Make sure to invite your bot into other channels using /invite @<my bot>!
# EXTEND THE BOT:
  Botkit is has many features for building cool and useful bots!
  Read all about it here:
    -> http://howdy.ai/botkit
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

// CHECKS FOR THE SLACK AND DIALOGFLOW TOKENS
if (!process.env.token) {
    console.log('Error: Specify token in environment');
    process.exit(1);
}

if (!process.env.dialogflow) {
    console.log('Error: Specify dialogflow in environment');
    process.exit(1);
}


// FUNCTION TO CLEAR THE ACTIVE CONTEXT
var sendClearContext = function(sessionID) {
  var request = require('request');
  var options = {
    method: 'DELETE',
    uri: 'https://api.dialogflow.com/v1/contexts?sessionId=' + sessionID,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + process.env.dialogflow
    }
  };
  
  function callback(error, response, body) {
    if (!error && response.statusCode == 200) {
      // console.log(body);
      // console.log(response);
    }
  }
  request(options, callback)
}


// VARIABLES DECLARATION
var Botkit = require('botkit');
var FuzzySet = require('fuzzyset.js')
var http = require('http');
var bot_options = {
    clientId: process.env.clientId,
    clientSecret: process.env.clientSecret,
    //debug: true,
    scopes: ['bot'],
};
var slackController = Botkit.slackbot(bot_options);
var slackBot = slackController.spawn({
    token: process.env.token,
});
var dialogflowMiddleware = require('botkit-middleware-dialogflow')({
    token: process.env.dialogflow,
});
var mispellingSolver = FuzzySet();
var lineReader = require('readline').createInterface({
  input: require('fs').createReadStream('names.txt')
});
lineReader.on('line', function (line) {
  mispellingSolver.add(line);
});
var iter = 0;


// INITs
slackController.middleware.receive.use(dialogflowMiddleware.receive);
slackBot.startRTM();


// WORKS-BY-ARTIST INTENT
slackController.hears(['works-by-artist'], 'direct_message, direct_mention, mention', dialogflowMiddleware.hears, function(bot, message) {
  
  function doQuery(artist, number) {
    // DEFAULT NUMBER VALUE (IN CASE IS NOT GIVEN)
    if (isNaN(parseInt(number))) {
      number = 10;
    }

    // JSON VERSION
    var jsonQuery = "http://data.doremus.org/sparql?default-graph-uri=&query=SELECT+DISTINCT+%3Ftitle%0D%0AWHERE+%7B%0D%0A++%3Fexpression+a+efrbroo%3AF22_Self-Contained_Expression+%3B%0D%0A++++rdfs%3Alabel+%3Ftitle+.%0D%0A++%3FexpCreation+efrbroo%3AR17_created+%3Fexpression+%3B%0D%0A++++ecrm%3AP9_consists_of+%2F+ecrm%3AP14_carried_out_by+%3Fcomposer+.%0D%0A++%3Fcomposer+foaf%3Aname+%22" + artist + "%22%0D%0A%7D%0D%0AORDER+BY+rand%28%29%0D%0ALIMIT+" + number + "%0D%0A&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on"
    var jsonQuery = "http://data.doremus.org/sparql?default-graph-uri=&query=SELECT+DISTINCT+%3Ftitle%0D%0AWHERE+%7B%0D%0A++%3Fexpression+a+efrbroo%3AF22_Self-Contained_Expression+%3B%0D%0A++++rdfs%3Alabel+%3Ftitle+.%0D%0A++%3FexpCreation+efrbroo%3AR17_created+%3Fexpression+%3B%0D%0A++++ecrm%3AP9_consists_of+%2F+ecrm%3AP14_carried_out_by+%3Fcomposer%0D%0A++VALUES+%28%3Fcomposer%29+%7B%0D%0A++++%28%3Chttp%3A%2F%2Fdata.doremus.org%2Fartist%2F" + artist + "%3E%29%0D%0A++%7D%0D%0A%0D%0A%7D%0D%0AORDER+BY+rand%28%29%0D%0ALIMIT+" + number + "%0D%0A&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on";

    const request = require('request');
    request(jsonQuery, (err, res, body) => {

      if (err) { return console.log(err); }

      // JSON PARSING
      var json = JSON.parse(body)

      // RESPONSE
      var resp = "This is the list:\n";
      json["results"]["bindings"].forEach(function(row) {
        resp += ("  >  " + row["title"]["value"] + "\n");
      });
      bot.reply(message, resp);
      
    });
  }
  
  var getUriAndQuery = function(sessionID, resolvedName, number) {
    var request = require('request');
    var options = {
      method: 'GET',
      uri: 'https://api.dialogflow.com/v1/entities/ebf4cca4-ea6b-4e55-a901-03338ea5691e?sessionId=' + sessionID,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.dialogflow
      }
    };

    function callback(error, response, body) {

      // JSON PARSING
      var json = JSON.parse(body)
      var found = false

      // NO forEach CONSTRUCT, BECAUSE OF UNIQUENESS!
      for(var i = 0; i < json["entries"].length; i++) {
        var entry = json["entries"][i]      
        for(var j = 0; j < entry["synonyms"].length; j++) {
          if(entry["synonyms"][j] === resolvedName) {

            // GET PARAMETERS
            var artist = entry["value"];
            // var number = message.entities["number"];
            
            found = true;
            break;
          }
        }
        
        if (found) {
          doQuery(artist, number);
          break;
        }
      }
    };

    request(options, callback)
  }
  
  if (message['nlpResponse']['result']['actionIncomplete'] == false) {
    
    // GET PARAMETERS
    var artist = message.entities["doremus-artist-ext"];
    var number = message.entities["number"];
    
    doQuery(artist, number);
  }
  else {
    
    // MISSING ARTIST NAME
    // - check for misspelling and ask for the most similar (over threshold)
    // - otherwise forward the question sent by DialogFlow ("for which artist?")
    
    // Retrieve the mispelled string
    var misspelled = message.entities["any"];
    
    // If contains something...
    if (misspelled != '') {
      
      // Try to solve it and propose the alternatives,
      // otherwise send the NLP question
      var result = mispellingSolver.get(misspelled);
      if (result != null) {
        
        // Case YES
        if (message['nlpResponse']['result']['resolvedQuery'] === "yes" ||
           message['nlpResponse']['result']['resolvedQuery'] === "yeah" ||
           message['nlpResponse']['result']['resolvedQuery'] === "yep" ||
           message['nlpResponse']['result']['resolvedQuery'] === "sure") {
          
          getUriAndQuery(message['nlpResponse']['sessionId'], result[iter][1], message.entities["number"]);
          
          // We must clear the context
          sendClearContext(message['nlpResponse']['sessionId']);
          iter = 0;
        }
        // Case NO
        else if (message['nlpResponse']['result']['resolvedQuery'] === "no" ||
                message['nlpResponse']['result']['resolvedQuery'] === "nope" ||
                message['nlpResponse']['result']['resolvedQuery'] === "not really") {
          
          if (iter < 3 && iter < result.length) {
            
            bot.reply(message, "Did you mean " + result[iter][1] + "?");
            iter += 1
          }
          else {
            
            bot.reply(message, "Ok, sorry for that!");
          
            // We must clear the context
            sendClearContext(message['nlpResponse']['sessionId']);
            iter = 0;
          }
        }
        else {
          
          bot.reply(message, "Did you mean " + result[iter][1] + "?");
          iter += 1
        }
      }
      else {
        bot.reply(message, message['fulfillment']['speech']);
      }
    }
    // if the string doesn't contain anything, send the NLP question
    else {
      
      bot.reply(message, message['fulfillment']['speech']);
    }
  }
});

// HELLO INTENT
slackController.hears(['discover-artist'], 'direct_message, direct_mention, mention', dialogflowMiddleware.hears, function(bot, message) {
  console.log(message);
  var artist = message.entities["doremus-artist-ext"];
  var query = "http://data.doremus.org/sparql?default-graph-uri=&query=SELECT+DISTINCT+%3Fcomposer%2C+%3Fbio%2C+xsd%3Adate%28%3Fd_date%29+as+%3Fdeath_date%2C+%3Fdeath_place%2C+xsd%3Adate%28%3Fb_date%29+as+%3Fbirth_date%2C+%3Fbirth_place%2C+%3Fimage%0D%0AWHERE+%7B%0D%0A++VALUES%28%3Fcomposer%29+%7B%28%3Chttp%3A%2F%2Fdata.doremus.org%2Fartist%2F" + artist + "%3E%29%7D+.%0D%0A++%3Fcomposer+rdfs%3Acomment+%3Fbio+.%0D%0A++%3Fcomposer+foaf%3Adepiction+%3Fimage+.%0D%0A++%3Fcomposer+schema%3AdeathDate+%3Fd_date+.%0D%0A++%3Fcomposer+dbpprop%3AdeathPlace+%3Fd_place+.%0D%0A++%3Fd_place+rdfs%3Alabel+%3Fdeath_place+.%0D%0A++%3Fcomposer+schema%3AbirthDate+%3Fb_date+.%0D%0A++%3Fcomposer+dbpprop%3AbirthPlace+%3Fb_place+.%0D%0A++%3Fb_place+rdfs%3Alabel+%3Fbirth_place+.%0D%0A++FILTER+%28lang%28%3Fbio%29+%3D+%27en%27%29%0D%0A%7D&format=json"
  bot.reply(message, message['fulfillment']['speech']);
  json =
});


// HELLO INTENT
slackController.hears(['hello-intent'], 'direct_message, direct_mention, mention', dialogflowMiddleware.hears, function(bot, message) {
  console.log(message);
  bot.reply(message, message['fulfillment']['speech']);
});


// DEFAULT INTENT
slackController.hears(['Default Fallback Intent'], 'direct_message, direct_mention, mention', dialogflowMiddleware.hears, function(bot, message) {
  bot.reply(message, message['fulfillment']['speech']);
});

// NEW INTENT
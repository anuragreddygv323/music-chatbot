# DOREMUS Bot
### A virtual assistant for answering classical music related questions based on the [DOREMUS](http://www.doremus.org/) Knowledge Graph

- [Description](#description)
- [Getting started](#getting-started)
    - [What you need](#what-you-need)
    - [Installing](#installing)
    - [Code organization](#code-organization)
    - [Configuring](#configuring)
    - [Development](#development)
    - [Deploying](#deploying)
- [Bot Features](#bot-features)
- [Log Files](#log-files)
- [Credits](#credits)
- [License](#license)

## Description

##### This repository contains the code of the "DOREMUS Bot", a bot capable of answering and providing results to a set of classical music related questions.

The bot makes use of different resources:
- It's built using the [BotKit](https://github.com/howdyai/botkit) bot building tool.

- It uses the [DOREMUS](https://github.com/DOREMUS-ANR) knowledge graph as source of informations to answer the questions.

- It uses [Dialogflow](https://github.com/dialogflow) as Natural Language Understanding engine. The communication with the NLU is managed thanks to a modified version of the [botkit-middleware-dialogflow](https://github.com/jschnurr/botkit-middleware-dialogflow).

- It is connected with [Slack](https://slack.com) and/or [Facebook Messenger](https://www.messenger.com) and one can start messaging with the bot at the [Facebook page](https://facebook.com/doremusbot/).

- In a lightweight version (without spell checking and language detection), it is also able to work with a device running [Google Assistant](https://assistant.google.com) (e.g. Google Home).

- It has a web interface for [online chat](https://chatbot.doremus.org) through a browser.

The architecture is the following:
![DOREMUS Bot architecture](./final-report/images/arch2.png)

## Getting started

### What you need
Make sure you have [Node.js](https://nodejs.org/en/download/) installed in your local machine.

### Installing

```
git clone https://github.com/D2KLab/music-chatbot.git
cd music-chatbot
npm install
```

### Code organization
```
bot.js
spell-checker-middleware.js
logger.js

config/
    .env

doremus/
    bot_functions.js

slack/
    slack_io.js
    slack_cards.js

facebook/
    facebook_io.js
    facebook_cards.js

webchat/
    webchat_io.js
    webchat_cards.js

dialogflow/
    index.js
    functions.js
    io.js
```

- [`bot.js`](./bot.js) is the entry point of the node application. It contains the code to declare the fundamental libraries, to start the RTM, and to load the hears methods.

- [`spell-checker-middleware.js`](./spell-checker-middleware.js) is the custom module to perform the spell-checking before sending the received sentences to the NLP.

- [`logger.js`](./logger.js) is the module which logs various informations inside the log files (created in the `log_folder` specified in the `.env` file). For more informations read the [log files section](#log-files).

- `.env` is the secret file (to be put in the 'config' directory) containing all the tokens for Slack, Facebook and BotKit Studio. You have to set it following the [configuration section](#configuring).

- [`doremus/`](./doremus/) contains the files related to the access to the informations of the DOREMUS knowledge base: in this case, contains a single file ([bot_functions.js](./doremus/bot_functions.js)) that contains all the queries that the bot can do to DOREMUS.

- [`slack/`](./slack/) is a directory containing the files related to Slack:

    - [`slack_io.js`](./slack/slack_io.js) contains the methods to receive the sentences sent through Slack and processed by the NLU.
    - [`slack_cards.js`](./slack/slack_cards.js) contains the code to build the Slack cards to make the answers prettier.

- [`facebook/`](./facebook/) is a directory containing the files related to Facebook:

    - [`facebook_io.js`](./facebook/facebook_io.js) contains the methods to receive the sentences sent through Facebook and processed by the NLU.
    - [`facebook_cards.js`](./facebook/facebook_cards.js) contains the code to build the Facebook cards to make the answers prettier.

- [`webchat/`](./webchat/) is a directory containing the files related to the Web Chat:

    - [`webchat_io.js`](./webchat/webchat_io.js) contains the methods to receive the sentences sent through the Web Chat and processed by the NLU.
    - [`webchat_cards.js`](./webchat/webchat_cards.js) contains the code to build the Web Chat cards to make the answers prettier.

- [`dialogflow/`](./dialogflow/) is a directory containing the webhook useful for the Dialogflow fulfillment phase. This flow is totally detached from our original architecture (which uses Botkit), and it's useful only for the lightweight version of the bot which can be used with Google Home.

### Configuring
Prepare a `.env` for your node app. You can easily copy-paste the following:
```
# Environment Config
# (reference these in your code with process.env.SECRET)

# ports
PORT=3000
PORT2=5000

# log directory
log_folder='./logs'

# slack
slackToken=<slack token>
clientId=<your client id>
clientSecret=<your client secret>

# facebook
fbAccessToken=<fb access token>
fbVerifyToken=<fb verify token>
fbAppSecret=<fb app secret token>

# webchat
webchatBaseUrl=/
webchatPort=3003

# dialogflow
dialogflow=<dialogflow token>
```

You need:
- [Slack token](https://api.slack.com/apps)
- [Facebook tokens](https://developers.facebook.com/apps/)
- Dialogflow token ([contact us](#credits) to get the token!)

### Development
To build the CSS files for the Web Chat platform, run:
```
npm run build:css
```

### Deploying
You can easily launch the bot with:
```
npm start
```

Alternatively, you can deploy it with Docker:

```
docker build -t jplu/node github.com/pasqLisena/docker-node
docker build -t doremus/chatbot .
docker run -d -p 5052:3000 -p 5053:3001 -p 5054:3003 --restart=unless-stopped -v /var/docker/doremus/music-chatbot/config:/config -v /var/docker/doremus/music-chatbot/logs:/logs --name doremus-bot doremus/chatbot
```

Uninstall from Docker (stop, remove from available containers, remove from images):
```
docker stop doremus-bot
docker rm doremus-bot
docker rmi doremus/chatbot
```

Enjoy!

## Bot Features
The intents are grouped in a simple and clear way, according to what the user
wants to retrieve from the DOREMUS knowledge base. The bot can:

- retrieve a set of works according to different filters (artists who composed
the works, instruments used, music genre and/or year of composition).
    - *"Give me 3 works composed by Bach"*
    - *"Give me 2 works for violin, clarinet and piano"*
    - *"Tell us 4 works for violin or piano"*
    - *"List me 10 works of genre concerto"*
    - *"Tell me one work composed during 1811"*
    - *"Give us 3 works written between 1782 and 1821"*

- find a set of artists according to some filters (number of composed works,
number of works of a given genre, etc.).
    - *"Find the five artists who composed more concerto works"*
    - *"Find the 3 artists, born between 1752 and 1772, who composed more works"*
    - *"Find one artist, born between 1752 and 1772, who wrote more works for clarinet"*

- propose to the user a future performance (that can be filtered by city and/or
date period), or show to the user the details of a past performance.
    - *"Tell me one event in Paris in the next month!"*

- show a card with a summary of an artist, with its birth/death place and
date, a picture and a little bio. After the card visualization, a set of works
of the artist (connection with the works-by intent) can be asked.
    - *"Tell me something about Mozart"*
    - *"What do you know about Beethoven?"*


The bot is also capable of mixing the "artist discovering" and "works finding" intents:
after asking the bot of the details of an artist, the user can retrieve its works,
applying the usual filters. Let's make an example:

- *"Tell me something about Mozart"*
- [Result with bio, picture, birth/death date/place]
- *"Now give me 5 of his works, written for clarinet"*
- [Result with the 5 works of that artist]

## Log Files
The bot will also generate logs in the directory specified in the `log_folder` variable of the `.env` file. The format of the csv files is the following:
- timestamp - *the current date-time in the format YYYY/MM/DD hh:mm:ss.*
- platform - *the platform from which the message comes from (`"slack"`,`"fb"`,`"webchat"`,`"google_assistant"`).*
- user - *the ID of the user sending the message.*
- team - *the team of the user sending the message.*
- intent - *the intent which has been detected by the NLP.*
- confidence - *the confidence level of the NLP in choosing that intent.*
- lang - *the detected language of the message.*
- rawMessage - *the message sent by the user, before spell-checking.*
- cleanMessage - *the message sent by the user, after spell-checking.*
- response - *the answer given by the bot (textual or <result_card>).*

Each log file contains informations for each month (e.g. `doremus_log_2018-05.csv`, `doremus_log_2018-06.csv`, etc.).

## Credits

- Claudio Scalzo <<claudio.scalzo@outlook.com>> (https://www.linkedin.com/in/claudioscalzo)
- Luca Lombardo <<lomluca12@gmail.com>> (https://www.linkedin.com/in/lomluca)

## License

This project is licensed under the Apache License 2.0 - see the [license](./LICENSE) file for details.

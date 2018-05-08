
# Publisher

Automatically publishes events to multiple online resources (e.g. Eventbrite, Facebook).

## Installation

For Windows, run this command first:

    npm install -g --production windows-build-tools
    
Then run `yarn` to get all the dependencies:

    yarn

## Preparation

If you have to publish many events, you'll need to switch your EventBrite account package (https://www.eventbrite.com/myaccount/plan/) to **EventBrite Proffessional**.

To store intermediate event data, you'll need a Firebase database. Empty database example is given in the `firebase_empty_db.json` file. The `firebase_rules.json` file describes required Firebase indexing rules.

## Running 

Define environment variable with EventBrite OAuth token:

    export EVENTBRITE_TOKEN=********

Define environment variable with FireBase store:

    export FIREBASE_STORE=http://<project>.firebaseio.com/<store>

Run publication task:

    gulp publishExtremeAutomation


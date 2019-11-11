
# Publisher

Automatically publishes events to multiple online resources (e.g. Eventbrite, Facebook).

## Installation

For Windows, run this command first:

    npm install -g --production windows-build-tools
    
Then run `yarn` to get all the dependencies:

    yarn

## Preparation

If you want to save intermediate event data across the runs, you'll need a Firebase database. Empty database example is given in the `firebase_empty_db.json` file. The `firebase_rules.json` file describes required Firebase indexing rules.

## Running 

Define environment variable with EventBrite OAuth token:

    export EVENTBRITE_TOKEN=********

(Optional) Define environment variable with FireBase store:

    export FIREBASE_STORE=http://<project>.firebaseio.com/<store>

Run publication task:

    yarn gulp publishExtremeAutomation


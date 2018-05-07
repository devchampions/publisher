
# Publisher

Automatically publishes events to multiple online resources (e.g. Eventbrite, Facebook).

## Installation

For Windows, run this command first:

    npm install -g --production windows-build-tools
    
Then run `yarn` to get all the dependencies:

    yarn

## Running 

Define environment variable with EventBrite OAuth token:

    export EVENTBRITE_TOKEN=********

Run publication task:

    gulp publishExtremeAutomation


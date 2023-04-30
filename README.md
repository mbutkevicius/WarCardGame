This project was intended to create the card game War. Unfortunately, I was not able to implement the war aspect of the game. Programming the logic on the server 
side to calculate the winner is not that hard to do. However, managing the UI that the players see has proven to be the most challening aspect of this project. 
I could not implement the UI to work with the war aspect of the game in time. I changed the project without including a war instance in the case of a tie. 
What I did to determine who wins in a tie is to let the suit determine the winner. The game plays nicely and I am quite happy with what I completed. I am 
going to try to finish to game when the semester ends since I was not able to in time for the project due date. 

This project was created with the help of M. S. Farzan's YouTube video series: How to Build a Multiplayer Card Game with Phaser 3, Express, and Socket.IO. Link below
https://www.youtube.com/watch?v=9v-VbkUGais&list=PLCbP9KGntfcEDAiseVwYVbrmJdoYajNtw&index=1

Project setup:

    in your project folder, open a command line and enter the following commands:
    At root level:
        npm install  (might have to install this one in client folder)
        npm install -save express nodemon socket.io
        npm install shuffle-array

    Move the client folder. Enter these commands:
        npm install socket.io-client

To run the game:

    enter client folder. In command line, enter this command on Windows:
        set NODE_OPTIONS=--openssl-legacy-provider
        npm run start

    On Mac:
        export NODE_OPTIONS=--openssl-legacy-provider
        npm run start

    move to root level:
        node server.js

    in browser, this should open a new tab with the game. Just open another tab with URL: localhost:8080 to connect the second client
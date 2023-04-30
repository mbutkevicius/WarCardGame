/*
Server gets and shuffles players decks. Server lets client know which player is playerA or playerB. 
Server lets client know how many cards each player has. Server lets client know when to start the game.
It also calculates who wins which round and the messages to display on the clients depending on the result of the round.

*/
const server = require('express')();
const http = require('http').createServer(server);
const cors = require('cors');
const shuffle = require('shuffle-array');
const deck = shuffle([
    "2S", "3S", "4S", "5S", "6S", "7S", "8S", "9S", "10S", "JS", "QS", "KS", "AS",
    "2H", "3H", "4H", "5H", "6H", "7H", "8H", "9H", "10H", "JH", "QH", "KH", "AH",
    "2C", "3C", "4C", "5C", "6C", "7C", "8C", "9C", "10C", "JC", "QC", "KC", "AC",
    "2D", "3D", "4D", "5D", "6D", "7D", "8D", "9D", "10D", "JD", "QD", "KD", "AD"
]);
const rankValues = {
    "A": 14, "K": 13, "Q": 12, "J": 11, "10": 10, "9": 9, "8": 8, "7": 7, "6": 6,
    "5": 5, "4": 4, "3": 3, "2": 2
};
const suitValues = {
    "S": 4, "H": 3, "D": 2, "C": 1
};
let playerADeck;
let playerBDeck;
let players = {};
let playerAId;    // socket id of playerA
let playerBId;    // socket id of playerB
let readyCheck = 0;
//let gameState = "Initializing";
let calculateRoundInProgress = false;
// cors allows cross origin resource sharing
const io = require('socket.io')(http, {
    cors: {
        origin: 'http://localhost:8080',      
        methods: ["GET", "POST"]
    }
});

// displays message on server when client connects and determines playerA and playerB
io.on('connection', function (socket) {
    console.log('A user connected: ' + socket.id);

    // Setup players object. Use socket id as key. Value is an object containing deck and isPlayerA
    players[socket.id] = { 
        inDeck: [],
        isPlayerA: false
    }

    // when first player connects, they are playerA
    if (Object.keys(players).length < 2) {
        players[socket.id].isPlayerA = true;
        playerAId = socket.id;
    }

    // deals the deck to both players on connection. Sends message to client to change game state to "Ready" when both players connect
    // sends the socket id of the player that emitted this message
    socket.on('dealDeck', function (socketId) {
        let half = Math.ceil(deck.length / 2);    // half the deck (26)
        playerADeck = deck.slice(0, half);    // place first half of shuffled deck in playerADeck
        playerBDeck = deck.slice(half);       // place second half of shuffled deck in playerBDeck

        // deal playerA's deck and displays which players are playerA and playerB
        if (players[socket.id].isPlayerA) {
            players[socketId].inDeck = playerADeck;
            // send messsage to first client that joins that they are playerA
            io.to(socket.id).emit('setPlayerA');
        }
        // send messsage to second client that joins which players are playerA and playerB
        else {
            io.to(socket.id).emit('setPlayerB');
        }

        // return if there is only one player to prevent ready message from being sent
        if (Object.keys(players).length < 2) {
            return;
        }

        // give playerB the rest of the deck
        if (!(players[socket.id].isPlayerA)) {
            players[socketId].inDeck = playerBDeck;
            playerBId = socket.id;
        }

        // prints the players object to the console for debugging
        console.log(players);
        console.log(playerADeck[0]);
        console.log(playerBDeck[0]);
        //matches with the changeGameState function on client. Sends "Ready" into parameter gameState
        io.emit('changeGameState', "Ready", playerADeck[0], playerBDeck[0]);
    })

    // when a card is played, send message to client to display the card that was played
    socket.on('cardPlayed', function (cardName, socketId) {
        // reset calculateRoundInProgress to false so that the next round can be calculated
        calculateRoundInProgress = false;
        io.emit('cardPlayed', cardName, socketId);
    })

    socket.on('calculateRound', function () {
        // for some reason, this function was being called twice. This check prevents that from happening
        if (calculateRoundInProgress) {
            return;
        }
        // set this to true once the event is triggered to prevent multiple round calculations
        calculateRoundInProgress = true;
        let winner;
        // get the numerical value from the card name
        let playerARank = rankValues[playerADeck[0].slice(0, -1)];
        let playerBRank = rankValues[playerBDeck[0].slice(0, -1)];
        console.log(playerARank); // prints the numerical value of the card
        console.log(playerBRank); // prints the numerical value of the card
        
        // if player A wins
        if (playerARank > playerBRank) {
            // when player wins, move their card to the back of their deck
            let moveFirstCard = playerADeck.shift();
            playerADeck.push(moveFirstCard);
            players[playerAId].inDeck = playerADeck;
            console.log("Player A wins!");
            // when player wins, take loser's card and put it at the back of winner's deck
            let card = playerBDeck[0];
            playerADeck.push(card);
            // remove loser's card from their deck
            playerBDeck.splice(0 ,1);
            players[playerBId].inDeck = playerBDeck;
            players[playerAId].inDeck = playerADeck;
            winner = "Player 1 Wins Round!";
        } 
        // if playerB wins
        else if (playerARank < playerBRank) {
            // when player wins, move their card to the back of their deck
            let moveFirstCard = playerBDeck.shift();
            playerBDeck.push(moveFirstCard);
            players[playerBId].inDeck = playerBDeck;
            console.log("Player B wins!");
            // when player wins, take loser's card and put it at the back of winner's deck
            let card = playerADeck[0];
            playerBDeck.push(card);
            // remove loser's card from their deck
            playerADeck.splice(0, 1);
            players[playerAId].inDeck = playerADeck;
            players[playerBId].inDeck = playerBDeck;
            winner = "Player 2 Wins Round!";
        }
        // tie condition
        else {
            // get numerical value of suit
            let playerASuit = suitValues[playerADeck[0].slice(-1)];
            let playerBSuit = suitValues[playerBDeck[0].slice(-1)];
            console.log(playerARank);
            console.log(playerBRank);
            if (playerASuit > playerBSuit) {
                // when player wins, move their card to the back of their deck
                let moveFirstCard = playerADeck.shift();
                playerADeck.push(moveFirstCard);
                players[playerAId].inDeck = playerADeck;
                console.log("Player A wins!");
                // when player wins, take loser's card and put it at the back of winner's deck
                let card = playerBDeck[0];
                playerADeck.push(card);
                // remove loser's card from their deck
                playerBDeck.splice(0 ,1);
                players[playerBId].inDeck = playerBDeck;
                players[playerAId].inDeck = playerADeck;
                winner = "Player 1 Wins Round!";
            } 
            else if (playerASuit < playerBSuit) {
                // when player wins, move their card to the back of their deck
                let moveFirstCard = playerBDeck.shift();
                playerBDeck.push(moveFirstCard);
                players[playerBId].inDeck = playerBDeck;
                console.log("Player B wins!");
                // when player wins, take loser's card and put it at the back of winner's deck
                let card = playerADeck[0];
                playerBDeck.push(card);
                // remove loser's card from their deck
                playerADeck.splice(0, 1);
                players[playerAId].inDeck = playerADeck;
                players[playerBId].inDeck = playerBDeck;
                winner = "Player 2 Wins Round!";
            }
        }
        console.log(players);
        console.log(players[playerAId].inDeck[0]);
        console.log(players[playerBId].inDeck[0]);

        // update playerA's cards
        io.to(playerAId).emit('playerACardCount', players[playerAId].inDeck.length, players[playerBId].inDeck.length);
        // update playerB's cards
        io.to(playerBId).emit('playerBCardCount', players[playerBId].inDeck.length, players[playerAId].inDeck.length);

        // check if player A has no cards left (gameover condition)
        if (players[playerAId].inDeck.length === 0) {
            winner = "Player 2 Wins Game!";
            io.emit('changeGameState', "GameOver", players[playerBId].inDeck[0], players[playerBId].inDeck[1], winner);
            return;
        }
        // check if player B has no cards left (gameover condition)
        else if (players[playerBId].inDeck.length === 0) {
            winner = "Player 1 Wins Game!";
            io.emit('changeGameState', "gameOver", players[playerAId].inDeck[0], players[playerAId].inDeck[1], winner); 
            return;
        }
        // send message to clients to reset everything for next round if no players have won yet
        else {
            io.emit('changeGameState', "prepareNextRound", players[playerAId].inDeck[0], players[playerBId].inDeck[0], winner);
        }
    });
})

// listening for requests on port 3000
http.listen(3000, function () {
    console.log('Server started!');
})
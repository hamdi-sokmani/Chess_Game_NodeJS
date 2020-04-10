const express = require('express');
const http = require('http');
const socket = require('socket.io');

const port = process.env.PORT || 8080

var app = express();
const server = http.createServer(app)
const io = socket(server)

// numero de joueurs dans le salon
var players;
var joined = true;
var users = [];
var connections = [];

app.use(express.static(__dirname + "/"));

var games = Array(100);
for (let i = 0; i < 100; i++) {
    games[i] = {players: 0 , pid: [0 , 0]};
}

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

//Connexion au serveur
io.on('connection', function (socket) {

    //Connexion
    connections.push(socket);
    console.log('Connected: %s sockets connected', connections.length);

    var color;
    // playerId aléatoire pour chaque joueur
    var playerId =  Math.floor((Math.random() * 100) + 1)

    // Un joueur a rejoint roomId
    socket.on('joined', function (roomId) {
        // games[roomId] = {}
        // check if there's more less than 2 players
        if (games[roomId].players < 2) {
            games[roomId].players++;
            games[roomId].pid[games[roomId].players - 1] = playerId;
        }
        // redirect to full page
        else{
            socket.emit('full', roomId)
            return;
        }

        console.log(games[roomId]);
        // définir le nombre de joueurs
        players = games[roomId].players

        // donner des couleurs aux joueurs
        // obtenir d'abord blanc l'autre devient noir
        if (players % 2 == 0) color = 'black';
        else color = 'white';

        // signaler aux joueurs qu'un joueur a rejoint
        // --> ajoutez-le au chat de cette pièce
        socket.emit('player', { playerId, players, color, roomId })
        // players--;

    });


    // signaler qu'un mouvement a été fait
    socket.on('move', function (msg) {
        socket.broadcast.emit('move', msg);
        // console.log(msg);
    });

    // signaler que le jeu est en session
    socket.on('play', function (msg) {
        socket.broadcast.emit('play', msg);
        console.log("ready " + msg);
    });


    //Deconnexion
    socket.on('disconnect', function () {
        for (let i = 0; i < 100; i++) {
            if (games[i].pid[0] == playerId || games[i].pid[1] == playerId)
                games[i].players--;
        }
        
        //Deconnexion
        io.sockets.emit('user disconnected', {user: socket.username});
        //Supprimer l'utilisateur des utilisateurs
        users.splice(users.indexOf(socket.username), 1);
        //Mettre à jour la liste des noms d'utilisateurs
        updateUsernames();
        //Supprimer la connexion
        connections.splice(connections.indexOf(socket), 1);
        console.log('Disconnected: %s sockets connected', connections.length);

    }); 
    
    //Envoyer le message
    socket.on('send message', function(data){
        console.log(data);
        io.sockets.emit('new message', {msg: data, user: socket.username});
    });

    // Nouvel utilisateur
    socket.on('new user', function(data, callback){
        callback(true);
        socket.username = data;
        users.push(socket.username);
        updateUsernames();
    });    

    //Informer les utilisateurs de la liste des noms d'utilisateurs
    function updateUsernames(){
        io.sockets.emit('get users', users);
    };

});

server.listen(port);
console.log('Connected');
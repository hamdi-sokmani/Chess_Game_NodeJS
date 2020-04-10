
//Variables
game = new Chess();
var socket = io();

var color = "white";
var players;
var roomId;
var play = true;
var board;
var room = document.getElementById("room")
var roomNumber = document.getElementById("roomNumbers")
var button = document.getElementById("button")
var state = document.getElementById('state')

// Quand un joueur entre un nombre d'une partie
var connect = function(){
    roomId = room.value;
    if (roomId !== "" && parseInt(roomId) <= 100) {
        room.remove(); // supprimer le numero de la partie
        roomNumber.innerHTML = "Room Number " + roomId;
        button.remove(); // supprimer le button 
        socket.emit('joined', roomId); // envoyer les informations au serveur
    }
}

// la partie a commencee 
socket.on('play', function (msg) {
    if (msg == roomId) {
        play = false;
        state.innerHTML = "Game in progress"
    }
});

// gestion de mouvement des pieces 
socket.on('move', function (msg) {
    if (msg.room == roomId) {
        game.move(msg.move);
        board.position(game.fen());
        console.log("moved")
    }
});

// un joeur a entree
socket.on('player', (msg) => {
    // tag
    var plno = document.getElementById('player')
    // couleur du joueur
    color = msg.color;
    // afficher information du joeur
    plno.innerHTML = 'Player ' + msg.players + " : " + color;
    // nombre des joueurs
    players = msg.players;

    // si 2 joueurs
    if(players == 2){
        // signaler aux autres joueurs que le jeu a commence
        play = false;
        socket.emit('play', msg.roomId);
        state.innerHTML = "Game in Progress"
    }
    else
        state.innerHTML = "Waiting for Second player";


    // configuration du jeu
    var cfg = {
        orientation: color,
        draggable: true,
        position: 'start',
        onDragStart: onDragStart,
        onDrop: onDrop,
        onMouseoutSquare: onMouseoutSquare,
        onMouseoverSquare: onMouseoverSquare,
        onSnapEnd: onSnapEnd
    };
    // creation de l'échiquier
    board = ChessBoard('board', cfg);
});

// gestion de la partie qui est pleine
socket.on('full', function (msg) {
    if(roomId == msg)
        alert('This room is full');
});

// functions de suggestion des suggestions des positions
var removeGreySquares = function () {
    $('#board .square-55d63').css('background', '');
};

var greySquare = function (square) {
    var squareEl = $('#board .square-' + square);

    var background = '#a9a9a9';
    if (squareEl.hasClass('black-3c85d') === true) {
        background = '#696969';
    }

    squareEl.css('background', background);
};

var onDragStart = function (source, piece) {
    // Ne pas selectionners des pieces lorsque la partie est terminee 
    // Ou c'est le tour de l'autre joueur
    if (game.game_over() === true || play ||
        (game.turn() === 'w' && piece.search(/^b/) !== -1) ||
        (game.turn() === 'b' && piece.search(/^w/) !== -1) ||
        (game.turn() === 'w' && color === 'black') ||
        (game.turn() === 'b' && color === 'white') ) {
        return false;
    }
};

var onDrop = function (source, target) {
    removeGreySquares();

    // verifier que le deplacement est legale
    var move = game.move({
        from: source,
        to: target,
        promotion: 'q'
    });

    // signaler que la partie est terminee 
    if (game.game_over()) {
        state.innerHTML = 'GAME OVER';
        socket.emit('gameOver', roomId)
    }

    // mouvement illegale
    if (move === null) return 'snapback';
    else
        socket.emit('move', { move: move, board: game.fen(), room: roomId });

};

var onMouseoverSquare = function (square, piece) {
    // liste de tous les mouvements possibles
    var moves = game.moves({
        square: square,
        verbose: true
    });

    // exit s'il y aucun mouvement possible
    if (moves.length === 0) return;

    // mettre en relief le carré sur lequel ils ont passé la souris
    greySquare(square);

    // mettre en relief les cases possibles pour cette pièce
    for (var i = 0; i < moves.length; i++) {
        greySquare(moves[i].to);
    }
};

var onMouseoutSquare = function (square, piece) {
    removeGreySquares();
};

var onSnapEnd = function () {
    board.position(game.fen());
};

//Partie Chat
$(function(){
    var socket = io.connect();
    var $messageForm = $('#messageForm');
    var $message = $('#message');
    var $chat = $('#chat');
    var $messageArea = $('#messageArea');
    var $userFormArea = $('#userFormArea'); 
    var $userForm = $('#userForm');
    var $users = $('#users');
    var $username = $('#username');


    $messageForm.submit(function(e){
        e.preventDefault(); 
        socket.emit('send message', $message.val());
        $message.val('');
    });

    socket.on('new message', function(data){
        $chat.append('<div class="well"><strong>'+data.user+'</strong>: '+data.msg+'</div>');
    });

    $userForm.submit(function(e){
        e.preventDefault(); 
        socket.emit('new user', $username.val(), function(data){
            if (data){
                $userFormArea.hide();
                $messageForm.show();
                $messageArea.show();
            }
        });
        $username.val('');
    });

    socket.on('get users', function(data){
        var html = '';
        for (i = 0;i < data.length;i++){
            html += '<li class="list-group-item">'+data[i]+'</li>';
        }
        $users.html(html);
    });

    socket.on('user disconnected', function(data){
        $chat.append('<div class="well"><strong>'+data.user+'</strong>: Disconnected</div>');
    });
});


//Partie Canvas
var canvas = document.getElementById("myCanvas");
var ctx=canvas.getContext("2d");
ctx.font="60px Courier New";
ctx.fillStyle = "black";
ctx.textAlign = "center";
ctx.fillText("Welcome to Chess Online", canvas.width/2, canvas.height/2);

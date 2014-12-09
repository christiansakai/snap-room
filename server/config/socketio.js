/**
 * Socket.io configuration
 */

'use strict';

var Room = require('../api/room/room.model');

var config = require('./environment');

// When the user disconnects.. perform this
function onDisconnect(socket) {
 var roomsObject = socket.nsp.adapter.rooms;
 var name = socket.nickname;
 //if user was only in one room when they disconnected:
 for (var  i = 0; i < Object.keys(roomsObject).length; i++) {
   var roomKey = parseInt(Object.keys(roomsObject)[i]);
   var roomNumber = Object.keys(roomsObject)[i];
   if (!isNaN(roomKey) && roomNumber.indexOf(".") === -1) {
     var roomObject = socket.nsp.adapter.rooms[roomNumber];
     if (typeof roomObject === 'object') {
      socket.broadcast.to(roomNumber).emit('countPeople', Object.keys(roomObject).length, name, true);
      socket.emit('countPeople', Object.keys(roomObject).length, name, true);
    }
   }
 }
}

// When the user connects.. perform this
function onConnect(socket, socketio) {
  // When the client emits 'info', this listens and executes

  socket.on('info', function (data) {
    console.info('[%s] %s', socket.address, JSON.stringify(data, null, 2));
  });

  socket.on('joinAnteroom', function(geoRoom) {
    socket.join(geoRoom);
  })

  socket.on('createRoom', function(room, color, geoRoomArr) {
      socket.join(room);
      geoRoomArr.forEach(function(el) {
        socket.broadcast.to(el).emit('refreshRoomList');
      })
  });

  socket.on('join', function(room, name) {
    socket.join(room);

    socket.nickname = name;

    var roomObject = socket.nsp.adapter.rooms[room];

     
    if (typeof roomObject === 'object') {
     var nameArray = []
     for (var socketID in roomObject) {
      nameArray.push(socketio.sockets.connected[socketID].nickname);
      socket.broadcast.to(room).emit('countPeople', Object.keys(roomObject).length, nameArray);
      socket.emit('countPeople', Object.keys(roomObject).length, nameArray);
     }
    }
  })


  socket.on('timeUp', function(roomNumber, geoRoomArr) {
    Room.findOne({"roomNumber":roomNumber}, function(err, room) {
      //console.log("room: " ,room);
      if (!room.expired) {
        room.expired = true;
        room.save(function(err, room) {
          if (room.type === 'lunch') {
            var winner;
            var maxVotes;
            if (room.choices.length > 0) {
              winner = [room.choices[0].choice];
              maxVotes = room.choices[0].votes;
              for (var i = 0; i < room.choices.length; i++) {
                if (room.choices[i].votes > maxVotes) {
                  winner[0] = room.choices[i].choice;
                  maxVotes = room.choices[i].votes;
                }
                else if (room.choices[i].votes === maxVotes
                        && room.choices[i].choice !== winner[0]) {
                  winner.push(room.choices[i].choice);
                }
              }    
            }

            socket.broadcast.to(roomNumber).emit('timeUp', winner, maxVotes, roomNumber);
            socket.emit('timeUp', winner, maxVotes, roomNumber);
          }
          else if (room.type === 'chat' || room.type === 'backgammon') {
            socket.broadcast.to(roomNumber).emit('timeUpChat', room.roomNumber);
            socket.emit('timeUpChat', roomNumber);
          }
          console.log(geoRoomArr);
          geoRoomArr.forEach(function(el) {
            console.log("geoRoom to receive timeUp event", el);
            socket.broadcast.to(el).emit('refreshRoomList');
          })

          socket.emit('refreshRoomList'); 
         }) 
        }
    })
  })


  // Hitting main page or leaving a room
  socket.on('onMainPage', function() {
    // console.log('SOCKET', socket)
    var name = socket.nickname;
    var roomsObject = socket.nsp.adapter.rooms;

   //if roomsObject is an object

    for (var  i = 0; i < Object.keys(roomsObject).length; i++) {
      var roomKey = parseInt(Object.keys(roomsObject)[i]);
      var roomNumber = Object.keys(roomsObject)[i];
      if (!isNaN(roomKey) && roomNumber.indexOf(".") === -1) {

        var roomObject = socket.nsp.adapter.rooms[roomNumber];

        socket.leave(roomNumber);
        if (typeof roomObject === 'object') {
          socket.broadcast.to(roomNumber).emit('countPeople', Object.keys(roomObject).length, name, true);
          socket.emit('countPeople', Object.keys(roomObject).length, name, true);
        }
      }
    }


  })



  // Split Check Sockets

  //UPDATE THIS
  socket.on('joinBillRoom', function(roomNumber) {
    socket.broadcast.to(roomNumber).emit('updateMyBill', roomNumber)
  })

  socket.on('updateBill', function(roomNumber, newBill) {
    socket.broadcast.to(roomNumber).emit('updateBill', newBill);
  })

  socket.on('deleteItem', function(roomNumber, index) {
    socket.broadcast.to(roomNumber).emit('deleteItem', index);
  })

  socket.on('updateTotals', function(roomNumber, totals) {
    socket.broadcast.to(roomNumber).emit('updateTotals', totals);
  })

  // Insert sockets below
  require('../api/gameBoard/gameBoard.socket').register(socket);
}

module.exports = function (socketio) {
  // socket.io (v1.x.x) is powered by debug.
  // In order to see all the debug output, set DEBUG (in server/config/local.env.js) to including the desired scope.
  //
  // ex: DEBUG: "http*,socket.io:socket"

  // We can authenticate socket.io users and access their token through socket.handshake.decoded_token
  //
  // 1. You will need to send the token in `client/components/socket/socket.service.js`
  //
  // 2. Require authentication here:
  // socketio.use(require('socketio-jwt').authorize({
  //   secret: config.secrets.session,
  //   handshake: true
  // }));
  socketio.on('connection', function (socket) {
    socket.address = socket.handshake.address !== null ?
            socket.handshake.address.address + ':' + socket.handshake.address.port :
            process.env.DOMAIN;

    socket.connectedAt = new Date();

    // Call onDisconnect.
    socket.on('disconnect', function () {
      onDisconnect(socket);
      console.info('[%s] DISCONNECTED', socket.address);
    });


    // Call onConnect.
    onConnect(socket, socketio);
    console.info('[%s] CONNECTED', socket.address);
  });
  require('../api/chat/chat.socket').register(socketio);
  require('../api/room/room.socket').register(socketio);
  require('../api/thing/thing.socket').register(socketio);
};
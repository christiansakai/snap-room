'use strict';

angular.module('roomApp')
  .controller('RoomCtrl', function ($scope, $stateParams, socket, $http) {
    $scope.message = 'Hello';
    var ctrl = this;

    this.restName = '';

    this.params = $stateParams;
    var roomNumber = $stateParams.data;

    $scope.roomData = [];
    socket.syncUpdates('room', $scope.roomData, roomNumber);

    this.submitInput = function() {
      $http.put("/api/room/" + this.params.data, 
      	{choice : chatForm.textInput.value})
        .success(function(data){
            // console.log(data);
            ctrl.restName = '';
        })
        .error(function(data){
            console.log("error");
        });
    }

    this.vote = function(choice, index, event) {
      if (event) {
        $(event.target).parent().addClass('animated fadeOutUp');
        ctrl.restaurants.splice(index,1);
      }
      $http.put("/api/room/" + roomNumber, 
        {choice : choice})
        .success(function(data){
        })
        .error(function(data){
            console.log("error");
        });
    }

    this.restaurants = [];

    this.getFourSquare = function() {
        $http.get('/api/room/' + roomNumber + '/vendor/foursquare')
            .success(function(data) {
                console.log('returned data', data)
                var restaurants = data.response.groups[0].items;
                ctrl.restaurants = restaurants;
            })

    }

    this.messages = [];

    socket.socket.emit('newRoom')

    socket.socket.on('update', function(msg) {
        console.log(msg);
        ctrl.restaurants.push(msg);
    })

  });

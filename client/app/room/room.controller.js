'use strict';

angular.module('roomApp')
  .controller('RoomCtrl', function ($scope, $stateParams, socket, $http) {
    $scope.message = 'Hello';
    var self = this;

    this.params = $stateParams;
    var roomNumber = $stateParams.data;

    $scope.roomData = [];
    socket.syncUpdates('room', $scope.roomData, roomNumber);

    this.submitInput = function() {
      $http.put("/api/room/" + this.params.data, 
      	{choice : chatForm.textInput.value})
        .success(function(data){
            // console.log(data);
        })
        .error(function(data){
            console.log("error");
        });
    }

    this.vote = function(choice, index, event) {
      if (event) {
        $(event.target).parent().addClass('animated fadeOutUp');
        self.restaurants.splice(index,1);
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
                self.restaurants = restaurants;
            })

        
      
    }
  });

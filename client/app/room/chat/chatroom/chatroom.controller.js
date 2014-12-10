'use strict';

angular.module('roomApp')
  .controller('ChatroomCtrl', function ($scope, $stateParams, socket, $http, $interval,
                                    chatroomService, Auth, $state, roomSocketsService, $window,
                                    personCounterService, geoRoomArrVal, usernameVal) {


    var ctrl = this;

    this.params = $stateParams;
    var roomNumber = this.params.roomNumber;
    var geoRoomArr = geoRoomArrVal.geoRooms;
    this.roomType = this.params.type;

    //roomData, roomType, and roomColor are all assigned in
    //getRoomSuccessCallback
    this.roomData;
    this.roomColor;

    // display number of people in room
    this.numberPeople = personCounterService.numberPeople;
    this.namesOfPeople = personCounterService.namesOfPeople;
    personCounterService.listen(this, $scope);

    this.inputField = ''; //sets the input field to be empty initially

    //getRoom is called whenever a user enters a room. The method call
    //is just below the function definition. Its purpose is to make available
    //to the client any info that has already been posted in the room, the
    //amount of time left before the room expires, and the room color/type,
    //as well as to start the interval that runs the timer.
    this.getRoom = function(roomNumber) {
      var promise = chatroomService.get(roomNumber, ctrl.roomType)
      .then(getRoomSuccessCallback, getRoomErrorCallback)
    };

    this.getRoom(roomNumber);

    function getRoomSuccessCallback(room) {
        ctrl.roomData = room;
        ctrl.roomColor = room.color;
        ctrl.roomType = room.type
        ctrl.expiresAt = new Date(Date.parse(room.ourExpTime));
        ctrl.countDown = $interval(ctrl.runTimer, 1000);

        if (ctrl.roomColor === "red") {
           $("body").css("background-color", "#D46A6A" );
        }
        else if (ctrl.roomColor === "green") {
           $("body").css("background-color","#87FC81" );
        }
        else if (ctrl.roomColor === "blue") {
           $("body").css("background-color", "#8DADF9" );
        }
    }

    function getRoomErrorCallback(error) {
      
    }

    this.runTimer = function(expiresAt) {
      $scope.timeNow = new Date().getTime();
      var minutesLeftDecimal = String((ctrl.expiresAt.getTime() - $scope.timeNow) / 1000 / 60);
      $scope.minutesLeft = minutesLeftDecimal.substring(0, minutesLeftDecimal.indexOf("."));
      var rawSecondsLeft = String(minutesLeftDecimal.substring(minutesLeftDecimal.indexOf(".")) * 60);
      $scope.secondsLeft =  rawSecondsLeft.substring(0, rawSecondsLeft.indexOf("."));
      if (Number($scope.secondsLeft) < 10) $scope.secondsLeft = "0" + $scope.secondsLeft; 

      if(Number(minutesLeftDecimal) < 0.01) {
        $interval.cancel(ctrl.countDown);
        socket.socket.emit('timeUp', ctrl.roomData.roomNumber, geoRoomArr);
      }
    };
    
    //submitInput is called when the user submits the name of a restaurant
    //or a message. It calls chatroomService.submitInput with a number of
    //parameters that varies depending on whether the user is logged in
    this.submitInput = function() {
      var type = ctrl.roomType;
      var name = usernameVal.name;
      var picture = 'https://pbs.twimg.com/profile_images/413202074466131968/ZeuqFOYQ_normal.jpeg'; 
      // if (ctrl.user) {
      //   if (ctrl.user.facebook) {
      //     name = ctrl.user.facebook.first_name;
      //     picture = ctrl.user.facebook.picture;
      //   }
      // }
   
      if (ctrl.inputField.length < 100) {
        chatroomService.submitInput(ctrl.inputField, roomNumber, name, picture, type);
        //to empty the input field:
        ctrl.inputField = '';
      }
    }


    //facebook login stuff
    this.user = Auth.getCurrentUser();
    this.isLoggedIn = Auth.isLoggedIn();

    // set up socket event listeners
    roomSocketsService.listen(roomNumber, $scope, ctrl, this.user);


    this.backToMain = function() {
      $state.go("main");
    }

    //returnArray is used to display the correct number of dollar signs
    //for the list of restaurants from foursquare
    this.returnArray = function(num) {
          var arr = []; 
          for (var i = 0; i < num; i++) {
            arr.push(i);
          }
          return arr;
    };

    this.showUsers = false;

    this.toggleUsers = function() {
      ctrl.showUsers = !ctrl.showUsers;
    }




  });


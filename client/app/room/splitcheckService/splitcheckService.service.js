'use strict';

angular.module('roomApp')
  .factory('splitcheckService', function () {

    return {

      bill: {

        billSoFar: [],
        taxPercent: 8.875,
        tipPercent: 18,
        runningTotal: 0,
        subtotal: 0,
        remainder: 0,
        totalTip: 0,
        tipPerPerson: 0,
        totalTax: 0,
        grandTotal: 0,
      },

      updateSubtotal: function(newSubtotal) {
        this.bill.subtotal = newSubtotal;
        this.updateBillTotals();
      },

      submit: function (singleItem) {
        var user = singleItem.user,
            food = singleItem.food,
            price = singleItem.price,
            tax = singleItem.tax

        this.bill.billSoFar.push(singleItem)
        this.updateBillTotals();

        // this.updateMyTotals(singleItem);

      },

      updateBillTotals: function() {
        this.bill.runningTotal = this.calculateRunningTotal();
        this.bill.remainder = this.calculateRemainder();
        this.bill.totalTip = this.calculateTip();
        this.bill.totalTax = this.calculateTax();
        this.bill.grandTotal = this.calculateTotal();
        //update everyone with socket

      },

      calculateRunningTotal: function() {
        var runningTotal = 0;
          this.bill.billSoFar.forEach(function(item) {
            runningTotal += item.price;
            runningTotal += item.tax;
          })
      return runningTotal;
      },

      calculateRemainder: function() {
        return this.bill.subtotal - this.bill.runningTotal;
      },

      calculateTip: function() {
        return this.bill.subtotal * this.bill.tipPercent / 100;
      },

      calculateTax: function() {
        return this.bill.subtotal * this.bill.taxPercent / 100;
      },

      calculateTotal: function() {
        return Number(this.bill.subtotal) + this.bill.totalTip + this.bill.totalTax;
      },

      deleteItem: function(index) {
        this.bill.billSoFar.splice(index, 1)
        this.updateBillTotals();
      },

      updateMyTotals: function(item) {

      },

      updateFromSocket: function(bill) {
        console.log('updateFromSocket')
        this.bill.billSoFar = bill.billSoFar;
        this.bill.taxPercent = bill.taxPercent;
        this.bill.tipPercent = bill.tipPercent;
        this.bill.runningTotal = bill.runningTotal;
        this.bill.subtotal = bill.subtotal;
        this.bill.remainder = bill.remainder;
        this.bill.totalTip = bill.totalTip;
        this.bill.tipPerPerson = bill.tipPerPerson;
        this.bill.totalTax = bill.totalTax;
        this.bill.grandTotal = bill.grandTotal;
      }
    };
  })
  .factory('splitcheckSockets', function(socket, splitcheckService) {
    
      function sendBillUpdate(roomNumber, bill) {
        socket.socket.emit('updateBill', roomNumber, bill)
      }
    
      function listen(ctrl) {
        socket.socket.on('updateBill', function(bill) {
          splitcheckService.updateFromSocket(bill);
          ctrl.bill = ctrl.updateMyPage();
        })

        socket.socket.on('updateMyBill', function() {
          var roomNumber = ctrl.roomNumber;
          var bill = splitcheckService.bill;
          console.log('socket bill', bill)
          sendBillUpdate(roomNumber, bill)
        })
      }

    return {
      sendBillUpdate: sendBillUpdate,
      listen: listen
    }
  });

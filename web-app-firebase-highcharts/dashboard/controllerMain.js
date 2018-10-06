var app = angular.module("highchart-firebase");

app.controller("DashboardController", function($scope, $firebaseArray){
    $scope.assign = function() {
        $scope.deviceName = "arduino";
        $scope.assigned = $scope.deviceName;
    };
    //UI for calendar function
    $scope.today = function () {
        // These scopes are changed when date on calendar is changed
        // Need to have 4 different dates for 4 different calendars
        // Otherwise the dates will all be the same
        $scope.dth = new Date(); // Half hourly calendar
        $scope.dtd = new Date(); // Daily calendar
    };
    $scope.today();

    $scope.inlineOptions = {
        customClass: getDayClass,
        minDate: new Date(),
        showWeeks: true
    };

    $scope.open1 = function () {
        $scope.popup1.opened = true;
    };

    $scope.formats = ['dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy', 'shortDate', 'MMMM-yyyy', 'yyyy'];
    $scope.format = $scope.formats[0];
    $scope.formatD = $scope.formats[4];
    $scope.formatM = $scope.formats[5];
    $scope.altInputFormats = ['M!/d!/yyyy'];

    $scope.popup1 = {
        opened: false
    };

    // Normal date options = select D,M,Y
    // Only select month --> dateOptionsM
    // Only select year --> dateOptionsY
    $scope.dateOptionsM = {
        formatYear: 'MM',
        startingDay: 1,
        minDate: new Date(2018, 0, 1, 0, 0, 0, 0),
        minMode: 'month'
    };

    $scope.dateOptionsY = {
        formatYear: 'yyyy',
        startingDay: 1,
        // minDate: start from which date
        minDate: new Date(2010, 0, 1, 0, 0, 0, 0),
        minMode: 'year'
    };

    function getDayClass(data) {
        var date = data.date,
            mode = data.mode;
        if (mode === 'day') {
            var dayToCheck = new Date(date).setHours(0, 0, 0, 0);

            for (var i = 0; i < $scope.events.length; i++) {
                var currentDay = new Date($scope.events[i].date).setHours(0, 0, 0, 0);

                if (dayToCheck === currentDay) {
                    return $scope.events[i].status;
                }
            }
        }

        return '';
    }
    // End of UI for calendar function

    // Use a $watch to read value from user input + calendars
    $scope.$watch('[assigned, dth, dtd]', function(values) {
        // Use an array to store the $scope(s) being passed in
        // Reading date values from the calendar
        // Convert them to a format similar to the one stored in localtime1/2/3 in Firebase
        // 8*3600000 is the timezone difference
        var dthValue = values[1];
        var dthConverted = moment(Date.parse(dthValue)).format('YYYY-MM-DD');
        var dtdValue = values[2];
        var dtdConverted = moment(Date.parse(dtdValue)).format('YYYY-MM');

        // Reading name assigned --> this is if you want to make the system more robust
        var value = values[0];
        var newRef = firebase.database().ref('Name_of_Dataset').child(value);

        // Price of energy/kwh in dollars
        $scope.random = 0.11;

        // Referencing to the database
        var Ref1 = newRef.child('1');     // For Data 1
        var Ref2 = newRef.child('2');    // For Data 2
        var Ref3 = newRef.child('3');     // For Data 3

        // Just to get 1 data set at a time
        // This is to display under tab 1 for live data
        // Order by child timestamp
        $scope.singleData = $firebaseArray(Ref1.orderByChild(timestamp).limitToLast(1));
        $scope.singleData.$loaded();

        // Get the data under the Half Hourly tag
        // After data from Firebase loads, it passes into a function to read the data
        $scope.dataSet1 = $firebaseArray(Ref2.orderByChild(timestamp).startAt(dthConverted));
        $scope.dataSet1.$loaded().then(function(){
            $scope.chartSeries01 = [];
            $scope.chartSeries011 = [];
            // This is to reset the summation of graph 1 for the day
            $scope.daysumGraph1 = 0;

            // This is to reset the summation of graph 2 for the day
            $scope.daysumGraph2 = 0;

            // This is to reset the random data
            $scope.randomSum1 = 0;

            // This is to record each data set that are already there in the database
            angular.forEach($scope.dataSet1, function(value){
                //console.log(dthConverted, value.localtime3);
                if (dthConverted === value.localtime) {
                    //console.log(moment(Date.parse(value.timestamp))._i, parseFloat(Math.round(value.totalEChanged * 100) / 100));
                    // This is to push the data set into the chartSeries
                    // Note: do not separate into x and y axis
                    // Syntax: chartSeries.push([x,y])
                    $scope.chartSeries01.push([
                        moment(Date.parse(value.epochTimestamp))._i,
                        parseInt(value.yAxisValue1)
                    ]);
                    $scope.chartSeries011.push([
                        moment(Date.parse(value.epochTimestamp))._i,
                        parseInt(value.yAxisValue2)
                    ]);
                    // This is used as the summation for live total for day
                    // This means that data is only updated once every half an hour
                    $scope.daysumGraph1 = $scope.daysumGraph1 + parseInt(value.yAxisValue1);
                    $scope.daysumGraph2 = $scope.daysumGraph2 + parseInt(value.yAxisValue2);
                    $scope.randomSum1 = Math.round($scope.daysumGraph2 * $scope.random * 100) / 100;
                }
            });

            Highcharts.setOptions ({
                global: {
                    // Use Singapore time
                    useUTC: false
                }
            });

            var chartH = Highcharts.chart('chartH', {
                chart: {
                    type: 'column'
                },
                title: {
                    text: 'Graph 1'
                },
                xAxis: {
                    type: 'datetime',
                    labels: {
                        format: '{value:%H:%M}'
                        //format: '{value:%Y-%b-%e %H:%M}'
                    },
                    crosshair: true,
                    tickInterval: 3600/2 * 1000 // How far apart the x-axis values are
                },
                yAxis: [
                    {
                        min: 0,
                        title: {
                            text: 'Y Axis'
                        }
                    }
                ],
                series: [
                    {
                        name: 'Data01',
                        data: $scope.chartSeries01
                    }
                    // can only used stacked for 2 data sets if all data sets are coming in at the same time
                    // cannot use column for 2 data sets if the data sets are coming in at the same time
                ],
                plotOptions: {
                    series: {
                        // Width of bar graph
                        pointWidth: 5,
                        color: '#0020C2'
                    }
                }
            });

            var chartHH = Highcharts.chart('chartHH', {
                chart: {
                    type: 'column'
                },
                title: {
                    text: 'Graph 2'
                },
                xAxis: {
                    type: 'datetime',
                    labels: {
                        format: '{value:%H:%M}'
                        //format: '{value:%Y-%b-%e %H:%M}'
                    },
                    crosshair: true,
                    tickInterval: 3600/2 * 1000 // How far apart the x-axis values are
                },
                yAxis: [
                    {
                        min: 0,
                        title: {
                            text: 'Y Axis'
                        }
                    }
                ],
                series: [
                    {
                        name: 'Data02',
                        data: $scope.chartSeries011,
                        color: '#3090C7'
                    }

                ],
                plotOptions: {
                    column: {
                        // Width of bar graph
                        pointWidth: 5
                    }
                }
            });

            // This function is used to watch the live data coming in
            $scope.dataSet1.$watch(function (cb) {
                if (cb.event === 'child_added') {
                    angular.forEach($scope.dataSet1, function(value) {
                        if (value.$id === cb.key) {
                            chartH.series[0].addPoint([
                                moment(Date.parse(value.epochTimestamp))._i,
                                parseInt(value.yAxisValue1)
                            ], true, false);
                            chartHH.series[0].addPoint([
                                moment(Date.parse(value.epochTimestamp))._i,
                                parseInt(value.yAxisValue2)
                            ], true, false);
                            $scope.daysumGraph1 = $scope.daysumGraph1 + parseInt(value.yAxisValue1);
                            $scope.daysumGraph2 = $scope.daysumGraph2 + parseInt(value.yAxisValue2);
                            $scope.randomSum1 = Math.round($scope.daysumGraph2 * $scope.random * 100) / 100;
                        }
                    });
                }
            });

        });

        $scope.dataSet2 = $firebaseArray(Ref3.orderByChild(timestamp).startAt(dtdConverted));
        $scope.dataSet2.$loaded().then(function(){
            $scope.chartSeries02 = [];
            $scope.chartSeries022 = [];
            $scope.monthsumGraph1 = 0;
            $scope.monthsumGraph2 = 0;
            $scope.randomSum2 = 0;
            angular.forEach($scope.dataSet2, function(value){
                if (dtdConverted === value.localtime) {
                    $scope.chartSeries02.push([
                        moment(Date.parse(value.epochTimestamp))._i,
                        parseInt(value.yAxisValue1)
                    ]);
                    $scope.chartSeries022.push([
                        moment(Date.parse(value.epochTimestamp))._i,
                        parseInt(value.yAxisValue2)
                    ]);
                    $scope.monthsumGraph1 = $scope.monthsumGraph1 + parseInt(value.yAxisValue1);
                    $scope.monthsumGraph2 = $scope.monthsumGraph2 + parseInt(value.yAxisValue2);
                    $scope.randomSum2 = Math.round($scope.monthsumGraph2 * $scope.random * 100) / 100;
                }
            });

            Highcharts.setOptions ({
                global: {
                    useUTC: false
                }
            });

            var chartD = Highcharts.chart('chartD', {
                chart: {
                    type: 'column'
                },
                title: {
                    text: 'Daily Energy Consumption'
                },
                xAxis: {
                    crosshair: true,
                    type: 'datetime',
                    labels: {
                        format: '{value:%b-%e}'
                        //format: '{value:%Y-%b-%e %H:%M}'
                    },
                    tickInterval: 3600 * 1000 * 24
                },
                yAxis: {
                    min: 0,
                    title: {
                        text: 'Energy (kwh)'
                    }
                },
                series: [{
                    name: 'Meter01',
                    data: $scope.chartSeries02
                }],
                plotOptions: {
                    series: {
                        pointWidth: 5
                    }
                }
            });

            var chartDD = Highcharts.chart('chartDD', {
                chart: {
                    type: 'column'
                },
                title: {
                    text: 'Daily Energy Sold To Grid'
                },
                xAxis: {
                    crosshair: true,
                    type: 'datetime',
                    labels: {
                        format: '{value:%b-%e}'
                        //format: '{value:%Y-%b-%e %H:%M}'
                    },
                    tickInterval: 3600 * 1000 * 24
                },
                yAxis: {
                    min: 0,
                    title: {
                        text: 'Energy (kwh)'
                    }
                },
                series: [{
                    name: 'Inverter01',
                    data: $scope.chartSeries022,
                    color: '#3090C7'
                }],
                plotOptions: {
                    series: {
                        pointWidth: 5
                    }
                }
            });

            $scope.dataSet2.$watch(function (cb) {
                if (cb.event === 'child_added') {
                    angular.forEach($scope.dataSet2, function(value) {
                        if (value.$id === cb.key) {
                            chartD.series[0].addPoint([
                                moment(Date.parse(value.epochTimestamp))._i,
                                parseInt(value.yAxisValue1)
                            ], true, false);
                            chartDD.series[0].addPoint([
                                moment(Date.parse(value.epochTimestamp))._i,
                                parseInt(value.yAxisValue2)
                            ], true, false);
                            $scope.monthsumGraph1 = $scope.monthsumGraph1 + parseInt(value.yAxisValue1);
                            $scope.monthsumGraph2 = $scope.monthsumGraph2 + parseInt(value.yAxisValue2);
                            $scope.randomSum2 = Math.round($scope.monthsumGraph2 * $scope.random * 100) / 100;
                        }
                    });
                }
            });

        });
    });
});


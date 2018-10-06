var app = angular.module('highchart-firebase');

app.config(['$stateProvider', '$urlRouterProvider',
    function($stateProvider, $urlRouterProvider) {
        $stateProvider
            .state('dashboard', {
                /*resolve: {
                    "check": function($state, $rootScope) {
                        if(!$rootScope.loggedIn) {
                            $state.transitionTo('login');
                        }
                    }
                },*/
                url : '/dashboard',
                templateUrl : 'dashboard/dashboard.html',
                controller : 'DashboardController'
            });


        //$urlRouterProvider.otherwise('/login');
    }]);
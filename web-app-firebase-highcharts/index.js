var app = angular.module('highchart-firebase', ['firebase', 'ngAnimate', 'ngSanitize', 'ui.bootstrap', 'ui.router', 'ui.select']);

app.run(function($rootScope, $location, $state) {
    console.clear();
    console.log('running');
    $state.transitionTo('dashboard');
    /*if(!$rootScope.loggedIn) {
        $state.transitionTo('login');
    }*/
});




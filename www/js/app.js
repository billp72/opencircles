// MyChat App - Ionic & Firebase Demo

var firebaseUrl = "https://incandescent-torch-5679.firebaseio.com";

function onDeviceReady() {
    angular.bootstrap(document, ["mychat"]);
}
//console.log("binding device ready");
// Registering onDeviceReady callback with deviceready event
document.addEventListener("deviceready", onDeviceReady, false);

/*function init(){
    window.isphone = false;
    if(document.URL.indexOf("http://") === -1 
        && document.URL.indexOf("https://") === -1) {
        window.isphone = true;
    }
    if(window.isphone){
        document.addEventListener("deviceready", onDeviceReady, false);
    }else{
        onDeviceReady();
    }
}*/

// 'mychat.services' is found in services.js
// 'mychat.controllers' is found in controllers.js
angular.module('mychat', ['ionic', 'firebase', 'angularMoment', 'mychat.controllers', 'mychat.services', 'mychat.directives'])

.run(function ($ionicPlatform, $rootScope, $location, $state, Auth, $ionicLoading, $ionicModal, $window, pushService, $interval) {

    $ionicPlatform.ready(function () {
         //localstorage check
       var stop;
       $rootScope.startTimer = function(){
            stop = $interval(function(){
                $window.localStorage.setItem('test', 'test');
                    if($window.localStorage.getItem('test') !== null){
                        $window.localStorage.removeItem('test');
                    }else{
                        Auth.$unauth();
                        alert('You must activate local storage on your device to use this app');
                        $rootScope.stopTimer();
                    }
                //console.log('interval hit');
            },300000);
        }

        $rootScope.stopTimer = function() {
          if (angular.isDefined(stop)) {
                $interval.cancel(stop);
                stop = undefined;
          }
        };

        $rootScope.$on('$destroy', function() {
          // Make sure that the interval is destroyed too
          $rootScope.stopTimer();
        });

        $rootScope.advisor   =  !!JSON.parse($window.localStorage.getItem('advisor')) ?
                JSON.parse($window.localStorage.getItem('advisor')) : false;
        $rootScope.prospect  =  !!JSON.parse($window.localStorage.getItem('prospect')) ?
                JSON.parse($window.localStorage.getItem('prospect')) : false;
        // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
         /*Google keys
          * key: AIzaSyAbXzuAUk1EICCdfpZhoA6-TleQrPWxJuI
          * Project Number: open-circles-1064/346007849782
          */
        // for form inputs)
        if (window.cordova && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        }
        if (window.StatusBar) {
            // org.apache.cordova.statusbar required
            StatusBar.styleDefault();
        }
        // To Resolve Bug
        ionic.Platform.fullScreen();

        $rootScope.firebaseUrl = firebaseUrl;
        $rootScope.displayName = null;

        Auth.$onAuth(function (authData) {
            if (authData) {
               
            } else {
                console.log("Logged out");
                $ionicLoading.hide();
                $location.path('/login');
            }
        });

        
        $rootScope.$on("$stateChangeError", function (event, toState, toParams, fromState, fromParams, error) {
            // We can catch the error thrown when the $requireAuth promise is rejected
            // and redirect the user back to the home page
            if (error === "AUTH_REQUIRED") {
                $location.path("/login");
            }
        });
    });
})

.config(['$stateProvider', '$urlRouterProvider', '$ionicConfigProvider', 
    function ($stateProvider, $urlRouterProvider, $ionicConfigProvider) {
    console.log("setting config");
    $ionicConfigProvider.tabs.position('top');
    // Ionic uses AngularUI Router which uses the concept of states
    // Learn more here: https://github.com/angular-ui/ui-router
    // Set up the various states which the app can be in.
    // Each state's controller can be found in controllers.js
    $stateProvider

    // State to represent Login View
    .state('login', {
        url: "/login",
        templateUrl: "templates/login.html",
        controller: 'LoginCtrl',
        resolve: {
            // controller will not be loaded until $waitForAuth resolves
            // Auth refers to our $firebaseAuth wrapper in the example above
            "currentAuth": ["Auth",
                function (Auth) {
                    // $waitForAuth returns a promise so the resolve waits for it to complete
                    return Auth.$waitForAuth();
        }]
        }
    })
    .state('menu', {
        url: "/menu",
        abstract: true,
        templateUrl: "templates/menu.html",
        resolve: {
            // controller will not be loaded until $requireAuth resolves
            // Auth refers to our $firebaseAuth wrapper in the example above
            "currentAuth": ["Auth",
                function (Auth) {
                    // $requireAuth returns a promise so the resolve waits for it to complete
                    // If the promise is rejected, it will throw a $stateChangeError (see above)
                    return Auth.$requireAuth();
      }]
        }
    })
    // setup an abstract state for the tabs directive
    .state('menu.tab', {
        url: "/tab",
        abstract: true,
        views: {
            'tabs': {
                templateUrl: "templates/tabs.html",
                controller: 'TabCtrl'
            }
        }
    })
    // Each tab has its own nav history stack:
    //menu.tab.newest and student show current questions for both HS and college
    .state('menu.tab.newest', {
        url: '/rooms',
        views: {
            'tab-rooms': {
                templateUrl: 'templates/tab-rooms.html',
                controller: 'ProspectCtrl'
            }
        }
    })
    .state('menu.tab.ask', {
        url: '/ask',
        views: {
            'tab-ask': {
                templateUrl: 'templates/askQuestion.html',
                controller: 'AskCtrl'
            }
        }
    })
    .state('menu.tab.student', {
        url: '/studentrooms',
        views: {
            'tab-student': {
                templateUrl: 'templates/tab-rooms-student.html',
                controller: 'AdvisorCtrl'
            }
        }
    })
     .state('menu.tab.studentc', {
        url: '/conversations',
        views: {
            'tab-converse': {
                templateUrl: 'templates/tab-student-convers.html',
                controller: 'AdvisorConversationsCtrl'
            }
        }
    })
    .state('menu.tab.settings', {
        url: '/settings',
        views: {
            'tab-settings': {
                templateUrl: 'templates/tab-settings.html',
                controller: 'SettingsCtrl'
            }
        }
    })
     .state('menu.tab.chat', {
        url: '/chat/:advisorID/:schoolID/:advisorKey/:prospectUserID/:prospectQuestionID/:schoolsQuestionID/:question/:displayName/:email',
        views: {
            'tab-chat':{
                templateUrl: 'templates/tab-chat.html',
                controller: 'ChatCtrl'  
            }   
        }
    });

    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/login');

}]);
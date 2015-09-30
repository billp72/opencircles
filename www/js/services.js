angular.module('mychat.services', ['firebase'])

.factory("Auth", ["$firebaseAuth", "$rootScope",
        function ($firebaseAuth, $rootScope) {
            var ref = new Firebase(firebaseUrl);
            return $firebaseAuth(ref);
}])

.factory('Chats', ['$rootScope', '$firebase', '$state', 'Rooms', 'Users', '$http',
    function ($rootScope, $firebase, $state, Rooms, Users, $http) {

    var selectedRoomID;
    var ref = new Firebase(firebaseUrl+'/users');
    var chats;
    var processProspectEmailRequest = function (data){
        $http({
            method: 'POST',
            url: 'http://www.theopencircles.com/opencircles/emailToApplicant.php', 
            data: data
        })
        .success(function(data, status, headers, config)
        {
            console.log(status + ' - ' + data);
        })
        .error(function(data, status, headers, config)
        {
            console.log('error');
        });
    }
    return {
        all: function (from) {
            return chats;
        },
        remove: function (chat) {
            chats.$remove(chat).then(function (ref) {
                ref.key() === chat.$id; // true item has been removed
            });
        },
        wrapitup: function(advisorKey, advisorID, schoolID, schoolsQuestionID, prospectQuestionID, prospectUserID, question, email, userID){
            var returnval;
            if(email){
                processProspectEmailRequest({'question': question, 'advisorID': advisorID, 'email': email, 'userID': userID});
            }
            if(!schoolsQuestionID){
                var question = ref.child(advisorID).child('questions').child(advisorKey);
                    question.remove(
                        function (err){
                            if(err){
                                returnval = 'there was an error deleting' + err;
                            }else{
                                questionProspect = ref.child(prospectUserID).child('questions').child(prospectQuestionID);
                                questionProspect.remove(
                                    function (err){
                                        if(err){
                                            returnval = 'there was an error deleting' + err;
                                        }else{
                                            returnval = true;
                                        }

                                    }
                                    );
                                        
                            }
                        }
                    );
            }else{
                 var question = Rooms.getRef().child(schoolID).child('questions').child(schoolsQuestionID);
                    question.remove(
                        function (err){
                            if(err){
                                returnval = 'there was an error deleting' + err;
                            }else{
                                questionProspect = ref.child(prospectUserID).child('questions').child(prospectQuestionID);
                                questionProspect.remove(
                                    function (err){
                                        if(err){
                                            returnval = 'there was an error deleting' + err;
                                        }else{
                                            returnval = true;
                                        }

                                    }
                                    );
                                        
                            }
                        }
                    );
            }
            return returnval;
        },
        get: function (chatID) {
            for (var i = 0; i < chats.length; i++) {
                if (chats[i].ID === parseInt(chatID)) {
                    return chats[i];
                }
            }
            return null;
        },
        getSelectedRoomName: function (cb) {
            var selectedRoom;
            if (selectedRoomID && selectedRoomID != null) {
                  return Rooms.get(selectedRoomID, function(room){
                    if (room)
                        selectedRoom = room.schoolname;
                    else
                        selectedRoom = null;

                    cb(selectedRoom);
                });
            } else{
                return null;
            }

        },
        selectRoom: function (schoolID, advisorID, advisorKey) {
            selectedRoomID = schoolID;
            if(!!advisorKey){
                chats = $firebase(ref.child(advisorID).child('questions').child(advisorKey).child('conversations')).$asArray();
            }else{
                chats = null;
            }
        },
        send: function (from, schoolID, message, toggleUserID, toggleQuestionID) {
            //console.log("sending message from :" + from.displayName + " & message is " + message);
            
            if (from && message) {
                var chatMessage = {
                    from: from,
                    message: message,
                    schoolID: schoolID,
                    createdAt: Firebase.ServerValue.TIMESTAMP
                };
                 chats.$add(chatMessage).then(function (data) {
                    ref.child(toggleUserID).child('questions').child(toggleQuestionID)
                        .update({'conversationStarted':true});
            
                });
              
            }
        }
    }
}])

/**
 * Simple Service which returns Rooms collection as Array from Salesforce & binds to the Scope in Controller
 */
.factory('Rooms', ['$firebase', function ($firebase) {
    // Might use a resource here that returns a JSON array
    var ref = new Firebase(firebaseUrl+'/schools');
    var rooms = $firebase(ref).$asArray();
    //$firebase(ref.child('schools').child(selectedRoomID).child('chats')).$asArray();
    return {
        all: function () {
            return rooms;
        },
        getRef: function (){
            return ref;
        },
        get: function (roomID, fn) {
            var rm;
            rooms.$loaded(function(room){//get record doesn't return a promise
                rm = room.$getRecord(roomID);
                fn(rm);
            });
        },
        getSchoolBySchoolID: function(schoolID){
            
            return $firebase(ref.child(schoolID).child('questions')).$asArray();
        },
        addQuestionsToSchool: function(schoolID, userID, question, icon, questionID, displayName, email){
            var qdata = {
                schoolID: schoolID,
                userID: userID,
                question: question,
                icon: icon,
                questionID: questionID,
                displayName: displayName,
                email: email,
                createdAt: Firebase.ServerValue.TIMESTAMP
            }
        
            return $firebase(ref.child(schoolID).child('questions')).$asArray().$add(qdata);
           
        },
         retrieveSingleQuestion: function (schoolID, questionID) {
            return $firebase(ref.child(schoolID).child('questions').child(questionID)).$asObject();
        }
    }
}])
/**
 * simple service to get all the users for a room or in the db
*/
.factory('Users', ['$firebase', '$window', 'Rooms', function ($firebase, $window, Rooms) {
    // Might use a resource here that returns a JSON array
    var ref = new Firebase(firebaseUrl+'/users');
    var users = $firebase(ref).$asArray();
    
    return {
        all: function () {
            return users;
        },
        getUserByID: function(studentID){
             return $firebase(ref.child(studentID).child('questions')).$asArray();
        },
        addQuestionToUser: function(schoolID, ID, question, icon, questionID, prospectUserID, displayName, email){
            var user = this.getUserByID(ID);
            if(!!questionID){
                return user.$add(
                    {
                        schoolID: schoolID, 
                        question: question, 
                        prospectQuestionID: questionID, 
                        prospectUserID: prospectUserID,
                        displayName: displayName,
                        email: email, 
                        icon: icon
                    });
            }else{
                return user.$add(
                    {
                        schoolID: schoolID, 
                        question: question, 
                        icon: icon
                    });
            }
        },
        getUserConversation: function (userID, questionID){
            return $firebase(ref.child(userID).child('questions').child(questionID).child('conversations')).$asArray();
        },
        getIDS: function (key){
            return JSON.parse($window.localStorage.getItem(key));
        },
        getRef: function (){
            return ref;
        },
        storeIDS: function (ID, key){
            $window.localStorage.setItem(key, JSON.stringify(ID));
        },
        removeItem: function (key){
            $window.localStorage.removeItem(key);
        },
        addAnswerToAdvisor: function (from, schoolID, message, questionsID, userID){
            var user = this.getUserConversation(userID, questionsID);
            var chatMessage = {
                    from: from,
                    message: message,
                    schoolID: schoolID,
                    createdAt: Firebase.ServerValue.TIMESTAMP
                };
            return user.$add(chatMessage);
       },
       updateProspectQuestion: function (studentID, questionID, advisorID, advisorKey, originalID, schoolID){
            var update = ref.child(studentID).child('questions').child(questionID);
                update.update({advisorID: advisorID, advisorKey: advisorKey, conversationStarted: true});
                Rooms.getRef().child(schoolID).child('questions').child(originalID).remove(
                    function(err){
                        if(err){
                            alert('an error occured ' + err);
                        }
                    }
                )
        
       },
       toggleQuestionBackAfterClick: function (toggleUserID, toggleQuestionID){
             ref.child(toggleUserID).child('questions').child(toggleQuestionID)
                        .update({'conversationStarted':false});
       }
    }
}])

.factory('stripDot', [function(){

    return {
        strip: function(ID){
            return ID.replace(/\./g,'');
        }
    }
}])
/*change password*/
.factory('ChangePassword', [function(){
    var ref = new Firebase(firebaseUrl);
    return {

        change: function (user){
                ref.changePassword({
                    email: user.schoolemail,
                    oldPassword: user.oldPassword,
                    newPassword: user.newPassword
                }, function(error) {
                    if (error) {
                        switch (error.code) {
                            case "INVALID_PASSWORD":
                                alert("The specified user account password is incorrect.");
                                break;
                            case "INVALID_USER":
                                alert("The specified user account does not exist.");
                                break;
                            default:
                                alert("Error changing password:", error);
                        }
                    } else {
                        alert("User password changed successfully!");
                    }
                });
            }
        }
}])
/*
* autocomplete search
*/
.factory('SchoolDataService', ['$q', '$timeout', 'schoolData', function ($q, $timeout, schoolData) {
        var datas = schoolData.all();
        var schools='';
        datas.$loaded(function(data){
            schools = data.sort(function(a, b) {

                var schoolA = a.schoolname.toLowerCase();
                var schoolB = b.schoolname.toLowerCase();

                if(schoolA > schoolB) return 1;
                if(schoolA < schoolB) return -1;

                return 0;
            });
        });
            var searchSchool = function(searchFilter) {    
            //console.log('Searching school for ' + searchFilter);
            var deferred = $q.defer();

            var matches = schools.filter( function(school) {
                if(school.schoolname.toLowerCase().indexOf(searchFilter.toLowerCase()) !== -1 ) return true;
            })

            $timeout( function(){
        
                deferred.resolve( matches );

            }, 100);

            return deferred.promise;

        };

    return {

        searchSchools : searchSchool

    }
}])
/*
*get school data
*/
.factory('schoolData', ['$firebase', function ($firebase){

    var ref = new Firebase(firebaseUrl+'/schools');
    var schools = $firebase(ref).$asArray();

    return{
        all: function(){
            return schools
        }
    }
     
}])
/*
* this is to populate the form with schools when the user is creating an account
*/
.factory('schoolFormDataService', ['$q', '$timeout', 'schoolFormData', 
    function ($q, $timeout, schoolFormData){

    var datas = schoolFormData.all();
        var schools='';
    
        datas.then(function(data){
    
           schools = data.data.sort(function(a, b) {
                
                var schoolA = a.name.toLowerCase();
                var schoolB = b.name.toLowerCase();

                if(schoolA > schoolB) return 1;
                if(schoolA < schoolB) return -1;

                return 0;
            });
        
       });
       var schoolList = function(searchFilter) {
         
            //console.log('Searching school for ' + searchFilter);

            var deferred = $q.defer();

            var matches = schools.filter( function(school) {
                if(school.name.toLowerCase().indexOf(searchFilter.toLowerCase()) !== -1 ) return true;
            })

            $timeout( function(){
        
                deferred.resolve( matches );

            }, 100);

            return deferred.promise;

        };

    return {

        schoolList : schoolList

    }
}])

.factory('schoolFormData', ['$http', function ($http){
    var data = $http.get('http://www.theopencircles.com/opencircles/schools.php');

    return {
        all: function(){
            return data;
        }
    }
}])
/*push factory
* key: AIzaSyDpA0b2smrKyDUSaP0Cmz9hz4cQ19Rxn7U
* Project Number: 346007849782
*/
.factory('pushService',  ['$rootScope', '$q', '$window', 'RequestsService', 'Users',
        function ($rootScope, $q, $window, RequestsService, Users) {
  var 
    pushNotification = window.plugins.pushNotification,
    successHandler = function (result) {},
    errorHandler = function (err){if(err) throw err;},
    tokenHandler = function (device_token) {
        RequestsService.pushNote(
            {'device_token': device_token,
             'userID': $rootScope.userID,
             'device_type':'ios',
             'method':'POST',
             'path':'register'
            });
  };
  if(!$rootScope.userID){
        $rootScope.userID = Users.getIDS('userID');
    }
  // handle GCM notifications for Android
  $window.onNotificationGCM = function (event) {
    switch (event.event) {
      case 'registered':
        if (event.regid.length > 0) {
          // Your GCM push server needs to know the regID before it can push to this device
          // here is where you might want to send it the regID for later use.
          var device_token = event.regid;
          
          RequestsService.pushNote(
            {'device_token': device_token,
             'userID': $rootScope.userID,
             'device_type':'android',
             'method':'POST',
             'path':'register'
            });
          //send device reg id to server

        }
        break;

      case 'message':
          // if this flag is set, this notification happened while we were in the foreground.
          // you might want to play a sound to get the user's attention, throw up a dialog, etc.
          if (event.foreground) {
                console.log('INLINE NOTIFICATION');
                //var my_media = new Media("/android_asset/www/" + event.soundname);
                //my_media.play();
          } else {
            if (event.coldstart) {
                console.log('COLDSTART NOTIFICATION');
            } else {
                console.log('BACKGROUND NOTIFICATION');
            }
          }

          //navigator.notification.alert(event.payload.message);
          navigator.notification.vibrate(1000);

          console.log('MESSAGE -> MSG: ' + event.payload.message);
          //Only works for GCM
          console.log('MESSAGE -> MSGCNT: ' + event.payload.msgcnt);
          //Only works on Amazon Fire OS
          console.log('MESSAGE -> TIME: ' + event.payload.timeStamp);
          break;

      case 'error':
          console.log('ERROR -> MSG:' + event.msg);
          break;

      default:
          console.log('EVENT -> Unknown, an event was received and we do not know what it is');
          break;
    }
  };
  // handle APNS notifications for iOS
  $window.successIosHandler = function (result) {
    console.log('result = ' + result);
    navigator.notification.alert(result);
  };
  
  $window.onNotificationAPN = function (e) {
    if (e.alert) {
      console.log('push-notification: ' + e.alert);
      //navigator.notification.alert(e.alert);
    }

    if (e.sound) {
      var snd = new Media(e.sound);
      snd.play();
    }

    if (e.badge) {
      pushNotification.setApplicationIconBadgeNumber(successIosHandler, errorHandler, e.badge);
    }
  };
  
  return {
    register: function () {
      var q = $q.defer();
      if(ionic.Platform.isAndroid()){
        pushNotification.register(
            successHandler,
            errorHandler,
             {
                "senderID":"346007849782",
                "ecb":"window.onNotificationGCM"
             }
        );
      }else{
        pushNotification.register(
            tokenHandler,
            errorHandler,
             {
                "badge":"true",
                "sound":"true",
                "alert":"true",
                "ecb":"window.onNotificationAPN"
            }
        );
      }
      return q.promise;
    }
  }
}])
.factory('Questions', ['$firebase', function($firebase){
    var ref = new Firebase(firebaseUrl+'/questions');
    var questions = $firebase(ref).$asArray();
    return {
        save: function (question){
            questions.$add(
                {
                    'organization': question.organization,
                    'question': question.question,
                    'school': question.school
                }
            );
        }
    }
}])
.service('RequestsService', ['$http', '$q', '$ionicLoading',  RequestsService]);

    function RequestsService($http, $q, $ionicLoading){

        var base_url = 'http://aqueous-crag-7054.herokuapp.com';

        function pushNote(device_info){

           if(device_info.method === 'POST'){
                $http({
                    method: device_info.method,
                    url: base_url+'/'+device_info.path, 
                    data: device_info
                })
                .success(function(data, status, headers, config)
                {
                    console.log(status + ' - ' + data);
                })
                .error(function(data, status, headers, config)
                {
                    console.log(status);
                });

            }else{
                 $http({
                    method: device_info.method,
                    url: base_url+'/'+device_info.path, 
                    params: {'message': device_info.message, 'userID': device_info.userID}
                })
                .success(function(data, status, headers, config)
                {
                    console.log(status + ' - ' + data);
                })
                .error(function(data, status, headers, config)
                {
                    console.log(status);
                });
            }
        };


        return {
            pushNote: pushNote
        };
    }

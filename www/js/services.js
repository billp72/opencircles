angular.module('mychat.services', ['firebase'])

.factory("Auth", ["$firebaseAuth", "$rootScope",
        function ($firebaseAuth, $rootScope) {
            var ref = new Firebase(firebaseUrl);
            return $firebaseAuth(ref);
}])

.factory('Chats', function ($rootScope, $firebase, $state, Rooms, Users) {

    var selectedRoomID;
    var ref = new Firebase(firebaseUrl+'/users');
    var chats;

    return {
        all: function (from) {
            return chats;
        },
        remove: function (chat) {
            chats.$remove(chat).then(function (ref) {
                ref.key() === chat.$id; // true item has been removed
            });
        },
        wrapitup: function(advisorKey, advisorID, schoolID, schoolsQuestionID, prospectQuestionID, prospectUserID){
            var returnval;
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
        getSelectedRoomName: function () {
            var selectedRoom;
            if (selectedRoomID && selectedRoomID != null) {
                selectedRoom = Rooms.get(selectedRoomID);
                if (selectedRoom)
                    return selectedRoom.schoolname;
                else
                    return null;
            } else
                return null;
        },
        selectRoom: function (schoolID, advisorID, advisorKey) {
            selectedRoomID = schoolID;
            console.log('advisorKey: ', advisorKey);
            if(!!advisorKey){
                chats = $firebase(ref.child(advisorID).child('questions').child(advisorKey).child('conversations')).$asArray();
            }else{
                chats = null;
            }
        },
        send: function (from, schoolID, message, toggleUserID, toggleQuestionID) {
            //console.log("sending message from :" + from.displayName + " & message is " + message);
            
            if (from && message) {
                $rootScope.$emit('message.sent', from);
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
})

/**
 * Simple Service which returns Rooms collection as Array from Salesforce & binds to the Scope in Controller
 */
.factory('Rooms', function ($firebase) {
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
        get: function (roomID) {
            // Simple index lookup
            return rooms.$getRecord(roomID);
        },
        getSchoolBySchoolID: function(schoolID){
            
            return $firebase(ref.child(schoolID).child('questions')).$asArray();
        },
        addQuestionsToSchool: function(schoolID, userID, question, icon, questionID){
            var qdata = {
                schoolID: schoolID,
                userID: userID,
                question: question,
                icon: icon,
                questionID: questionID
            }
        
            return $firebase(ref.child(schoolID).child('questions')).$asArray().$add(qdata);
           
        },
         retrieveSingleQuestion: function (schoolID, questionID) {
            return $firebase(ref.child(schoolID).child('questions').child(questionID)).$asObject();
        }
    }
})
/**
 * simple service to get all the users for a room or in the db
*/
.factory('Users', function ($firebase, $window, Rooms) {
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
        addQuestionToUser: function(schoolID, ID, question, icon, questionID, prospectUserID){
            var user = this.getUserByID(ID);
            if(!!questionID){
                return user.$add({schoolID: schoolID, question: question, prospectQuestionID: questionID, prospectUserID: prospectUserID, icon: icon});
            }else{
                return user.$add({schoolID: schoolID, question: question, icon: icon});
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
})

.factory('stripDot', function(){

    return {
        strip: function(ID){
            return ID.replace(/\./g,'');
        }
    }
})
/*change password*/
.factory('ChangePassword', function(){
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
})
/*
* autocomplete search
*/
.factory('SchoolDataService', function ($q, $timeout, schoolData) {
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
})
/*
*get school data
*/
.factory('schoolData', function($firebase){

    var ref = new Firebase(firebaseUrl+'/schools');
    var schools = $firebase(ref).$asArray();

    return{
        all: function(){
            return schools
        }
    }
     
})
/*
* this is to populate the form with schools when the user is creating an account
*/
.factory('schoolFormDataService', function($q, $timeout, schoolFormData){
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
})

.factory('schoolFormData', function($http){
    var data = $http.get('schools_partial.json');

    return {
        all: function(){
            return data;
        }
    }
})
/* check user agent for chrome or safari*/
/*.service('Browser', ['$window', function($window) {

     return function() {

         var userAgent = $window.navigator.userAgent;

        var browsers = {chrome: /chrome/i, safari: /safari/i, firefox: /firefox/i, ie: /internet explorer/i};

        for(var key in browsers) {
            if (browsers[key].test(userAgent)) {
                return key;
            }
       };

       return 'unknown';
    }

}]);*/
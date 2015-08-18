angular.module('mychat.services', ['firebase'])

.factory("Auth", ["$firebaseAuth", "$rootScope",
        function ($firebaseAuth, $rootScope) {
            var ref = new Firebase(firebaseUrl);
            return $firebaseAuth(ref);
}])

.factory('Chats', function ($rootScope, $firebase, $state, Rooms, Users) {

    var selectedRoomId;
    var conversationID = [];
    var ref = new Firebase(firebaseUrl);
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
        wrapitup: function(sid, qid, question){
            var returnval;
            var questions = $firebase(ref.child('schools').child(sid).child('questions').child(qid)).$asObject();
            questions.$loaded(function(qdata){

                var id = qdata.userid;
                var ref2 = Users.getRef();
                
                var fireRemove = ref.child('schools').child(sid).child('questions').child(qid);

                fireRemove.remove(function (err){
                    if(err){
                        returnval = 'there was an error deleting' + err;
                    }else{
                        ref2.child(id).child('questions').
                             orderByChild('questionId').
                                 equalTo(qid).on('child_added', function(snapshot){
                                        snapshot.ref().remove(function(err){
                                                if(err){
                                                    returnval = 'there was an error deleting' + err;
                                                }else{
                                                    returnval = true;
                                                }

                                        });
                                        
                                 });     
                       
                    }
                });
            });
            return returnval;
        },
        get: function (chatId) {
            for (var i = 0; i < chats.length; i++) {
                if (chats[i].id === parseInt(chatId)) {
                    return chats[i];
                }
            }
            return null;
        },
        getSelectedRoomName: function () {
            var selectedRoom;
            if (selectedRoomId && selectedRoomId != null) {
                selectedRoom = Rooms.get(selectedRoomId);
                if (selectedRoom)
                    return selectedRoom.schoolname;
                else
                    return null;
            } else
                return null;
        },
        selectRoom: function (roomId, questionsId) {
            console.log("selecting the room with id: " + roomId);
            selectedRoomId = roomId;
            if (isNaN(roomId)) {
                chats = $firebase(ref.child('schools').child(selectedRoomId).child('questions').child(questionsId).child('conversation')).$asArray();
    
            }
        },
        send: function (from, schoolid, message, questionsId, selectedRoomId, ursid, indicatorToggle) {
            //console.log("sending message from :" + from.displayName + " & message is " + message);
            
            if (from && message) {
                var chatMessage = {
                    from: from,
                    message: message,
                    schoolid: schoolid,
                    createdAt: Firebase.ServerValue.TIMESTAMP
                };
                 chats.$add(chatMessage).then(function (data) {
                        if(!!ursid){
                            //if(from !== $rootScope.displayName){
                                navigator.notification.vibrate(500);
                           // }
                           ref.child('users').child(ursid).child('questions').
                              orderByChild('questionId').
                                 equalTo(questionsId).on('child_added', function(snapshot){
                                    snapshot.ref().update({'conversationStarted':indicatorToggle});        
                                 });
                        }
                        
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
    //$firebase(ref.child('schools').child(selectedRoomId).child('chats')).$asArray();
    return {
        all: function () {
            return rooms;
        },
        get: function (roomId) {
            // Simple index lookup
            return rooms.$getRecord(roomId);
        },
        getSchoolBySid: function(sid){
            // return $firebase(ref.orderByChild('schoolId').equalTo(sid)).$asArray();
            return $firebase(ref.child(sid).child('questions')).$asArray();
        },
        addQuestionsToSchool: function(schoolid, userId, question, scope, icon){
            var qdata = {
                schoolid: schoolid,
                userid: userId,
                question: question,
                icon: icon
            }
            //console.log(sid, qdata);
            return $firebase(ref.child(schoolid).child('questions')).$asArray().$add(qdata);
           
        }
    }
})
/**
 * simple service to get all the users for a room or in the db
*/
.factory('Users', function ($firebase, $window) {
    var qid = [];
    // Might use a resource here that returns a JSON array
    var ref = new Firebase(firebaseUrl+'/users');
    var users = $firebase(ref).$asArray();
    
    return {
        all: function () {
            return users;
        },
        getUserById: function(sid){
           // console.log(sid);
             //return $firebase(ref.orderByChild('schoolId').equalTo(sid)).$asArray();
             return $firebase(ref.child(sid).child('questions')).$asArray();
        },
        addQuestionToUser: function(schoolid, id, question, icon, questionId){
            var user = this.getUserById(id);
            return user.$add({schoolid: schoolid, question: question, icon: icon, questionId: questionId});
        },
        storeQuestionIDS: function (id, key){
            qid.push(id);
             if(qid.length > 0){
                        $window.localStorage.setItem(key,
                            JSON.stringify(qid));
                }
        },
        getQuestionIDS: function (key){
            return JSON.parse($window.localStorage.getItem(key));
        },
        getRef: function (){
            return ref;
        }
    }
})

.factory('stripDot', function(){

    return {
        strip: function(id){
            return id.replace(/\./g,'');
        }
    }
})
/*
* autocomplete search
*/
.factory('SchoolDataService', function($q, $timeout, schoolData) {
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
         
            console.log('Searching school for ' + searchFilter);

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
});
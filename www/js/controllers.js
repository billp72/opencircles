angular.module('mychat.controllers', [])

.controller('LoginCtrl', function ($scope, $ionicModal, $state, $firebaseAuth, Rooms, Users, $ionicLoading, $rootScope, SchoolDataService, schoolFormDataService, stripDot) {
    //console.log('Login Controller Initialized');

    var ref = new Firebase($scope.firebaseUrl);
    var auth = $firebaseAuth(ref);

    $scope.user = {};
    $scope.data = { "list" : '', "search" : ''};
   

    $scope.search = function() {

        schoolFormDataService.schoolList($scope.data.search).then(
            function(matches) {
                $scope.user.sid = matches[0];
                $scope.data.list = matches;
            }
        )
    }

    $scope.update = function(school){
        $scope.schoolInfo = school
        //$scope.selected = edu.domain;
           /* $scope.test = {
                txt: edu.selected.domain
            }  */   

    }
     function generatePass() {
        var possibleChars = ['abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!?_-'];
        var password = '';
        for(var i = 0; i < 16; i += 1) {
            password += possibleChars[Math.floor(Math.random() * possibleChars.length)];
        }
        return password;
    }
     $scope.openModal = function(template){
        $ionicModal.fromTemplateUrl('templates/'+template+'.html', {
            scope: $scope
        }).then(function (modal) {
            $scope.modal1 = modal;
            $scope.modal1.show();
        });
    }
    $scope.forgotPass = function(){
        $ionicModal.fromTemplateUrl('templates/forgotpass.html', {
            scope: $scope
        }).then(function (modal) {
            $scope.modal2 = modal;
            $scope.modal2.show();
        });
    }
    $scope.forgotPassReset = function(enter){
        ref.resetPassword({
            email: enter.email
        }, function(error) {
            if (error) {
                switch (error.code) {
                    case "INVALID_USER":
                        alert("The specified user account does not exist.");
                        break;
                    default:
                        alert("Error resetting password:" + error);
                }
            } else {
                alert("Password reset. Email sent successfully!");
                $scope.modal2.hide();
                $scope.modal2.remove();
                $state.go('login');
            }
        });
    }
   
    $scope.verifyStudentEmail = function(enter){
        ref.resetPassword({
            email: enter.schoolemail
            }, function(error) {
                if (error) {
                    switch (error.code) {
                        case "INVALID_USER":
                            alert("The specified user account does not exist.");
                            break;
                        default:
                            alert("Error:" + error);
                        }
                } else {
                    alert("An email to your student account has been sent!");
                    $scope.modal3.hide();
                    $scope.modal3.remove();
                    $state.go('login');
                }
            });
    }
    $scope.createUser = function (user) {
        console.log("Create User Function called");
        if (user && user.email && user.password && user.displayname) {
            $ionicLoading.show({
                template: 'Signing Up...'
            });

            auth.$createUser({
                email: user.email,
                password: user.password
            }).then(function (userData) {
                alert("User created successfully!");
                ref.child("users").child(userData.uid).set({
                   user:{
                        email: user.email,
                        displayName: user.displayname
                    }
                });
                $ionicLoading.hide();
                $scope.modal1.hide();
                $scope.modal1.remove();
            }).catch(function (error) {
                alert("Error: " + error);
                $ionicLoading.hide();
            });
        } else
            alert("Please fill all details");
    }
    function emailEDUextention(email){
        var tolower = email.toLowerCase();
        return (/[.]/.exec(tolower)) ? /[^.]+$/.exec(tolower) : undefined;
    }
    $scope.createStudent = function (user) {
        console.log("Create Student Function called");
        if (user && user.schoolemail && /*emailEDUextention(user.schoolemail)[0] === 'edu' &&*/ user.displayname && !!$scope.schoolInfo) {
    
            $ionicLoading.show({
                template: 'Signing Up...'
            });
            auth.$createUser({
                email: user.schoolemail,
                password: generatePass()
            }).then(function (userData) {
                alert("User created successfully!");
                ref.child("users").child(userData.uid).set({
                    user:{
                        /*email: user.email,*/
                        displayName: user.displayname,
                        campus: user.campus,
                        schoolId: stripDot.strip($scope.schoolInfo.domain),
                        schoolEmail: user.schoolemail

                    }
                });
                $ionicLoading.hide();
                $scope.modal1.hide();
                $scope.modal1.remove();
            }).then(function(userData){
                    var school = Rooms.getSchoolBySid(stripDot.strip($scope.schoolInfo.domain));
                    school.$loaded(function(data){
                        if(data.length <= 0){
                            //var room = ref.child("schools").push();
                            var room = ref.child("schools").child(stripDot.strip($scope.schoolInfo.domain));
                            room.set({
                                icon: "ion-university",
                                schoolname: $scope.schoolInfo.name,
                                schoolId: stripDot.strip($scope.schoolInfo.domain),
                                id: room.key()
                            },function(err){
                                if(err) throw err;

                            })
                        }
                    });
            }).then(function(){
                 $ionicModal.fromTemplateUrl('templates/verifyStudentEmail.html', {
                    scope: $scope
                }).then(function (modal) {
                    $scope.modal3 = modal;
                    $scope.modal3.show();
                });
              })  
            .catch(function (error) {
                alert("Error: " + error);
                $ionicLoading.hide();
            });
        } else
            alert("Please fill all details properly");
    }
    $scope.signIn = function (user) {
        
        if (user && user.email && user.pwdForLogin) {
            $ionicLoading.show({
                template: 'Signing In...'
            });
            auth.$authWithPassword({
                email: user.email,
                password: user.pwdForLogin
            }).then(function (authData) {
                console.log("Logged in as:" + authData.uid);
                ref.child("users").child(authData.uid+'/user').once('value', function (snapshot) {
                    var val = snapshot.val();
    
                    if(!!val.schoolId){
                        $rootScope.advisor   = true;
                        $rootScope.prospect  = false;
                        $rootScope.schoolID  = val.schoolId;
                        //persist data
                        Users.storeIDS(true, 'advisor');
                        Users.removeItem('prospect');
                        Users.storeIDS(val.schoolId, 'schoolID');
                    }else{
                        $rootScope.prospect = true;
                        $rootScope.advisor   = false;
                        $rootScope.schoolID  = '';
                        //persist data
                        Users.storeIDS(true, 'prospect');
                        Users.removeItem('advisor');
                        Users.removeItem('schoolID');

                    }
                    $rootScope.userID = authData.uid;
                    $rootScope.displayName = val.displayName;
                    //persist data
                    Users.storeIDS(authData.uid, 'userID');
                    Users.storeIDS(val.displayName, 'displayName');
                
                    $ionicLoading.hide();
                    if(!!val.schoolId){
                        $state.go('menu.tab.student', {
                            schoolid: val.schoolId
                        });
                    }else{
                        $state.go('menu.tab.ask');
                    }
                    
                });
                
            }).catch(function (error) {
                alert("Authentication failed:" + error.message);
                $ionicLoading.hide();
            });
        } else
            alert("Please enter email and password both");
    }
    
})
.controller('ChatCtrl', function ($scope, $rootScope, Chats, Users, /*Store,*/ $state, $window, $ionicLoading, $ionicModal) {
    //console.log("Chat Controller initialized");
    if(!$scope.schoolID){
        $scope.schoolID = Users.getIDS('schoolID');
    }
    if(!$scope.displayName){
        $scope.displayName = Users.getIDS('displayName');
    }
    $scope.IM = {
        textMessage: ""
    };
    //$scope.students = [];
    var qid = $state.params.questionID,
        sid = $state.params.schoolid,
        ursid = $state.params.userID,
        indicatorToggle = $state.params.indicatorToggle;
        $scope.question = $state.params.question;

    Chats.selectRoom(sid, qid);

    var roomName = Chats.getSelectedRoomName();

    $scope.removePerm = function () {
        var val = Chats.wrapitup(sid, qid, $scope.question);
       if(typeof val !== "string"){
            if(!!$scope.schoolID){
                $scope.modal.hide();
                $state.go('menu.tab.student', {
                    schoolid: $scope.schoolID
                });
            }else{
                 $scope.modal.hide();
                 $state.go('menu.tab.ask');
            }
            angular.forEach(Store.getStore()[0], function(value, key){
                if(key === 'conversation'){
                    Store.deductAnswers(1);
                }
            });
       }
    }
    // Fetching Chat Records only if a Room is Selected
    if (roomName) {
        $scope.roomName = " - " + roomName;
        $scope.chats = Chats.all($scope.displayName);
            $rootScope.$on('message.sent', function (event, value){
                $scope.usersName = value;
            })
            $scope.$watch('chats', function(newValue, oldValue){
                if(newValue){
                    if(!!$scope.usersName){
                        if($scope.usersName !== $scope.displayName){
                            navigator.notification.vibrate(500);
                        }
                    }
                }
            },true);
            
    }

    $scope.sendMessage = function (msg) {
        Chats.send($scope.displayName, $scope.schoolID, msg, qid, sid, ursid, indicatorToggle);
        $scope.IM.textMessage = "";
        /*angular.forEach(Store.getStore()[0], function(value, key){
                if(value && !value.conversation){
                    Store.addConversation(1);
                }
        });*/
    }

    $scope.remove = function (chat, index) {
        Chats.remove(chat);
        /*angular.forEach(Store.getStore()[0], function(value, key){
                if(key === 'conversation' && index == 0){
                    Store.deductConversation(1);
                }
        });*/
    }

    $scope.removePerm = function () {
        var val = Chats.wrapitup(sid, qid, $scope.question);
       if(typeof val !== "string"){
            if(!!$scope.schoolID){
                $scope.modal.hide();
                $state.go('menu.tab.student', {
                    schoolid: $scope.schoolID
                });
            }else{
                 $scope.modal.hide();
                 $state.go('menu.tab.ask');
            }
       }
    }

    $scope.removeConversation = function (){
        $ionicModal.fromTemplateUrl('templates/remove-conversation.html', {
            scope: $scope
        }).then(function (modal) {
            $scope.modal = modal;
            $scope.modal.show();
        });
    }

})
.controller('TabCtrl', function ($scope){
    $scope.tabSelected = function (select){
        $scope.tabs = select;
    }
})
.controller('SettingsCtrl', function ($scope, Users, ChangePassword, $state, $ionicLoading, $ionicModal, Auth) {
    console.log('settings initialized');

    $scope.deleteAccount = function(){
                $ionicModal.fromTemplateUrl('templates/delete-account.html', {
                    scope: $scope
                }).then(function (modal) {
                    $scope.modal = modal;
                    $scope.modal.show();
            });
        }

    $scope.logout = function () {
            console.log("Logging out from the app");
            $ionicLoading.show({
                template: 'Logging Out...'
            });
            //$scope = $scope.$new(true);
            Auth.$unauth();
    }
       
    $scope.runChangePassword = function(user){
            ChangePassword.change(user);
    }
})

.controller('RoomsCtrl', function ($scope, Users, $state) {
    console.log("Rooms Controller initialized");
    if(!$scope.userID){
        $scope.userID = Users.getIDS('userID');
    }

    var q = Users.getUserById($scope.userID);
    q.$loaded(function(data){
        $scope.rooms = data;
    })
    
    $scope.openChatRoom = function (schoolid, questionId, question) {

        $state.go('menu.tab.chat', {
            userId: $scope.userID,
            schoolid: schoolid,
            questionID: questionId,
            userID: $scope.userID,
            indicatorToggle:false,
            question: question
        });
    }
})
.controller('StudentCtrl', function ($scope, $rootScope, Users, Chats, Rooms,/* Store,*/ $state, $window) {
    console.log("Student Controller initialized");
    if(!$scope.userID){
        $scope.userID = Users.getIDS('userID');
    }
    var num=0;
    $scope.school = Rooms.getSchoolBySid($state.params.schoolid);
    $scope.school.$loaded(function(data){
         $scope.rooms = data;
     });
    $scope.openChatRoom = function (schoolid, questionId, userid, question) {

        $state.go('menu.tab.chat', {
            userId: $scope.userID,
            schoolid: schoolid,
            questionID: questionId,
            userID: userid,
            indicatorToggle:true,
            question: question
        });
    }
   
})
.controller('StudentConversCtrl', function ($scope, $rootScope, Users, Chats, Rooms, /*Store,*/ $state, $window) {
    console.log("Student convers Controller initialized");
    if(!$scope.userID){
        $scope.userID = Users.getIDS('userID');
    }
    if(!$scope.schoolID){
        $scope.schoolID = Users.getIDS('schoolID');
    }
    var num=0;
    $scope.school = Rooms.getSchoolBySid($scope.schoolID);
    $scope.school.$loaded(function(data){
         $scope.rooms = data;
         
     });
   
    $scope.openChatRoom = function (schoolid, questionId, userid, question) {

        $state.go('menu.tab.chat', {
            userId: $scope.userID,
            schoolid: schoolid,
            questionID: questionId,
            userID: userid,
            indicatorToggle:true,
            question: question
        });
    }
   
})
.controller('AskCtrl', function($scope, $state, Users, Rooms, SchoolDataService, stripDot, $ionicLoading){
    var icon='';
    if(!$scope.userID){
        $scope.userID = Users.getIDS('userID');
    }

    $scope.user = {}
    $scope.data = { 'list' : '', 'search' : ''};

    $scope.search = function() {

        SchoolDataService.searchSchools($scope.data.search).then(
            function(matches) {
                $scope.user.sid = matches[0];
                $scope.data.list = matches;
                
            }
        )
    }
    $scope.update = function (data){

    }
    $scope.ask = function (quest){

        var chars = !!quest.question ? quest.question.split('') : undefined
            if(!!quest.sid){
                if(chars && chars.length >= 15){
                    $ionicLoading.show({
                        template: 'Sending...'
                    });
                    Rooms.addQuestionsToSchool(quest.sid.schoolId, $scope.userID, quest.question, $scope, 'ion-chatbubbles').then(function(data){
                        Users.addQuestionToUser(quest.sid.schoolId, 
                            $scope.userID, 
                            quest.question,
                            'ion-chatbubbles',
                            data.key()
                        ).then(function(){
                            $ionicLoading.hide();
                            $state.go('menu.tab.newest');
                            $scope.data.search = '';
                            $scope.user.question = '';
                        });
                    })
                }else{
                    alert('questions must be at least 15 characters long');
                }
            }else{
                alert('please select a school');
            }
    }
});

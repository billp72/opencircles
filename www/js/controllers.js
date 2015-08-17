angular.module('mychat.controllers', [])

.controller('LoginCtrl', function ($scope, $ionicModal, $state, $firebaseAuth, $timeout, Rooms, $ionicLoading, $rootScope, SchoolDataService, schoolFormDataService, stripDot) {
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
                        $scope.erros = "The specified user account does not exist.";
                        break;
                    default:
                        $scope.errors = "Error resetting password:" + error;
                }
            } else {
                $scope.errors = "Password reset. Email sent successfully!";
                //$scope.modal2.hide();
                //$scope.modal2.remove();
                //$state.go('login');
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
                            $scope.errors = "The specified user account does not exist.";
                            break;
                        default:
                            $scope.errors = "Error:" + error;
                        }
                } else {
                    $scope.errors = "An email to your student account has been sent!";
                    //$scope.modal3.hide();
                   // $scope.modal3.remove();
                    //$state.go('login');
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

                    $rootScope.student =  !!val.schoolId ? true : false;
                    $rootScope.hsStudent = !val.schoolId ? true : false;

                    $timeout( function(){
                        $scope.$apply(function () {
                            $rootScope.displayName = val.displayName;
                            //$rootScope.campus = !!val.campus ? val.campus : 'main';
                            $rootScope.userID = authData.uid;
                            $rootScope.schoolid = !!val.schoolId ? val.schoolId : null;
                        });
                    }, 100);
                    
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
.controller('ChatCtrl', function ($scope, Chats, Users, $state, $window, $ionicLoading, $ionicModal) {
    //console.log("Chat Controller initialized");
    $scope.IM = {
        textMessage: ""
    };
    //$scope.students = [];
    var qid = $state.params.questionID;
    var sid = $state.params.schoolid;
    var ursid = $state.params.userID;
    var indicatorToggle = $state.params.indicatorToggle;
    $scope.question = $state.params.question;

    Chats.selectRoom(sid, qid);

    var roomName = Chats.getSelectedRoomName();
    
    /*$scope.users = Users.all();

    $scope.users.$loaded(function(data){
        for(var i=0; i<data.length; i++){
            if(data[i].user.schoolId === sid){
                $scope.students.push({name: data[i].user.displayName, campus:data[i].user.campus});
            }
        }
    });*/
    //remove conversation
    $scope.removePerm = function () {
        var val = Chats.wrapitup(sid, qid, $scope.question);
       if(typeof val === "string"){
           console.log(val);
       }else{
            if(!!$scope.schoolid){
                $scope.modal.hide();
                $state.go('menu.tab.student', {
                    schoolid: $scope.schoolid
                });
            }else{
                 $scope.modal.hide();
                 $state.go('menu.tab.ask');
            }
       }
    }
    // Fetching Chat Records only if a Room is Selected
    if (roomName) {
        $scope.roomName = " - " + roomName;
        $scope.chats = Chats.all($scope.displayName);
    }

    $scope.sendMessage = function (msg) {
        Chats.send($scope.displayName, $scope.schoolid, msg, qid, sid, ursid, indicatorToggle);
        $scope.IM.textMessage = "";
    }

    $scope.remove = function (chat) {
        Chats.remove(chat);
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

.controller('SettingsCtrl', function ($scope, Users, $state, $ionicLoading, $ionicModal, Auth) {
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
            $scope = $scope.$new(true);
            Auth.$unauth();
        }
       
    $scope.runChangePassword = function(user){
            var ref = new Firebase($rootScope.firebaseUrl);
                ref.changePassword({
                    email: user.schoolemail,
                    oldPassword: user.oldPassword,
                    newPassword: user.newPassword
                }, function(error) {
                    if (error) {
                        switch (error.code) {
                            case "INVALID_PASSWORD":
                                $scope.errors = "The specified user account password is incorrect.";
                                break;
                            case "INVALID_USER":
                                $scope.errors = "The specified user account does not exist.";
                                break;
                            default:
                                $scope.errors = "Error changing password:", error;
                        }
                    } else {

                        $scope.errors = "User password changed successfully!";
                    }
                });
        }
})

.controller('RoomsCtrl', function ($scope, Users, $state) {
    console.log("Rooms Controller initialized");

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
.controller('StudentCtrl', function ($scope, $rootScope, Users, Chats, Rooms, $state, $window) {
    console.log("Student Controller initialized");
    $scope.ctrl = "ctrl1";
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
.controller('StudentConversCtrl', function ($scope, $rootScope, Users, Chats, Rooms, $state, $window) {
    console.log("Student convers Controller initialized");
    $scope.ctrl = "ctrl2";
    $scope.school = Rooms.getSchoolBySid($rootScope.schoolid);
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
.controller('AskCtrl', function($scope, Users, $state, Rooms, SchoolDataService, stripDot, $ionicLoading){
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
         $ionicLoading.show({
                template: 'Sending...'
         });
         Rooms.addQuestionsToSchool(quest.sid.schoolId, $scope.userID, quest.question, $scope, 'ion-chatbubbles').then(function(data){

                Users.storeQuestionIDS(data.path.u[data.path.u.length-1]);
                Users.addQuestionToUser(quest.sid.schoolId, 
                    $scope.userID, 
                    quest.question,
                    'ion-chatbubbles',
                    data.path.u[data.path.u.length-1]
                ).then(function(){
                    $ionicLoading.hide();
                    $state.go('menu.tab.newest');
                    $scope.data.search = '';
                    $scope.user.question = '';
             });
        })
    }
});

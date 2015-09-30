angular.module('mychat.controllers', [])

.controller('LoginCtrl', [
    '$scope', 
    '$ionicModal', 
    '$state', 
    '$firebaseAuth', 
    'Rooms', 
    'Users', 
    '$ionicLoading', 
    '$rootScope', 
    '$ionicHistory', 
    'SchoolDataService', 
    'schoolFormDataService', 
    'stripDot',
    'pushService',
    '$window',
    function (
    $scope, 
    $ionicModal, 
    $state, 
    $firebaseAuth, 
    Rooms, 
    Users, 
    $ionicLoading, 
    $rootScope, 
    $ionicHistory, 
    SchoolDataService, 
    schoolFormDataService, 
    stripDot,
    pushService,
    $window) {
    //console.log('Login Controller Initialized');

    var ref = new Firebase($scope.firebaseUrl);
    var auth = $firebaseAuth(ref);

    $scope.$on('$ionicView.enter', function(){
            $ionicHistory.clearCache();
            $ionicHistory.clearHistory();
    });

    $scope.user = {};
    $scope.data = { "list" : '', "search" : ''};
    
    function moveCaretToStart(el) {
        if (typeof el.selectionStart == "number") {
            el.selectionStart = el.selectionEnd = 0;
        } else if (typeof el.createTextRange != "undefined") {
            el.focus();
            var range = el.createTextRange();
            range.collapse(true);
            range.select();
        }
    }

    $scope.search = function() {

        schoolFormDataService.schoolList($scope.data.search).then(
            function(matches) {
                $scope.user.schoolID = matches[0];
                $scope.data.list = matches;
                $scope.user.schoolemail = '@'+$scope.user.schoolID.domain;
                var textBox = document.getElementById('schoolemail');
                    moveCaretToStart(textBox);
                    $window.setTimeout(function() {
                        moveCaretToStart(textBox);
                    }, 1);
            }
        )
    }
    
    $scope.update = function(school){
        $scope.user.schoolemail = '@'+school.domain;
        var textBox = document.getElementById('schoolemail');
            moveCaretToStart(textBox);
            $window.setTimeout(function() {
                    moveCaretToStart(textBox);
            }, 1);    
    }
    function emailDomain(email){
        var tolower = email.toLowerCase();
        return (/[@]/.exec(tolower)) ? /[^@]+$/.exec(tolower) : undefined;
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
    $scope.createUser = function (user) {
        console.log("Create User Function called");
        if (!!user && !!user.email && !!user.password && !!user.displayname) {
            if(user.password.split('').length>5){
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
                        displayName: user.displayname,
                        grade: user.grade,
                        organization: user.organization
                    }
                });
                $ionicLoading.hide();
                $scope.modal1.hide();
                $scope.modal1.remove();
            }).catch(function (error) {
                alert("Error: " + error);
                $ionicLoading.hide();
            });
            }else{
                alert("Your password must be at least 6 characters");
            }
        } else{
            alert("Please fill all details");
        }
    }
    $scope.createStudent = function (user) {
        console.log("Create Student Function called");
        if (
            !!user && 
            !!user.schoolemail &&
            !!user.displayname && 
            !!user.schoolID &&
             user.schoolID.domain === emailDomain(user.schoolemail)[0] 
             ) 
        {
          
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
                        displayName: user.displayname,
                        grade: user.grade,
                        schoolID: stripDot.strip(user.schoolID.domain),
                        schoolEmail: user.schoolemail,
                        group: user.group,
                        major: user.major
                    }
                });
                $ionicLoading.hide();
                $scope.modal1.hide();
                $scope.modal1.remove();
            }).then(function(userData){
                var school = Rooms.getSchoolBySchoolID(stripDot.strip(user.schoolID.domain));
                school.$loaded(function(data){
                        //if the school doesn't exist already, add it
                    if(data.length <= 0){
                        var room = ref.child("schools").child(stripDot.strip(user.schoolID.domain));
                        room.set({
                            icon: "ion-university",
                            schoolname: user.schoolID.value,
                            schoolID: stripDot.strip(user.schoolID.domain),
                            schoolEmail: user.schoolID.schoolContact,
                            ID: room.key()
                        },function(err){
                            if(err) throw err;

                        })
                    }
                });
            }).then(function(){
                ref.resetPassword({
                    email: user.schoolemail
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
                        $ionicLoading.hide();
                        $state.go('login');
                    }
                });
              })  
            .catch(function (error) {
                alert("Error: " + error);
                $ionicLoading.hide();
            });
        }else{
            alert("Please fill all details properly");
	    }
    }
    $scope.openSignIn = function (){
        $ionicModal.fromTemplateUrl('templates/login2.html', {
                    scope: $scope
                }).then(function (modal) {
                    $scope.modal = modal;
                    $scope.modal.show();
                });
    }
    $scope.signIn = function (user) {
        $window.localStorage.setItem('test', 'test');
        if($window.localStorage.getItem('test') === null){
             alert('you must activate local storage to use this app');
            $scope.modal.hide();           
        }else{
            $window.localStorage.removeItem('test');
        
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
    
                    if(!!val.schoolID){
                        $rootScope.advisor    = true;
                        $rootScope.prospect   = false;
                        $rootScope.schoolID   = val.schoolID;
                        //persist data
                        Users.storeIDS(true, 'advisor');
                        Users.removeItem('prospect');
                        Users.storeIDS(val.schoolID, 'schoolID');
                    }else{
                        $rootScope.prospect = true;
                        $rootScope.advisor  = false;
                        $rootScope.schoolID = '';
                        $rootScope.email = val.email;
                        $rootScope.organization = !!val.organization ? val.organization : 'none';
                        //persist data
                        Users.storeIDS(true, 'prospect');
                        Users.removeItem('advisor');
                        Users.removeItem('schoolID');

                    }
                    $rootScope.userID = authData.uid;
                    $rootScope.displayName = val.displayName;
                     pushService.register().then(function(token){
                        console.log("token: ", token);
                    });
                    //persist data
                    Users.storeIDS(authData.uid, 'userID');
                    Users.storeIDS(val.displayName, 'displayName');
                
                    $scope.modal.hide();
                    
                    if(!!val.schoolID){
                        $state.go('menu.tab.student');
                    }else{
                        $state.go('menu.tab.ask');
                    }
                    $ionicLoading.hide();  
                });
                
            }).catch(function (error) {
                alert("Authentication failed:" + error.message);
                $ionicLoading.hide();
            });
        } else{
            alert("Please enter email and password both");
        }
      }
    }   
}])
/*
* end Loginctrl
*/
.controller('TabCtrl', ['$scope', '$rootScope', function ($scope, $rootScope){
    $scope.tabSelected = function (select){
        $rootScope.tabs = select;
    }
}])
.controller('SettingsCtrl', ['$scope', 'Users', 'ChangePassword', '$state', '$ionicLoading', '$ionicModal', 'Auth',
    function ($scope, Users, ChangePassword, $state, $ionicLoading, $ionicModal, Auth) {
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

            Auth.$unauth();
    }
       
    $scope.runChangePassword = function(user){
            ChangePassword.change(user);
    }
}])
/*
* opens the private chat room
*/
.controller('ChatCtrl', ['$scope', '$rootScope', 'Chats', 'Users', 'Rooms', '$state', '$window', '$ionicLoading', '$ionicModal', '$ionicScrollDelegate', '$timeout', 'RequestsService',
    function ($scope, $rootScope, Chats, Users, Rooms, $state, $window, $ionicLoading, $ionicModal, $ionicScrollDelegate, $timeout, RequestsService) {
    //console.log("Chat Controller initialized");
    var 
        advisorKey          = $state.params.advisorKey,
        schoolID            = $state.params.schoolID,
        advisorID           = $state.params.advisorID,
        prospectUserID      = $state.params.prospectUserID,
        prospectQuestionID  = $state.params.prospectQuestionID,
        schoolsQuestionID   = $state.params.schoolsQuestionID,
        displayName         = $state.params.displayName,
        email               = $state.params.email,
        toggleUserID        = '',
        toggleQuestionID    = '',
        firstMessage        = false;

    if(!$scope.schoolID){
        $scope.schoolID = Users.getIDS('schoolID');
    }
    if(!$scope.displayName){
        $scope.displayName = Users.getIDS('displayName');
    }
    $scope.IM = {
        textMessage: ""
    };
    var txtInput;
    $timeout(function(){
        footerBar = document.body.querySelector('#userMessagesView .bar-footer');
        txtInput = angular.element(footerBar.querySelector('input'));
    },0);
    var viewScroll = $ionicScrollDelegate.$getByHandle('userMessageScroll');
    function keepKeyboardOpen() {
      //console.log('keepKeyboardOpen');
      txtInput.one('blur', function() {
        //console.log('textarea blur, focus back on it');
        txtInput[0].focus();
      });
    }

        if(!!$scope.schoolID){
            toggleUserID     = prospectUserID;
            toggleQuestionID = prospectQuestionID;
        }else{
            toggleUserID     = advisorID;
            toggleQuestionID = advisorKey;
        }
        if(!!schoolsQuestionID){
            firstMessage=true;
        }
       
        $scope.question = $state.params.question;
        //console.log('id',advisorID, 'key', advisorKey);
        Chats.selectRoom(schoolID, advisorID, advisorKey);


    Chats.getSelectedRoomName(function(roomName){
    // Fetching Chat Records only if a Room is Selected
        if (roomName) {
            $scope.roomName = " - " + roomName;
            $scope.chats = Chats.all($scope.displayName);
            $scope.$watch('chats', function(newValue, oldValue){
                $timeout(function() {
                    keepKeyboardOpen();
                    viewScroll.scrollBottom();
                }, 0);
        
            },true);
            
        }
    });
    $scope.sendMessage = function (msg) {
        if(!firstMessage){
            Chats.send($scope.displayName, schoolID, msg, toggleUserID, toggleQuestionID);
            $scope.IM.textMessage = "";
        }else{//first time an advisor asnwers a question
                $ionicLoading.show({
                    template: 'Sending...'
                });
                Users.addQuestionToUser( //request 1
                    schoolID,
                    advisorID,
                    $scope.question,
                    'ion-chatbubbles', 
                    prospectQuestionID, 
                    prospectUserID,
                    displayName,
                    email 
                )
                .then(function (results){
                   $scope.addAnswerAdvisor = results;
                   $scope.advisorKey = results.key();
                   return Users.addAnswerToAdvisor( //request 2
                        $scope.displayName,
                        schoolID,
                        msg,
                        $scope.advisorKey,
                        advisorID
                    )               
                })
                .then(function (results){
                    $scope.updateProspectQuestion = results;
                    return Users.updateProspectQuestion( //request 3
                        prospectUserID, 
                        prospectQuestionID, 
                        advisorID, 
                        $scope.advisorKey,
                        schoolsQuestionID,
                        schoolID
                    )
                            
                })
                .then(function(){
                    firstMessage=false;
                    Chats.selectRoom(schoolID, advisorID, $scope.advisorKey);
                    $scope.chats = Chats.all($scope.displayName);
                    $scope.IM.textMessage = "";
                    $ionicLoading.hide();

                    $scope.addAnswerAdvisor = null;
                    $scope.updateProspectQuestion = null;
                }).catch (function(error){
                    alert('error sending message: ' + error);
                })
                        
        }
        RequestsService.pushNote(
            {
             'message':'Message from: ' + $scope.displayName,
             'userID': toggleUserID,
             'method':'GET',
             'path':'push'
            });

    }
//removes a single chat message
    $scope.remove = function (chat, index) {
        Chats.remove(chat);
    }
//remove question/conversation once dialog is confirmed
    $scope.removePerm = function () {
       var advkey = !!advisorKey ? advisorKey : $scope.advisorKey;
       var mail = firstMessage ? null : email;
       var val = Chats.wrapitup(advkey, advisorID, schoolID, schoolsQuestionID, prospectQuestionID, prospectUserID, $scope.question, mail, prospectUserID);
       if(typeof val !== "string"){
            if(!!$scope.schoolID){
                $scope.modal.hide();
                $state.go('menu.tab.student', {
                    schoolID: schoolID
                });
            }else{
                 $scope.modal.hide();
                 $state.go('menu.tab.ask');
            }
       }else{
            alert(val);
       }
    }
//dialog that warns user before question/conversation is deleted
    $scope.removeConversation = function (){
        $ionicModal.fromTemplateUrl('templates/remove-conversation.html', {
            scope: $scope
        }).then(function (modal) {
            $scope.modal = modal;
            $scope.modal.show();
        });
    }

}])
/*this is the prospects view room
*
*/
.controller('ProspectCtrl', ['$scope', 'Users', '$state', function ($scope, Users, $state) {
    console.log("Rooms Controller initialized");
    if(!$scope.userID){
        $scope.userID = Users.getIDS('userID');
    }

    var q = Users.getUserByID($scope.userID);
    q.$loaded(function(data){
        $scope.rooms = data;
    })
    
    $scope.openChatRoom = function (advisorID, schoolID, question, advisorKey, prospectQuestionID) {
        
        if(!!advisorID){
            $state.go('menu.tab.chat', {
                advisorID: advisorID,
                schoolID: schoolID,
                advisorKey: advisorKey,
                prospectUserID: $scope.userID, //
                prospectQuestionID: prospectQuestionID, //
                schoolsQuestionID: '',
                question: question,
                displayName: '',
                email: $scope.email 
            });
            Users.toggleQuestionBackAfterClick($scope.userID, prospectQuestionID);
        }else{
            alert('question has not been answered yet');
        }
    }
}])
/*the advisor see private questions and open chat
*
*/
.controller('AdvisorConversationsCtrl', ['$scope', '$rootScope', 'Users', 'Chats', 'Rooms', '$state', '$window',
    function ($scope, $rootScope, Users, Chats, Rooms, $state, $window) {
    console.log("Student conversations Controller initialized");
    if(!$scope.userID){
        $scope.userID = Users.getIDS('userID');
    }
    if(!$scope.schoolID){
        $scope.schoolID = Users.getIDS('schoolID');
    }
    $scope.school = Users.getUserByID($scope.userID);
    $scope.school.$loaded(function(data){
         $scope.rooms = data;
         
     });
    $scope.openChatRoom = function (question, advisorKey, prospectUserID, prospectQuestionID, email) {
        //TODO: toggle conversationStarted to false
        $state.go('menu.tab.chat', {
            advisorID: $scope.userID,
            schoolID: $scope.schoolID,
            advisorKey: advisorKey,
            prospectUserID: prospectUserID,
            prospectQuestionID: prospectQuestionID,
            schoolsQuestionID: '',
            question: question,
            displayName: '',
            email: email   
        });
        Users.toggleQuestionBackAfterClick($scope.userID, advisorKey);
    }
}])

/*this controller is for public questions
*
*/
.controller('AdvisorCtrl', ['$scope', '$rootScope', 'Users', 'Chats', 'Rooms', '$state', '$window', 
    function ($scope, $rootScope, Users, Chats, Rooms, $state, $window) {
    console.log("Student Controller initialized");
    if(!$scope.userID){
        $scope.userID = Users.getIDS('userID');
    }
    if(!$scope.schoolID){
        $scope.schoolID = Users.getIDS('schoolID');
    }
    $scope.school = Rooms.getSchoolBySchoolID($scope.schoolID);
    $scope.school.$loaded(function(data){
         $scope.rooms = data;

         //TODO: watch createdAt. Send push when aged
     });
    $scope.openChatRoom = function (question, prospectUserID, prospectQuestionID, schoolsQuestionID, displayName, email) {

        $state.go('menu.tab.chat', {
            advisorID: $scope.userID,
            schoolID: $scope.schoolID,
            advisorKey: '',
            prospectUserID: prospectUserID,
            prospectQuestionID: prospectQuestionID,
            schoolsQuestionID: schoolsQuestionID,
            question: question,
            displayName: displayName,
            email: email 
        });
    }
 
}])
/*the prospect can ask a question
*
*/
.controller('AskCtrl', ['$scope', '$state', 'Users', 'Rooms', 'SchoolDataService', 'stripDot', '$ionicLoading', '$http', 'Questions',
    function($scope, $state, Users, Rooms, SchoolDataService, stripDot, $ionicLoading, $http, Questions){
    var icon='';
    if(!$scope.userID){
        $scope.userID = Users.getIDS('userID');
    }
    if(!$scope.displayName){
        $scope.displayName = Users.getIDS('displayName');
    }

    $scope.user = {}
    $scope.data = { 'list' : '', 'search' : ''};

    $scope.search = function() {

        SchoolDataService.searchSchools($scope.data.search).then(
            function(matches) {
                $scope.user.schoolID = matches[0];
                $scope.data.list = matches;
                if(!!$scope.user.schoolID.schoolContact){
                    $scope.hasEmail = true;
                }
                
            }
        )
    }
    $scope.update = function (data){
        if(!!data && data.schoolContact){
            //show the checkbox to send email if school has one
            $scope.hasEmail = true;
        } 
    }
    $scope.ask = function (quest){
            if(!!quest.schoolID){
                if(quest.question.amount >= 15){
                    $ionicLoading.show({
                        template: 'Sending...'
                    });
                     Users.addQuestionToUser(
                            quest.schoolID.schoolID, 
                            $scope.userID, 
                            quest.question.value,
                            'ion-chatbubbles',
                            false,
                            false
                        ).then(function(data){
                            Rooms.addQuestionsToSchool(
                                quest.schoolID.schoolID, 
                                $scope.userID,
                                quest.question.value,
                                'ion-chatbubbles', 
                                data.key(),
                                $scope.displayName,
                                $scope.email 
                            ).then(function(){
                                $ionicLoading.hide();
                                $state.go('menu.tab.newest');
                                $scope.data.search = '';
                                $scope.user.question = '';
                        });
                    });

                    if(quest.isChecked){
                        var data = {
                                emailFrom: $scope.email,
                                schoolContact: quest.schoolContact,
                                question: quest.question.value
                        };
                        $http({
                            method: 'POST',
                            url: 'http://www.netcreative.org/schools/emailToSchool.php', 
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
                    Questions.save({
                        question: quest.question.value, 
                        organization: $scope.organization, 
                        school: quest.schoolID.schoolname
                    }); 
                }else{
                    alert('questions must be at least 15 characters long');
                }
            }else{
                alert('please select a school');
            }
    }
}]);

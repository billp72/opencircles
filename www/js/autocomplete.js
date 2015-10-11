angular.module('mychat.autocomplete', ['firebase'])

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
* autocomplete search for groups mentors
*/
.factory('groupsMentorsDataService', ['$q', '$timeout', 'groupsMentorData', 'Users', function ($q, $timeout, groupsMentorData, Users) {
        var datas = groupsMentorData.getGroupByID(Users.getIDS('schoolID'));
        var schools='';
        datas.$loaded(function(data){

            schools = data.sort(function(a, b) {

                var schoolA = a.$id.toLowerCase();
                var schoolB = b.$id.toLowerCase();

                if(schoolA > schoolB) return 1;
                if(schoolA < schoolB) return -1;

                return 0;
            });
        });
            var searchSchool = function(searchFilter) {    
            //console.log('Searching school for ' + searchFilter);
            var deferred = $q.defer();
            var matches = schools.filter( function(school) {
                if(school.$id.toLowerCase().indexOf(searchFilter.toLowerCase()) !== -1 ) return true;
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
.factory('groupsMentorData', ['$firebase', function ($firebase){

    var ref = new Firebase(firebaseUrl+'/schools');

    return{
        getGroupByID: function (schoolID){
            return $firebase(ref.child(schoolID).child('questions')).$asArray();
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
/*
* this is to populate the form with groups when the user is asking a question
*/
.factory('groupsFormDataService', ['$q', '$timeout', 'schoolGroupData', 
    function ($q, $timeout, schoolGroupData){

    var datas = schoolGroupData.all();
    var schools='';
    
        datas.then(function(data){
           schools = data.data.sort(function(a, b) {
    
                var schoolA = a.groupName.toLowerCase();
                var schoolB = b.groupName.toLowerCase();

                if(schoolA > schoolB) return 1;
                if(schoolA < schoolB) return -1;

                return 0;
            });
        
       });
       var groupList = function(searchFilter) {
         
            //console.log('Searching school for ' + searchFilter);

            var deferred = $q.defer();

            var matches = schools.filter( function(school) {
                if(school.groupName.toLowerCase().indexOf(searchFilter.toLowerCase()) !== -1 ) return true;
            })

            $timeout( function(){
        
                deferred.resolve( matches );

            }, 100);

            return deferred.promise;

        };

    return {

        groupList: groupList

    }
}])
.factory('schoolGroupData', ['$http', function ($http){
    var data = $http.get('http://www.theopencircles.com/opencircles/groups.php');
    return {
        all: function(){
            return data;
        }
    }
}]);

angular.module('mychat.directives', [])

.directive('myMaxlength', function() {
  return {
    require: 'ngModel',
    link: function (scope, element, attrs, ngModelCtrl) {
      var maxlength = Number(attrs.myMaxlength);
      function fromUser(text) {
          if (text.length > maxlength) {
            var transformedInput = text.substring(0, maxlength);
            ngModelCtrl.$setViewValue(transformedInput);
            ngModelCtrl.$render();
            return transformedInput;
          } 
          return text;
      }
      ngModelCtrl.$parsers.push(fromUser);
    }
  }; 
})
.directive('displayText', function($compile) {
    
  return {
    restrict: "C", 
    scope: false,
    link: function(scope, elem, attrs) {
      //var list = elem[0].getElementsByClassName('ng-hide'),
          i=0,
          contr1=true,
          contr2=true;

          scope.$watch('rooms', function(data){
          
                if(data != undefined){

                  if(scope.ctrl==='ctrl1'){
                    for(i; i<scope.rooms.length; i++){ 
                          if(!scope.rooms[i].conversation){
                            contr1=false;
                          }
                      }
                    }
                  if(scope.ctrl==='ctrl2'){
                    for(i; i<scope.rooms.length; i++){ 
                          if(!!scope.rooms[i].conversation){
                            contr2=false;
                          }
                      }
                    }
                    if(scope.rooms.length > 0){

                      if (contr1 && scope.ctrl === 'ctrl1') {
                          var temp = $compile('<ion-item class="textCenter"><i>No current questions<i></ion-item>');
                          var content = temp(scope);
                          elem.find('div').append(content);
                      }

                      if(contr2 && scope.ctrl === 'ctrl2'){
                          var temp = $compile('<ion-item class="textCenter"><i>No conversations<i></ion-item>');
                          var content = temp(scope);
                          elem.find('div').append(content);
                      }
                    }
              }   
  
          });
   
    }
  };
})

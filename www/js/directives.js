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
.directive('displayText', ['$compile' /*, 'Store'*/, function ($compile /*, Store*/) {
    
  return {
    restrict: 'C', 
    link: function(scope, elem, attrs) {
  
        scope.$watch('rooms', function (){
            var Qnum=0,
                Cnum=0;
            angular.forEach(scope.rooms, function (value, key){
                if(!value.conversation){
                    Qnum +=1;     
                }else{
                    Cnum +=1;
                }
            });
            scope.message = 'You have '+ Qnum + ' question(s)';
            scope.message2 = 'You have '+ Cnum + ' conversation(s)';
        },true);
        
    }
  };
}])



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
         /*scope.$watch('tabs', function (){
              if(scope.tabs == 'ctrl1'){
                  if(Store.getConversation() > 0){
                      scope.message = 'no current questions.';
                  }else{
                      scope.message = '';
                  }
              } 
              if(scope.tabs == 'ctrl2'){
                  if(Store.getConversation() === 0){
                      scope.message2 = 'no current conversations.';
                  }else{
                      scope.message2 = '';
                  }
              }
          });*/
    }
  };
}])



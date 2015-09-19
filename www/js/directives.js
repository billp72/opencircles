angular.module('mychat.directives', [])

.directive('myMaxlength', [function() {
  return {
    require: 'ngModel',
    link: function (scope, element, attrs, ngModelCtrl) {
      var maxlength = Number(attrs.myMaxlength);
      function fromUser(text) {
          if (text.length > maxlength) {
            var transformedInput = text.substring(0, maxlength);
            ngModelCtrl.$setViewValue(transformedInput);
            ngModelCtrl.$render();
            return {
                'amount': transformedInput.length,
                'value': transformedInput
              }
          } 
          return {
                'amount': text.length,
                'value': text
              }
      }
      ngModelCtrl.$parsers.push(fromUser);
    }
  }; 
}]);




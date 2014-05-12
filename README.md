angular-exception-post
======================

An angular module to post JS errors to the server.  Uses `stacktrace` to generate the stacktrace to be posted to the server.  Can be configured with a debounce time so a slew of errors aren't posted at once.  Based on code from [http://engineering.talis.com/articles/client-side-error-logging/](http://engineering.talis.com/articles/client-side-error-logging/)

## Requirements

- AngularJS
- stacktrace

## Usage
```javascript
angular.module('myApp',['loosebits.client.exception.post'])
  .config(['errorLogServiceProvider', function(errorLogServiceProvider) {
    errorLogServiceProvider
      .onSuccess('exceptionHandler') //Service called 
      .debounce(1000)
      .post-url('client-error');
}])  
```




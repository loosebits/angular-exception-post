/* global printStackTrace */
/* global XMLHttpRequest */
/* global ActiveXObject */
//Based on code from http://engineering.talis.com/articles/client-side-error-logging/

//Don't use any frameworks for AJAX - Angular will cause exception logging and don't want a jquery dependency.
function createXMLHttp() {
  if (typeof XMLHttpRequest !== undefined) {
    return new XMLHttpRequest();
  } else if (window.ActiveXObject) {
    var ieXMLHttpVersions = ['MSXML2.XMLHttp.5.0', 'MSXML2.XMLHttp.4.0', 'MSXML2.XMLHttp.3.0', 'MSXML2.XMLHttp', 'Microsoft.XMLHttp'],
        xmlHttp;
    for (var i = 0; i < ieXMLHttpVersions.length; i++) {
      try {
        xmlHttp = new ActiveXObject(ieXMLHttpVersions[i]);
        return xmlHttp;
      } catch (e) {
      }
    }
  }
}

function ajax(config) {
  var xmlHttp = createXMLHttp(config.success, config.error);
  xmlHttp.open('post', config.url, true);
  xmlHttp.setRequestHeader("Content-Type", "application/json");
  xmlHttp.send(config.data);
  xmlHttp.onreadystatechange = function() {
    if (xmlHttp.readyState === 4) {
      if (xmlHttp.status === 200) {
        config.success.call(null, xmlHttp.responseText);
      } else {
        config.error.call(null, xmlHttp.responseText);
      }
    }
  };
}


angular.module('loosebits.client.exception.post',[])
.factory("stacktraceService", function() {
        return { print: printStackTrace };
    }
)
.provider("$exceptionHandler", function $exceptionHandlerProvider() {
    this.$get = ['errorLogService', function(errorLogService) { return errorLogService; }];
})
.provider("errorLogService", function errorLogServiceProvider() {
    var postUrl = 'client-errors';
    var successCallbackName;
    var debounceTime = 200;
    var ajaxPost = true;
    var timer;

    this.postUrl = function(url) {
        postUrl = url;
        return this;
    };
    this.onSuccess = function(callback) {
        successCallbackName = callback;
        return this;
    };
    this.debounce = function(dbt) {
        debounceTime = dbt;
        return this;
    };
    this.$get = ['$log', '$window', 'stacktraceService', '$injector',
        function( $log, $window, stacktraceService, $injector) {
            function log( exception, cause ) {
                $log.error.apply( $log, arguments );
                try {
                    var errorMessage = exception.toString();
                    var stackTrace = stacktraceService.print({ e: exception });
                    if (timer) {
                        $window.clearTimeout(timer);
                        timer = undefined;
                    }
                    if (ajaxPost) {
                        ajax({
                            url: postUrl,
                            data: angular.toJson({
                                errorUrl: $window.location.href,
                                errorMessage: errorMessage,
                                stackTrace: stackTrace,
                                userAgent: navigator.userAgent,
                                cause: ( cause || "" )
                            }),
                            success: function() {
                                if (successCallbackName) {
                                    try {
                                        var callback = $injector.get(successCallbackName);
                                        callback.apply(callback, arguments);
                                    } catch (e) {
                                        $log.error("Error calling callback", e);
                                    }
                                }
                            },
                            error: function(response) {
                                $log.warn("Error logging failed");
                                $log.log(response);
                            }
                        });
                    }
                    if (debounceTime) {
                        ajaxPost = false;
                        if (!timer) {
                            timer = $window.setTimeout(function() {
                                ajaxPost = true;
                            }, debounceTime);
                        }
                    }

                } catch ( loggingError ) {
                    $log.warn("Error logging failed");
                    $log.log(loggingError);
                }
            }
            return log;
        }];
});
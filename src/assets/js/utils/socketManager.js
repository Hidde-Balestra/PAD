var socket;


var globalLocation =    location.hostname === "localhost"
                        ? `http://${location.hostname}:${serverPort}`
                        : `https://${location.hostname}`
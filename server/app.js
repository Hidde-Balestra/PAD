/**
 * Server application - contains all server config and api endpoints
 *
 * @author Pim Meijer & Casper Sluitman & Hidde Balestra
 */
const express = require("express");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const db = require("./utils/databaseHelper");
const cryptoHelper = require("./utils/cryptoHelper");
const corsConfig = require("./utils/corsConfigHelper");
const app = express();
const fileUpload = require("express-fileupload");
const chat = require("./chat");
const sessions = require("./sessions");
const path = require('path');
const cookieParser = require('cookie-parser'); // remove this one if possible
const cookie = require('cookie');
const WebSocket = require('ws');


//logger lib  - 'short' is basic logging info
// app.use(morgan("short"));

//init mysql connectionpool
const connectionPool = db.init();

//parsing request bodies from json to javascript objects
app.use(bodyParser.urlencoded({extended: false,limit:'50mb'}));
app.use(bodyParser.json());
//app.use(express.bodyParser({limit: '50mb'}));
//CORS config - Cross Origin Requests
app.use(corsConfig);

//File uploads
app.use(fileUpload());

//Cookies
app.use(cookieParser());

// ------ ROUTES - add all api endpoints here ------
const httpOkCode = 200;
const badRequestCode = 400;
const authorizationErrCode = 401;

app.get("*", (req, res) => {
    let protected = ["/views/chat.html"];

    // you'll run into a bunch of exceptions if the client doesn't have a cookie,
    // so for simplicity's sake we're just going to give a temp one

    res.cookie("temp", 0);

    if (protected.includes(req.url) && !sessions.exists(req.cookies.token)) {
        res.status(authorizationErrCode).send("You do not belong here, please login first.");
    }
    else {
        res.sendFile(path.join(__dirname, "..", "src", req.url));
    }
});

app.post("/user/hasAuth", (req, res) => {
    res.send({hasAuth: sessions.exists(req.cookies.token)});
});

app.post("/user/login", (req, res) => {

    const username = req.body.usernameOrEmail;
    const password = req.body.password;

    db.handleQuery(connectionPool, {
        query: "SELECT id, username, email, password FROM user WHERE (username = ? OR email = ?) AND password = ?",
        values: [username, username, password]
    }, (data) => {
        if (data.length === 1) {
            res.cookie("token", sessions.create(data[0].id), {httpOnly: true});
            res.status(httpOkCode).json({});
        } else {
            //wrong username
            res.cookie("notworking", "failed");
            res.status(authorizationErrCode).json({reason: "Wrong username or password"});
        }

    }, (err) => res.status(badRequestCode).json({reason: err}));
});

app.post("/user/logout", (req, res) => {
    sessions.clear(req.cookies.token);
    res.clearCookie("token").send({});
});

app.post("/user/id", (req, res) => {

    db.handleQuery(connectionPool, {
            query: "SELECT id, firstname, lastname, username, email FROM user WHERE id = ?",
            values: [sessions.getId(req.cookies.token)]
        }, (data) => {
            res.send(data);
        }, (err) => res.status(badRequestCode).json({reason: err})
    );
});


app.post("/user/registration", (req, res) => {

    db.handleQuery(connectionPool, {
            query: "INSERT INTO user(username, firstname, lastname, email, password) VALUES (?, ?, ?, ?, ?)",
            values: [req.body.username, req.body.firstname, req.body.lastname, req.body.email, req.body.password]
        }, (data) => {
            if (data.insertId) {
                res.cookie("token", sessions.create(data.insertId), {httpOnly: true});
                res.status(httpOkCode).json({id: data.insertId});
            } else {
                res.status(badRequestCode).json({reason: "Something went wrong, please try again"})
            }

        }, (err) => res.status(badRequestCode).json({reason: err})
    );
});

// @TODO implement friends :(
app.post("/user/friends", (req, res) => {
    let user = sessions.getId(req.cookies.token);
    let onlineList = chat.getOnlineUsers();
    onlineList.splice(onlineList.indexOf(user), 1);
onlineList = onlineList.join(",");
    if (onlineList.length > 0){
        db.handleQuery(connectionPool, {
                query: `SELECT firstname, lastname, id FROM user WHERE ID IN (${onlineList})`,
                // not sure why, but this doesn't work if you put the list in the value array,
                // perhaps it interprets onlineList as an array somewhere down the line
                // either way, SQL-injection shouldn't really be a problem here!
                values: []
            }, (data) => {
                res.send(data);
            }, (err) => res.status(badRequestCode).json({reason: err})
        );
    } else{
        res.status(badRequestCode).json({reason: "Nobody online"});
    }
});
app.post("/user/offline", (req, res) => {
    chat.clearSession(req.body.myID);
});

app.post("/user/getToID", (req, res) => {
        db.handleQuery(connectionPool, {
                query: `SELECT * FROM friendlist WHERE userID1 = ? OR userID2 = ?`,
                values: [req.body.from, req.body.from]
            }, (data) => {
                res.send(data);
            }, (err) => res.status(badRequestCode).json({reason: err})
        );
});


app.post("/user/loadFriendlist", (req, res) => {

    db.handleQuery(connectionPool, {
            query: `SELECT (friendlist.userID1 + friendlist.userID2 - ?) AS id, user.firstname, user.lastname FROM friendlist INNER JOIN user ON user.id = (friendlist.userID1 + friendlist.userID2 - ?);`,
            values: [req.body.from, req.body.from]
        }, (data) => {
            res.send(data);
        }, (err) => res.status(badRequestCode).json({reason: err})
    );
});

app.post("/user/saveFriendlist", (req, res) => {
        db.handleQuery(connectionPool, {
                query: `INSERT INTO friendlist(userID1, userID2) VALUES (?, ?)`,
                values: [req.body.from, req.body.to]
            }, (data) => {
                res.send(data);
            }, (err) => res.status(badRequestCode).json({reason: err})
        );
});

app.post("/user/list", (req, res) => {
    let getUserByValue = req.body.userByValue;
        db.handleQuery(connectionPool, {
                query: "SELECT id ,firstname, lastname FROM user WHERE firstname LIKE ? OR lastname LIKE ?",
                values: [getUserByValue+"%", getUserByValue+"%"]
            }, (data) => {
                res.send(data);
            }, (err) => res.status(badRequestCode).json({reason: err})
        );
});

app.post("/user/befriend", (req, res) => {

    let auth = cookie.parse(req.headers.cookie).token;

    if (sessions.exists(auth)) {

        let values = [sessions.getId(auth), req.body.to];
        if (parseInt(values[0]) > parseInt(values[1])) {
            values = [values[1], values[0]];
        }

        db.handleQuery(connectionPool, {
                query: `INSERT INTO friendlist(userID1, userID2) VALUES (?, ?)`,
                values: values
            }, (data) => {
                res.send(data);
            }, (err) => res.status(badRequestCode).json({reason: err})
        );
    }
    else {
        res.status(badRequestCode).json({reason: "no auth"});
    }
});


//chat
app.post("/chat/createroom", (req, res) => {
    db.handleQuery(connectionPool, {
            query: "INSERT INTO chatroom(senderID, receiverID, subjectTitle, datetime) VALUES (?, ?, ?, ?)",
            values: [req.body.senderID, req.body.receiverID, req.body.subjectTitle, req.body.datetime]
        }, (data) => {
            res.send(data);
        }, (err) => res.status(badRequestCode).json({reason: err})
    );
});

app.post("/chat/renameSubject", (req, res) => {
    db.handleQuery(connectionPool, {
            query: "UPDATE chatroom SET subjectTitle = ? WHERE ID = ?",
            values: [req.body.name, req.body.chatroomID]
        }, (data) => {
            res.send(data);
        }, (err) => res.status(badRequestCode).json({reason: err})
    );
});

app.post("/chat/loadroom", (req, res) => {
    db.handleQuery(connectionPool, {
            query: "SELECT * FROM chatroom WHERE senderID = ? AND receiverID = ? OR senderID = ? AND receiverID = ?",
            values: [req.body.senderID, req.body.receiverID, req.body.receiverID, req.body.senderID]
        }, (data) => {
            res.send(data);
        }, (err) => res.status(badRequestCode).json({reason: err})
    );
});

app.post("/chat/savemessage", (req, res) => {
    db.handleQuery(connectionPool, {
            query: "INSERT INTO chatmessage(chatroomID, senderID, message, datetime) VALUES (?, ?, ?, ?)",
            values: [req.body.chatroomID, req.body.senderID, req.body.message, req.body.datetime]
        }, (data) => {
            res.send(data);
        }, (err) => res.status(badRequestCode).json({reason: err})
    );
});

// test voor profilepage tijdelijke
app.get("/user/userInfo", ((req, res) => {
    let auth = cookie.parse(req.headers.cookie).token;
console.log(sessions.getId(auth))
    db.handleQuery(connectionPool, {
            query:"SELECT id, firstname, lastname, username, email FROM user WHERE id = ? ",
            values: [sessions.getId(auth)]
        }, (data) => {
            console.log(data);
            res.status(httpOkCode).json(data);
        }, (err) => res.status(badRequestCode).json({reason: err} )
    );

}));
app.post("/chat/loadmessage", (req, res) => {
    db.handleQuery(connectionPool, {
            query: "SELECT * FROM chatmessage WHERE chatroomID = ?",
            values: [req.body.chatroomID]
        }, (data) => {
            res.send(data);
        }, (err) => res.status(badRequestCode).json({reason: err})
    );
});
app.post('/chat/upload', function(req, res) {let sampleFile;
    let uploadPath;

    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
    }

    // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
    sampleFile = req.files.uploadFiles;

    let fileExtension = sampleFile.name.match(/\.[0-9a-z]+$/i)[0];
    uploadPath = path.join(__dirname, "..", "src", "files", sampleFile.md5 + fileExtension);

    // Use the mv() method to place the file somewhere on your server
    sampleFile.mv(uploadPath, err => {
        if (err) {
            return res.status(500).send(err);
        }
        else {
            res.send({url: sampleFile.md5 + fileExtension, name: sampleFile.name});
        }

        // res.send('<body onload="script(alert);"><a href="http://localhost:3000/index.html" onclick="myFunction(console.log("lol"))" class="button">back to chat</a>' +
        //     {url:uploadPath});
    });
});


//------- END ROUTES -------

function listen(port, callback) {
    const server = app.listen(port, callback);
    initialiseWebSocket(port, server);
}

function initialiseWebSocket(port, server) {
    const wss = new WebSocket.Server({ server: server });

	wss.on("connection", (ws, req) => {
	    try {
            let auth = cookie.parse(req.headers.cookie).token;

            if (sessions.exists(auth)) {
                let id = sessions.getId(auth);
                chat.connectionHandler(ws, id);
                ws.onmessage = message => chat.getSession(ws).messageHandler(message, id);
            } else {
                console.log("Someone tried to initialise a connection with an unknown token.");
                ws.close();
            }
        }
        catch(e) {
            ws.close()
        }
	});
}




module.exports = {
    listen: listen,
};

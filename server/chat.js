/**
 * Contains all interaction with the chat sockets
 *
 * @author Casper Sluitman
 */
const email = require("./utils/email");
const sessions = new Map();
const onlineUsers = new Map();
console.log(onlineUsers)

class ChatSession {

    constructor(userID) {
        this.userID = userID;
    }


    messageHandler(message, id) {

        message = JSON.parse(message.data);

        try {

            if (message.type === "PING") {
                console.log("Received ping from", id);
                onlineUsers.get(id).send("PONG");
            }

            if (onlineUsers.has(message.to)) {
                onlineUsers.get(message.to).send(JSON.stringify(message));
            }
            else {
                email.notify(message.to);
            }
        }
        catch {
            console.log(`${id}: ${message.data}`);
        }
    }
}

function connectionHandler(connection, userID) {
    sessions.set(connection, new ChatSession(userID));
    onlineUsers.set(userID, connection);
}

function getSession(ws) {
    return sessions.get(ws);
}

function clearSession(userID, ws) {
    sessions.delete(ws);
    onlineUsers.delete(userID);
}

function getOnlineUsers() {
    return Array.from(onlineUsers.keys());
}

module.exports = {
    connectionHandler,
    getSession,
    clearSession,
    getOnlineUsers,
};

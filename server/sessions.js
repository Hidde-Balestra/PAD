/**
 * Securely manage sessions via HTTP-only cookies and auth-tokens
 *
 * @author Casper Sluitman
 */

const cryptoHelper = require("./utils/cryptoHelper");

let sessions = new Map();

function createSession(userID) {

    let token = cryptoHelper.generateAuthToken(); // TODO: check for uniqueness
    sessions.set(token, userID);
    return token;
}

function getIdBySession(token) {
    return sessions.get(token);
}

function sessionExists(token) {
    return sessions.has(token);
}

function clearSession(token) {
    sessions.delete(token);
}

module.exports = {
    create: createSession,
    exists: sessionExists,
    getId: getIdBySession,
    clear: clearSession
};
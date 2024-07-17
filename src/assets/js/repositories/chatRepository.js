/**
 * @author Hidde Balestra
 */

class ChatRepository {
    constructor() {
        this.route = "/chat"
    }

    async createChatroom(senderID, receiverID, subjectTitle, datetime) {
        return await networkManager
            .doRequest(`${this.route}/createroom`, {senderID: senderID, receiverID: receiverID, subjectTitle: subjectTitle, datetime: datetime});
    }
    async renameSubject(chatroomID, name) {
        return await networkManager
            .doRequest(`${this.route}/renameSubject`, {chatroomID: chatroomID, name: name});
    }
    async loadChatroom(senderID, receiverID) {
        return await networkManager
            .doRequest(`${this.route}/loadroom`, {senderID: senderID, receiverID: receiverID});
    }

    async saveChatMessage(chatroomID, senderID,message, datetime) {
        return await networkManager
            .doRequest(`${this.route}/savemessage`, {chatroomID: chatroomID, senderID: senderID, message: message, datetime: datetime});
    }
    async loadChatMessage(chatroomID) {
        return await networkManager
            .doRequest(`${this.route}/loadmessage`, {chatroomID: chatroomID});
    }
    async uploadFile(file){
        return await networkManager
            .doRequest(`${this.route}/upload`, {file:file});
    }
}

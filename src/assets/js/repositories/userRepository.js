/**
 * Concerns itself with user accounts and sessions.
 *
 * @author Pim Meijer & Kirill Janssen & Casper Sluitman
 */

class UserRepository {
    constructor() {
        this.route = "/user"
    }

    async create(username ,firstname, lastname, email, password) {
        return await networkManager
            .doRequest(`${this.route}/registration`, {username:username, firstname: firstname, lastname: lastname, email: email, password: password});
    }

    async login(usernameOrEmail, password) {
        return await networkManager.doRequest(`${this.route}/login`, {usernameOrEmail: usernameOrEmail, password: password});
    }

    async logout() {
        return await networkManager.doRequest(`${this.route}/logout`, {});
    }

    async status() {
        return await networkManager.doRequest(`${this.route}/hasAuth`, {});
    }

    // TODO: this should be rewritten to a friends function
    async getAll() {
        return await networkManager.doRequest(`${this.route}/friends`, {});
    }

    async removeSession(myID) {
        return await networkManager.doRequest(`${this.route}/offline`, {myID: myID});
    }

    async getListByValue(userByValue) {
        return await networkManager.doRequest(`${this.route}/list`, {"userByValue": userByValue});
    }

    async whoAmI() {
        return await networkManager.doRequest(`${this.route}/id`, {})
    }
    async getToID(from) {
        return await networkManager.doRequest(`${this.route}/getToID`, {from: from})
    }
    async loadFriendlist(from, to) {
        return await networkManager.doRequest(`${this.route}/loadFriendlist`, {from: from, to: to})
    }
    async saveFriendlist(from, to) {
        return await this.befriend(to);
    }
    async befriend(to) {
        return await networkManager.doRequest(`${this.route}/befriend`, {to: to})
    }
    async getUserInfo(){
        return await networkManager.doRequest(`${this.route}/userInfo`)
    }
}



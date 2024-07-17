const db = require("./databaseHelper");
const connectionPool = db.init();

function profileData(userID){
    db.handleQuery(connectionPool, {
        query: "SELECT username, firstname, lastname, email FROM user WHERE id = ?",
        values: [userID]
    }, (data) => {
    });
    return profileData(userID);
    console.log(userID)
}
console.log()
module.exports = {
    profileData
};
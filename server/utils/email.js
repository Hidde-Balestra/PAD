const nodemailer = require("nodemailer");
const app = require('../app')
const db = require("./databaseHelper");
const connectionPool = db.init();


const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'PadUnity@gmail.com',
        pass: 'Welkom123@'
    }
});


function notify(id) {

    db.handleQuery(connectionPool, {
        query: "SELECT email FROM user WHERE id = ?",
        values: [id]
    }, (data) => {

        if (!data[0]) return;

        let mailOptions = {
            from: 'PadUnity@gmail.com',
            to: data[0].email,
            subject: 'Sending Email using Node.js',
            text: 'started a chat with you',
        };


        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
                return;
            } else {
                console.log('Email sent: ' + info.response);
            }
        });
    });
}

module.exports = {
    notify
};

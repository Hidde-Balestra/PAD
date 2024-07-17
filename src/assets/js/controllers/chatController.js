/**
 * Responsible for the chat front-end
 *
 * @author Casper Sluitman, Hidde Balestra
 */

var currentChat;
let myID;
let chatroomID;
let currentVoiceChat;

class MessagePacket {
    constructor(type, to, content, from) {
        this.type = type;
        this.to = to;
        this.content = content;
        this.from = from;
    }
}

class Chat {

    constructor(peer, from) {
        this.from = from;
        this.peer = peer;
        socket.onmessage = message => this.handler(message);
    }

    handler(message) {
        let messageObject = JSON.parse(message.data);
        let messageHandler = console.log;

        console.log(messageObject);

        if (messageObject.from !== undefined && messageObject.type === "OFFER") {
            let from = messageObject.from[0];
            $("#caller").html(`${from.firstname} ${from.lastname}`);
            this.peer = from.id;
        }

        switch (messageObject.type) {
            case "CHAT": messageHandler = this.display; break;
            case "OFFER": messageHandler = this.answer; break;
            case "ANSWER": messageHandler = this.accept; break;
            case "REJECT": messageHandler = this.cancel; break;
            case "IMAGE": messageHandler = this.image; break;
            case "CLOSE": messageHandler = this.cancel; break;
            case "FILE": messageHandler = this.file; break;
            default: console.error("Invalid message type.");
        }

        messageHandler(messageObject.content);
    }

    send(type, content, from) {
        let tzoffset = (new Date()).getTimezoneOffset() * 60000;
        let date = (new Date(Date.now() - tzoffset)).toISOString().slice(0, -1);

        type = type.toString().toUpperCase();
        content = content ? content.toString() : "";

        if (this.peer.toString() === "-1"){
            if (type === "OFFER"){
                this.cancel();
            }
            return;
        }
        if (content.length < 1){
            return;
        }

        if (type === "CHAT" || type === "IMAGE") {
            new Chatroom(this.peer, this.from, content, date, "save");
            this.display(content, true, type === "IMAGE", date);
        }

        let packet = new MessagePacket(type, parseInt(this.peer), content, from);
        socket.send(JSON.stringify(packet));

        console.log(packet)
    }
//     file(content){
//         currentChat.display(`<a href="`+content+`"  download>
//   <img src="`+content+`" alt="W3Schools">
// </a> `)
//     }
    file(){
        currentChat.display(`<a href='assets/img/avatars/female-1.jpeg'  download>
  <img src='assets/img/avatars/female-1.jpeg' >
</a> `);
    }

    image(content) {
        currentChat.display(`<img class="imageDisplay" src=${JSON.parse(content)}>`);
    }

    display(message, isMine, image, date) {

        if (message.replaceAll) {
            message = message.replaceAll("<p><br></p>", "");
        }

        let img = image ? `<img class="imageDisplay" src=${JSON.parse(message)}>` : "";

        const now = new Date(Date.now());
        if (date == undefined){
            const tzoffset = (new Date()).getTimezoneOffset() * 60000;
            date = (new Date(Date.now() - tzoffset)).toISOString().slice(0, -1);
        }
        date = date.replace('.000Z', '');
        let d = new Date(date);

        console.log(d.toDateString() + " + " + now.toDateString())
        if (d.toDateString() === now.toDateString()){
            d = d.toLocaleTimeString('nl-NL', {hour: 'numeric', minute: 'numeric'});
        } else {
            d = d.toLocaleDateString('nl-NL', {year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric'});
        }

        $(".messages").append(
            `<div class="messages-container ${isMine ? "messages-container-sender" : ""}">
                <span class="time">${d}</span>
                ${message}
            </div>`
        );

        $(".messages").animate({ scrollTop: 99999999 }, 0);
    }

    call() {
        if (currentVoiceChat !== undefined) {
            currentVoiceChat.rtc.close();
            location.reload();
        }
        currentVoiceChat = new VideoChat();
        currentVoiceChat.call();
    }

    answer(offer) {

        if (currentVoiceChat !== undefined) {
            if (currentVoiceChat.calling) return;
        }

        $("#call-notification-container").css("display", "block");
        $("#call-notification").off().on("click", () => {
            $("#call-notification-container").css("display", "none");
            if (currentVoiceChat !== undefined) {
                currentVoiceChat.rtc.close();
                location.reload();
            }
            currentVoiceChat = new VideoChat();
            currentVoiceChat.answer(offer);
        });

        $("#call-reject").off().on("click", () => {
            $("#call-notification-container").css("display", "none");
            currentChat.send("REJECT")
        });
    }

    accept(answer) {
        currentVoiceChat.accept(answer);
    }

    cancel() {
        if (currentVoiceChat !== undefined) {
            currentVoiceChat.rtc.close();
            location.reload();
        }
        $("#call").css("display", "none");
    }
}

class VideoChat {
    constructor() {

        this.calling = false;
        this.iceGatheringTimeout = 2500;
        this.rtc = new RTCPeerConnection({'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}]});
        this.remoteStream = new MediaStream();
        this.localStream = new MediaStream();

        this.rtc.ontrack = remote => {
            this.remoteStream.addTrack(remote.track);
            let player = $("#remote-player")[0];
            player.srcObject = this.remoteStream;
            player.play();
        }

        window.scrollTo({top: 0, behavior: 'smooth'});
        $("#call").css("display", "flex");
    }

    requestMedia() {
        return new Promise(resolve => {
            navigator.mediaDevices.getUserMedia({video: true, audio: true}).then(
                stream => {
                    stream.getTracks().forEach(track => this.rtc.addTrack(track));
                    this.localStream.addTrack(stream.getVideoTracks()[0]);
                    resolve();
                }
            )
        })
    }

    setupRTC(type) {

        let iceTimout;

        this.rtc.onicecandidate = () => {
            if (this.rtc.iceGatheringState === "complete") {
                sendSDP(JSON.stringify(this.rtc.localDescription));
            }
            iceTimout = setTimeout(() =>
                sendSDP(JSON.stringify(this.rtc.localDescription)), this.iceGatheringTimeout);
        };

        let player = $("#local-player")[0];
        player.srcObject = this.localStream;
        player.play();

        function sendSDP(sdp) {
            clearTimeout(iceTimout);
            userRepository.whoAmI().then(me => {
                currentChat.send(type, sdp, me);
            })
        }
    }

    call() {
        this.calling = true;
        this.requestMedia().then(() => {
            this.setupRTC("OFFER");
            this.rtc.createOffer().then(offer => this.rtc.setLocalDescription(offer));
        });
    }

    answer(offer) {
        this.calling = true;
        this.requestMedia().then(() => {
            this.setupRTC("ANSWER");

            this.rtc.setRemoteDescription(JSON.parse(offer)).then(() => {
                this.rtc.createAnswer().then(answer => this.rtc.setLocalDescription(answer));
            });
        });
    }

    accept(answer) {
        this.rtc.setRemoteDescription(JSON.parse(answer));
    }

    close() {
        this.rtc.close();
        location.reload();
    }
}

class Contact {
    constructor(id, firstname, lastname, matches) {
        this.dom(id, firstname, lastname, matches);
    }

    dom(id, firstname, lastname, matches) {

        let entry = "#" + id;
        let status = "Offline";

        $(entry).remove();

        userRepository.getAll().then(onlineusers => {
            onlineusers.forEach(onlineuser =>{
                if (onlineuser.id == id){
                    console.log(onlineuser)
                    status = "Online";
                    $("#"+id+" .status").html(status);
                }
            })
        })

        $(".user-selection").append(
            `<div class='addedUser ${matches ? "" : "filtered"}' id='${id}'>
                <img src='assets/img/avatars/female-1.jpeg' width="10%">
                    <div class='status'>${status}</div>
                    <div class='firstName'><label>${firstname}</label></div>
                    <div class='lastName'><label>${lastname}</label></div>
                    <div class='description'><label>lorum ipsum...</label></div>
            </div>`
        );

        $(entry).on("click", () => {
            $(".white-section").show();
            $(".messages div").remove();
            $(".addedUser").removeClass("active");
            $("#" + id).addClass("active");
            currentChat = new Chat(id, myID);
            new Chatroom(myID, id);
            if ($(window).width() < 768) {
                $(".user-selection").hide();
            }
        });
    }
}

class SearchResult {
    constructor(id, firstname, lastname) {
        this.dom(id, firstname, lastname);
    }

    dom(id, firstname, lastname) {
        $(".result-list").append(
            `<div class='addedUser' id='search${id}'>
                <img src='assets/img/avatars/female-1.jpeg' width="10%">
                    <div class='timeTextSend'>16:07</div>
                    <div class='firstName'><label>${firstname}</label></div>
                    <div class='lastName'><label>${lastname}</label></div>
                    <div class='description'><label>Lorem Ipsum</label></div>
            </div>`
        );

        $("#search" + id).on("click", () => {
            new Contact(id, firstname, lastname);
            new friendlist(myID, id);
            $(".result-list").hide();
        });
    }
}

class Chatroom {
    constructor(senderID, receiverID, message, date, goal) {
        if (message == undefined){
            this.loadChatroom(senderID, receiverID);
            this.loadChatMassage(senderID, receiverID);
        } else {
            if (goal == "save"){
                this.saveChatMassage(senderID, receiverID, message, date);
            }
        }
    }

    loadChatroom(senderID, receiverID){
        try {
            chatRepository.loadChatroom(senderID, receiverID).then(chatrooms => {
                if(chatrooms.toString() == ""){
                    this.createChatroom(senderID, receiverID, "Unnamed");
                    return
                }
                chatrooms.forEach(chatroom => {
                    chatroomID = chatroom.ID;
                    let dbDate = chatroom.datetime.replace('T', ' ');
                    dbDate = dbDate.replace('.000Z', '');
                    this.dom(chatroom.subjectTitle, dbDate);
                });
            });
        } catch (e) {
            console.log(e);
        }
    }

    createChatroom(senderID, receiverID, subjectTitle){
        let tzoffset = (new Date()).getTimezoneOffset() * 60000;
        let date = (new Date(Date.now() - tzoffset)).toISOString().slice(0, -1);

        chatRepository.createChatroom(senderID, receiverID, subjectTitle, date);
        let dbDate = chatroom.datetime.replace('T', ' ');
        dbDate = dbDate.replace('.000Z', '');
        this.dom(subjectTitle, dbDate);
    }

    saveChatMassage(senderID, receiverID, message, date){
        let chatroomID = -1;
        chatRepository.loadChatroom(senderID, receiverID).then(chatrooms => {
            chatrooms.forEach(chatroom => {
                chatroomID = chatroom.ID;
            });

            if (chatroomID == -1){
                alert("ERROR")
                return;
            }

            chatRepository.saveChatMessage(chatroomID, receiverID, message, date);
        });
    }

    loadChatMassage(senderID, receiverID) {
        let chatroomID = -1;
        chatRepository.loadChatroom(senderID, receiverID).then(chatrooms => {
            chatrooms.forEach(chatroom => {
                chatroomID = chatroom.ID;
            });
            if (chatroomID == -1){
                return;
            }
            chatRepository.loadChatMessage(chatroomID, senderID).then(messages => {
                messages.forEach(message => {
                    currentChat.display(message.message, message.senderID == senderID, null, message.datetime);
                });
            });
        });
    }

    dom(subjectTitle, datetime) {
        $(".title-bar .subject-title").html(`${subjectTitle}`);
        $(".title-bar .date").html(`${datetime}`);
    }
}

class friendlist{
    constructor(from, to, filter) {
        this.loadFriendlist(from, to, filter);
    }

    loadFriendlist(from, to, filter){
        let toID = -1;
        userRepository.getToID(from).then(users => {
            if (users.toString() == "") {
                this.saveFriendlist(from, to);
                return
            }
            users.forEach(user =>{
                if (myID == user.userID2){
                    toID = user.userID1;
                } else {
                    toID = user.userID1;
                }
            })
            if (toID == -1){
                alert("ERROR 404: friend not found");
            }

            userRepository.loadFriendlist(from, toID).then(friends => {
                console.log(friends);
                friends.forEach(friend => {

                    let matches = false;

                    if (filter !== undefined) {
                        [friend.firstname, friend.lastname].forEach(
                            query => {
                                if (new RegExp(`.*${filter.toLowerCase()}.*`).test(query.toLowerCase())) {
                                    matches = true;
                                }
                            }
                        )
                    }

                    new Contact(friend.id, friend.firstname, friend.lastname, matches);
                });
            });
        })
    }

    saveFriendlist(from, to){
        userRepository.saveFriendlist(from, to);
    }
}

class ChatController {

    constructor() {

        if (socket === undefined) {
            socket = new WebSocket(location.hostname === "localhost"
                ? `ws://${location.hostname}:${serverPort}/ws`
                : `wss://${location.hostname}/api/ws`);
        }

        $.get("views/chat.html")
            .done((data) => this.setup(data))
            .fail(() => this.error());
        $("#notif-badge").css("display", "none");
    }

    //Called when the chat.html has been loaded
    setup(data) {
        //Load the chat-content into memory
        currentChat = new Chat(-1);
        this.view = $(data);
        socket.onmessage = console.log;
        userRepository.whoAmI().then(user => {
            myID = user[0].id
            new friendlist(myID, undefined, "");
        });

        //No need for the notification badge
        $("#item-chat").removeClass("notification")

        //Empty the content-div and add the resulting view to the page
        $(".content").empty().append(this.view);

        //Events
        $(document).on("keydown", event => {
            if(event.which === 13 && !event.shiftKey) {
                let html = /<[^>]*>/gm;
                let inside = quill.root.innerHTML.replace(html, "").trim();
                console.log(inside);
                if (inside) {
                    currentChat.send("CHAT", quill.root.innerHTML);
                }
                quill.root.innerHTML = "";
            }
        });

        $(".subject-title").on("click", () => {
            $(".change-subject-title-field").val($(".subject-title").text());
            $(".subject-title").hide();
            $(".change-subject-title").show();
        });

        $(".change-subject-title-button").on("click", () => {
            this.renameSubject($(".change-subject-title-field").val());
            $(".subject-title").text($(".change-subject-title-field").val())
            $(".subject-title").show();
            $(".change-subject-title").hide();
        });

        $(".send-VideoCamera-button").on("click", () => {
            currentChat.call();
        });

        // search-field on key up find user in the database with a value.
        let searchField = $(".search-field");
        let resultList = $(".result-list");

        searchField.on("keyup", () =>{
            new friendlist(myID, undefined, searchField.val());
        });

        //on mobile the back button is pressed
        $(".mobileBackButton").on("click", () => {
            $(".user-selection").show();
            $(".white-section").hide();
        });
        window.onresize = function(event) {
            if ($(window).width() < 768) {
                $(".white-section").hide();
            } else {
                $(".user-selection").show();
                if (currentChat.peer != -1){
                    $(".white-section").show();
                }
            }
        };

        // removes session and online status if user goes offline
        window.onbeforeunload = function(){ userRepository.removeSession(myID); };

        // let fileUpload = $("#file-input");
        // fileUpload.on("change", () => {
        //     let fileReader = new FileReader();
        //     fileReader.readAsDataURL(fileUpload.prop('files')[0]);
        //     fileReader.onload = () => {
        //         let imageString = JSON.stringify(fileReader.result);
        //         currentChat.send("IMAGE", imageString);
        //     }
        // });

        $("#hang-up").on("click", () => {
            $("#hang-up").css("display", "none");
            if (currentVoiceChat !== undefined) {
                currentVoiceChat.close();
            }
            app.loadController("chat");
        });
    }

    updateUserByValue(getUserByValue) {
        $(".result-list").empty();
        userRepository.getListByValue(getUserByValue).then(users => {
            users.forEach(user => {
                if(myID == user.id){
                    return;
                }
                new SearchResult(user.id, user.firstname, user.lastname);
            });
        });
    }

    renameSubject(name) {
        chatRepository.renameSubject(chatroomID, name);
    }
}

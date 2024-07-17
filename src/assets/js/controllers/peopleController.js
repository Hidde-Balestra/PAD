/**
 * Responsible for displaying a list of all users.
 *
 * @author Casper Sluitman
 */

class PeopleController {
    constructor() {
        $.get("views/people.html")
            .done((data) => this.setup(data))
            .fail(() => this.error());
    }

    //Called when the welcome.html has been loaded
    setup(data) {
        //Load the welcome-content into memory
        this.peopleView = $(data);

        //Empty the content-div and add the resulting view to the page
        $("#overlaid").css("display", "block").empty().append(this.peopleView).on("click", event => {
            if ($(event.target).attr('id') === "overlaid") {
                app.loadController("chat");
                $("#overlaid").css("display", "none");
            }
        });

        this.loadPeople("");

        let searchField = $(".users-search-field");

        searchField.on("keyup change", () =>{
            this.loadPeople(searchField.val());
        });
    }

    //Called when the login.html fails to load
    error() {
        $(".content").html("Failed to load content!");
    }

    loadPeople(filter) {
        console.log(filter)
        $("#people-list").empty();
        userRepository.getListByValue(filter).then(users => {


            userRepository.loadFriendlist

            users.forEach(user => {
                if(myID == user.id){
                    return;
                }
                new Person(user.id, user.firstname, user.lastname);
            });
        });
    }
}

class Person {
    constructor(id, firstname, lastname) {
        this.dom(id, firstname, lastname);
    }

    dom(id, firstname, lastname) {
        $("#people-list").append(
            `<div class='addedUser addedUserSearch' id='search${id}'>
                <img src='assets/img/avatars/female-1.jpeg'>
                    <div class='firstName'><label>${firstname}</label></div>
                    <div class='lastName'><label>${lastname}</label></div>
                    <div class='description'><label>Lorem Ipsum</label></div>
            </div>`
        );

        let btn = $(`#search${id}`);

        btn.on("click", () => {
            userRepository.befriend(id);
            btn.hide();
            app.loadController("chat");
            $("#overlaid").css("display", "none");
        })
    }
}
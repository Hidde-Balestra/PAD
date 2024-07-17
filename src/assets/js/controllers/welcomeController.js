/**
 * Responsible for handling the actions happening on welcome view
 * For now it uses the roomExampleRepository to get some example data from server
 *
 * @author Lennard Fonteijn & Pim Meijer
 */
class WelcomeController {
    constructor() {
        $.get("views/welcome.html")
            .done((data) => this.setup(data))
            .fail(() => this.error());
    }

    //Called when the welcome.html has been loaded
    setup(data) {
        //Load the welcome-content into memory
        this.welcomeView = $(data);

        //Empty the content-div and add the resulting view to the page
        $(".content").empty().append(this.welcomeView);

        //We would like to receive chat notifications on this page
        socket.onmessage = () => $("#notif-badge").css("display", "inline-block");
    }

    //Called when the login.html fails to load
    error() {
        $(".content").html("Failed to load content!");
    }
}
/**
 * RegistrationController is responsible for all Registration related actions
 * @author Kirill Janssen
 */
class RegistrationController {
    constructor() {
        $.get("views/registration.html")
            .done((htmlData) => this.setup(htmlData))
            .fail(() => this.error());
    }

    setup(htmlData) {

        this.registrationView = $(htmlData);

        $(".content").empty().append(this.registrationView);

        this.registrationView.find(".btn").on("click",
            (event) => this.onAddEvent(event));

        $("input").on("keyup input", event => {

            let target = $(event.target);

            if (target.val() !== "") {
                target.addClass("has-input");
            } else {
                target.removeClass("has-input");
            }
        });
    }

    async onAddEvent(event) {

        event.preventDefault();

        const firstname = this.registrationView.find("#inputFirstname").val();
        const lastname = this.registrationView.find("#inputLastname").val();
        const username = this.registrationView.find("#inputUsername").val();
        const email = this.registrationView.find("#inputEmail").val();
        const password = this.registrationView.find("#inputPassword").val();
        const passwordRepeat = this.registrationView.find("#inputPasswordRepeat").val();

        if (password !== passwordRepeat) {
            alert("The password fields do not correspond with each other");
        }else {

            try {
                const eventId = await userRepository.create(username, firstname, lastname, email, password);
                console.log(eventId);
                app.loadController(CONTROLLER_CHAT);
            } catch (e) {
                if (e.code === 401) {
                    this.registrationView
                        .find("error")
                        .html(e.reason);
                } else if (e.code === 400) {
                    alert("This username and/or email is already in use");
                } else {
                    console.log(e);
                }
            }
        }
    }

    error() {
        $(".content").html("Failed to load the navbar!");
    }
}

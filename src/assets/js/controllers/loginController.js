/**
 * Controller responsible for all events in view and setting data
 *
 * @author Pim Meijer
 */
class LoginController {

    constructor() {

        userRepository.status().then(res => {
            if (res.hasAuth) {
                app.loadController("chat");
            }
            else {
                $.get("views/login.html")
                    .done((data) => this.setup(data))
                    .fail(() => this.error());
            }
        });
    }

    //Called when the login.html has been loaded
    setup(data) {
        //Load the login-content into memory
        this.loginView = $(data);

        this.loginView.find(".login-form").on("submit", (e) => this.handleLogin(e));

        //Empty the content-div and add the resulting view to the page
        $(".content").empty().append(this.loginView);

        $("input").on("keyup input", event => {

            let target = $(event.target);

            if (target.val() !== "") {
                target.addClass("has-input");
            } else {
                target.removeClass("has-input");
            }
        });


    }

    /**
     * Async function that does a login request via repository
     * @param event
     */
    async handleLogin(event) {
        //prevent actual submit and page refresh
        event.preventDefault();

        //Find the username and password
        const username = this.loginView.find("[name='username']").val();
        const password = this.loginView.find("[name='password']").val();

        try{

            //await keyword 'stops' code until data is returned - can only be used in async function
            userRepository.login(username, password).then(() => app.loadController("chat"));

        } catch(e) {
            //if unauthorized error show error to user
            if(e.code === 401) {
                this.loginView
                    .find(".error")
                    .html(e.reason);
            } else {
                console.log(e);
            }
        }
    }

    //Called when the login.html failed to load
    error() {
        $(".content").html("Failed to load content!");
    }
}
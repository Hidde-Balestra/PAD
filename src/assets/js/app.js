/**
 * Entry point front end application - there is also an app.js for the backend (server folder)!
 *
 * Available: `sessionManager` or `networkManager` or `app.loadController(..)`
 *
 * You only want one instance of this class, therefor always use `app`.
 *
 * @author Lennard Fonteijn & Pim Meijer
 */
const CONTROLLER_SIDEBAR = "sidebar";
const CONTROLLER_LOGIN = "login";
const CONTROLLER_LOGOUT = "logout";
const CONTROLLER_WELCOME = "welcome";
const CONTROLLER_REGISTRATION = "registration";
const CONTROLLER_CHAT = "chat";
const CONTROLLER_PEOPLE = "people";
const CONTROLLER_PROFILE = "profile";

const networkManager = new NetworkManager();
const userRepository = new UserRepository();
const chatRepository = new ChatRepository();

class App {

    init() {
    }

    /**
     * Loads a controller
     * @param name - name of controller - see constants
     * @param controllerData - data to pass from one controller to another
     * @returns {boolean} - successful controller change
     */
    loadController(name, controllerData) {
        console.log("loadController: " + name);

        if (controllerData) {
            console.log(controllerData);
        } else {
            controllerData = {};
        }

        switch (name) {
            case CONTROLLER_SIDEBAR:
                // deprecated
                break;

            case CONTROLLER_WELCOME:
                new ChatController()
                break;

            case CONTROLLER_CHAT:
                new ChatController();
                break;

            case CONTROLLER_REGISTRATION:
                new RegistrationController();
                break;

            case CONTROLLER_LOGIN:
                new LoginController();
                break;

            case CONTROLLER_LOGOUT:
                new LogoutController();
                break;

            case CONTROLLER_PEOPLE:
                new PeopleController();
                break;

            case CONTROLLER_PROFILE:
                new ProfileController();
                break;
            default:
                return false;
        }

        return true;
    }
}

const app = new App();

//When the DOM is ready, kick off our application.
$(function () {
    app.init();
});

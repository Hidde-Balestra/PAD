/**
 * Responsible for ending the session.
 *
 * @author Casper Sluitman
 */

class LogoutController {
    constructor() {
        this.setup().then(() => window.location.reload());
    }

    async setup() {
        await userRepository.logout();
    }
}
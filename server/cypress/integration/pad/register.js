/**
 * Cypress test to validate the register functionality.
 *
 * @author Hidde Balestra
 */
describe("Register", function () {
    //Generate random strings for tesing data.
    const randMailAndUsername = Math.random().toString(16).substr(2, 8)
    const randName = Math.random().toString(16).substr(2, 8)
    const randLastName = Math.random().toString(16).substr(2, 8)

    //Run before each test in this context
    beforeEach(() => {
        //Go to the specified URL
        cy.visit("http://localhost:3000/index.html");
        cy.get("#switch").click();
    });

    //Test: Validate register form
    it("Valid register form", function() {
        cy.get("#inputFirstname").should("exist");
        cy.get("#inputLastname").should("exist");
        cy.get("#inputUsername").should("exist");
        cy.get("#inputEmail").should("exist");
        cy.get("#inputPassword").should("exist");
        cy.get("#inputPasswordRepeat").should("exist");
    });

    //Test: Successful register
    it("Successful register", function () {
        //Start a fake server
        cy.server();

        //Find all the fields and put in the data
        cy.get("#inputUsername").type(randMailAndUsername, {force: true});
        cy.get("#inputEmail").type(randMailAndUsername+"@gmail.com", {force: true});
        cy.get("#inputFirstname").type(randName, {force: true});
        cy.get("#inputLastname").type(randLastName, {force: true});
        cy.get("#inputPassword").type("qwerty123", {force: true});
        cy.get("#inputPasswordRepeat").type("qwerty123", {force: true});

        //Find the button to register user and click it.
        cy.get(".btn-primary").click();
    });
});

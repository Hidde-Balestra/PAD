/**
 * Cypress test to validate the chat functionality.
 *
 * @author Casper Sluitman
 */

const crypto = require("crypto");

describe("WebSocket", () => {

    it("Server is running", () => {
        cy.visit("localhost:3000/index.html");
    });

    it("Can't open WebSocket without token", () => {
        cy.request("POST", "localhost:3000/user/logout").then(
            () => {
                let testSocket = new WebSocket(`ws://localhost:3000/ws`);
                cy.wait(2000);
                try {
                    testSocket.send(JSON.stringify({type: "PING"}));
                } catch {}
                expect(testSocket.readyState).to.not.equal("OPEN");
            }
        );
    });

    it("Logs in", () => {
        cy.get("#exampleInputUsername").should("exist").type("cypress");
        cy.get("#exampleInputPassword").should("exist").type("cypress");
        cy.get("#buttonLogin").click();
    });

    let messageQueue = [];

    it("Ping websocket", () => {
        cy.wait(1000);
        cy.window().then(window => {
            window.socket.send(JSON.stringify({type: "PING"}));
            window.socket.onmessage = message => messageQueue.push(message);
        });
    });

    it("Received pong", () => {
        if (messageQueue[messageQueue.length - 1].data !== "PONG") {
            throw "no pong";
        }
    });
});

describe("Chat", () => {

    let message = crypto.randomBytes(3).toString("hex");

    it("Loaded the chat UI", () => {
        cy.get(".container-chat").should("exist");
    });

    it("Loaded the contact list", () => {
        cy.window().then(() => cy.get("#74").should("exist").click());
    });

    it("Sent a message", () => {
        cy.window().then(window => {
            window.currentChat.send("CHAT", message);
            cy.get(".messages-container").last().contains(message);
        });
    });

    it("Stored the message and verified previous steps", () => {
        cy.reload();

        cy.get("#exampleInputUsername").should("exist").type("cypress");
        cy.get("#exampleInputPassword").should("exist").type("cypress");
        cy.get("#buttonLogin").click();

        cy.window().then(() => {
            cy.get("#74").should("exist").click();
            cy.get(".messages-container").last().contains(message);
        });
    });
});
import { network } from "hardhat";
import assert from "node:assert/strict";

const { ethers } = await network.connect();

describe("EventTicketing", function () {
  let eventTicketing;
  let organizer;
  let user;

  beforeEach(async function () {
    [organizer, user] = await ethers.getSigners();

    const EventTicketing =
      await ethers.getContractFactory("EventTicketing");

    eventTicketing = await EventTicketing.deploy();

    await eventTicketing.waitForDeployment();
  });

  // ==================================================
  // TEST 1: CREATE EVENT
  // ==================================================

  it("should create an event", async function () {
    await eventTicketing.createEvent(
      "Tech Conference 2026",
      "30-10-2026",
      "Mumbai",
      ethers.parseEther("0.01"),
      100
    );

    const event = await eventTicketing.events(0);

    assert.equal(event.eventId, 0n);
    assert.equal(event.name, "Tech Conference 2026");
    assert.equal(event.date, "30-10-2026");
    assert.equal(event.venue, "Mumbai");
    assert.equal(
      event.ticketPrice,
      ethers.parseEther("0.01")
    );
    assert.equal(event.totalTickets, 100n);
    assert.equal(event.ticketsSold, 0n);
    assert.equal(event.organizer, organizer.address);
  });

  // ==================================================
  // TEST 2: PURCHASE TICKET
  // ==================================================

  it("should allow a user to purchase a ticket", async function () {
    await eventTicketing.createEvent(
      "Tech Conference 2026",
      "30-10-2026",
      "Mumbai",
      ethers.parseEther("0.01"),
      100
    );

    await eventTicketing
      .connect(user)
      .purchaseTicket(0, {
        value: ethers.parseEther("0.01"),
      });

    const ticket = await eventTicketing.getTicket(0);

    assert.equal(ticket.ticketId, 0n);
    assert.equal(ticket.eventId, 0n);
    assert.equal(ticket.owner, user.address);
    assert.equal(ticket.used, false);
  });

  // ==================================================
  // TEST 3: VERIFY VALID TICKET
  // ==================================================

  it("should verify a valid ticket", async function () {
    await eventTicketing.createEvent(
      "Tech Conference 2026",
      "30-10-2026",
      "Mumbai",
      ethers.parseEther("0.01"),
      100
    );

    await eventTicketing
      .connect(user)
      .purchaseTicket(0, {
        value: ethers.parseEther("0.01"),
      });

    const isValid = await eventTicketing.verifyTicket(0);

    assert.equal(isValid, true);
  });

  // ==================================================
  // TEST 4: ORGANIZER USES TICKET
  // ==================================================

  it("should allow organizer to use a ticket", async function () {
    await eventTicketing.createEvent(
      "Tech Conference 2026",
      "30-10-2026",
      "Mumbai",
      ethers.parseEther("0.01"),
      100
    );

    await eventTicketing
      .connect(user)
      .purchaseTicket(0, {
        value: ethers.parseEther("0.01"),
      });

    await eventTicketing
      .connect(organizer)
      .useTicket(0);

    const ticket = await eventTicketing.getTicket(0);

    assert.equal(ticket.used, true);
  });

  // ==================================================
  // TEST 5: USED TICKET BECOMES INVALID
  // ==================================================

  it("should make a used ticket invalid", async function () {
    await eventTicketing.createEvent(
      "Tech Conference 2026",
      "30-10-2026",
      "Mumbai",
      ethers.parseEther("0.01"),
      100
    );

    await eventTicketing
      .connect(user)
      .purchaseTicket(0, {
        value: ethers.parseEther("0.01"),
      });

    await eventTicketing
      .connect(organizer)
      .useTicket(0);

    const isValid = await eventTicketing.verifyTicket(0);

    assert.equal(isValid, false);
  });

  // ==================================================
  // TEST 6: WRONG TICKET PRICE
  // ==================================================

  it("should reject purchase with incorrect ticket price", async function () {
    await eventTicketing.createEvent(
      "Tech Conference 2026",
      "30-10-2026",
      "Mumbai",
      ethers.parseEther("0.01"),
      100
    );

    await assert.rejects(
      eventTicketing
        .connect(user)
        .purchaseTicket(0, {
          value: ethers.parseEther("0.005"),
        }),
      /Incorrect ticket price/
    );
  });

  // ==================================================
  // TEST 7: SOLD OUT EVENT
  // ==================================================

  it("should reject purchase when event is sold out", async function () {
    await eventTicketing.createEvent(
      "Small Event",
      "30-10-2026",
      "Mumbai",
      ethers.parseEther("0.01"),
      1
    );

    // First purchase
    await eventTicketing
      .connect(user)
      .purchaseTicket(0, {
        value: ethers.parseEther("0.01"),
      });

    // Second purchase should fail
    await assert.rejects(
      eventTicketing
        .connect(user)
        .purchaseTicket(0, {
          value: ethers.parseEther("0.01"),
        }),
      /Tickets sold out/
    );
  });

  // ==================================================
  // TEST 8: ONLY ORGANIZER CAN USE TICKET
  // ==================================================

  it("should reject non-organizer from using a ticket", async function () {
    await eventTicketing.createEvent(
      "Tech Conference 2026",
      "30-10-2026",
      "Mumbai",
      ethers.parseEther("0.01"),
      100
    );

    await eventTicketing
      .connect(user)
      .purchaseTicket(0, {
        value: ethers.parseEther("0.01"),
      });

    // Normal user tries to use the ticket
    await assert.rejects(
      eventTicketing
        .connect(user)
        .useTicket(0),
      /Only organizer can use ticket/
    );
  });

  // ==================================================
  // TEST 9: TICKET CANNOT BE USED TWICE
  // ==================================================

  it("should reject using an already used ticket", async function () {
    await eventTicketing.createEvent(
      "Tech Conference 2026",
      "30-10-2026",
      "Mumbai",
      ethers.parseEther("0.01"),
      100
    );

    await eventTicketing
      .connect(user)
      .purchaseTicket(0, {
        value: ethers.parseEther("0.01"),
      });

    // Organizer uses ticket first time
    await eventTicketing
      .connect(organizer)
      .useTicket(0);

    // Organizer tries to use it again
    await assert.rejects(
      eventTicketing
        .connect(organizer)
        .useTicket(0),
      /Ticket already used/
    );
  });

  // ==================================================
  // TEST 10: ZERO TICKET QUANTITY
  // ==================================================

  it("should reject event creation with zero tickets", async function () {
    await assert.rejects(
      eventTicketing.createEvent(
        "Invalid Event",
        "30-10-2026",
        "Mumbai",
        ethers.parseEther("0.01"),
        0
      ),
      /Ticket quantity must be greater than zero/
    );
  });

  // ==================================================
  // TEST 11: ZERO TICKET PRICE
  // ==================================================

  it("should reject event creation with zero price", async function () {
    await assert.rejects(
      eventTicketing.createEvent(
        "Free Event",
        "30-10-2026",
        "Mumbai",
        0,
        100
      ),
      /Ticket price must be greater than zero/
    );
  });

  // ==================================================
  // TEST 12: ORGANIZER CANNOT BUY OWN EVENT
  // ==================================================

  it("should prevent organizer from buying their own event", async function () {
    await eventTicketing.createEvent(
      "Blockchain Conference",
      "30-09-2026",
      "Mumbai",
      ethers.parseEther("0.1"),
      100
    );

    await assert.rejects(
      eventTicketing
        .connect(organizer)
        .purchaseTicket(0, {
          value: ethers.parseEther("0.1"),
        }),
      /Organizer cannot purchase own event ticket/
    );
  });

  // ==================================================
  // TEST 13: OTHER USER CAN BUY EVENT
  // ==================================================

  it("should allow another wallet to buy the event ticket", async function () {
    await eventTicketing.createEvent(
      "Blockchain Conference",
      "30-09-2026",
      "Mumbai",
      ethers.parseEther("0.1"),
      100
    );

    await eventTicketing
      .connect(user)
      .purchaseTicket(0, {
        value: ethers.parseEther("0.1"),
      });

    const ticket = await eventTicketing.getTicket(0);

    assert.equal(ticket.ticketId, 0n);
    assert.equal(ticket.eventId, 0n);
    assert.equal(ticket.owner, user.address);
    assert.equal(ticket.used, false);
  });
});
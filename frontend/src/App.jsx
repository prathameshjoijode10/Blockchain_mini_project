import { useState } from "react";
import {
  BrowserProvider,
  Contract,
  parseEther,
  formatEther,
} from "ethers";

import {
  CONTRACT_ADDRESS,
  CONTRACT_ABI,
} from "./contract";

function App() {
  const [account, setAccount] = useState("");
  const [totalEvents, setTotalEvents] = useState(null);

  const [events, setEvents] = useState([]);
  const [myTickets, setMyTickets] = useState([]);

  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventVenue, setEventVenue] = useState("");
  const [ticketPrice, setTicketPrice] = useState("");
  const [totalTickets, setTotalTickets] = useState("");

 const [status, setStatus] = useState("");

const [purchaseStatus, setPurchaseStatus] = useState("");
const [purchaseStatusEventId, setPurchaseStatusEventId] = useState("");

  const [ticketIdToVerify, setTicketIdToVerify] = useState("");
  const [verifiedTicket, setVerifiedTicket] = useState(null);
  const [ticketIdToUse, setTicketIdToUse] = useState("");

  // ================================
  // CONNECT WALLET
  // ================================

  async function connectWallet() {
    if (!window.ethereum) {
      alert("MetaMask is not installed!");
      return;
    }

    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      setAccount(accounts[0]);
    } catch (error) {
      console.error("Wallet connection failed:", error);
    }
  }

  // ================================
  // GET TOTAL EVENTS
  // ================================

  async function getEventCount() {
    if (!window.ethereum) {
      alert("MetaMask is not installed!");
      return;
    }

    try {
      const provider = new BrowserProvider(window.ethereum);

      const contract = new Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        provider
      );

      const count = await contract.getTotalEvents();

      setTotalEvents(count.toString());
    } catch (error) {
      console.error("Failed to read contract:", error);
    }
  }

  // ================================
  // LOAD MY TICKETS
  // ================================

 async function loadMyTickets() {
  if (!window.ethereum) {
    alert("MetaMask is not installed!");
    return;
  }

  try {
    setStatus("Loading your tickets...");

    const provider = new BrowserProvider(window.ethereum);

    // Get the currently active MetaMask account
    const signer = await provider.getSigner();
    const currentAccount = await signer.getAddress();

    console.log("Current MetaMask account:", currentAccount);
    console.log("Contract address:", CONTRACT_ADDRESS);

    const contract = new Contract(
      CONTRACT_ADDRESS,
      CONTRACT_ABI,
      provider
    );

    // Get tickets owned by the currently active wallet
    const ticketIds = await contract.getMyTickets(currentAccount);

    console.log("Ticket IDs:", ticketIds);

    const loadedTickets = [];

    for (const ticketId of ticketIds) {
      const ticket = await contract.getTicket(ticketId);

      console.log("Ticket:", ticket);

      loadedTickets.push({
        ticketId: ticket.ticketId.toString(),
        eventId: ticket.eventId.toString(),
        owner: ticket.owner,
        used: ticket.used,
      });
    }

    setMyTickets(loadedTickets);

    setStatus(
      loadedTickets.length > 0
        ? "Tickets loaded successfully!"
        : "No tickets found for this wallet."
    );
  } catch (error) {
    console.error("Failed to load tickets:", error);
    setStatus("Failed to load tickets. Check the browser console.");
  }
}

  // ================================
  // LOAD EVENTS
  // ================================

  async function loadEvents() {
    if (!window.ethereum) {
      alert("MetaMask is not installed!");
      return;
    }

    try {
      const provider = new BrowserProvider(window.ethereum);

      const contract = new Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        provider
      );

      const count = await contract.getTotalEvents();

      const loadedEvents = [];

      for (let i = 0n; i < count; i++) {
        const event = await contract.events(i);

        loadedEvents.push({
          eventId: event.eventId.toString(),
          name: event.name,
          date: event.date,
          venue: event.venue,
          ticketPrice: formatEther(event.ticketPrice),
          totalTickets: event.totalTickets.toString(),
          ticketsSold: event.ticketsSold.toString(),
          organizer: event.organizer,
        });
      }

      setEvents(loadedEvents);
      setTotalEvents(count.toString());
    } catch (error) {
      console.error("Failed to load events:", error);
    }
  }

  // ================================
  // PURCHASE TICKET
  // ================================

 async function purchaseTicket(eventId, price) {
  if (!window.ethereum) {
    alert("MetaMask is not installed!");
    return;
  }

  try {
    setPurchaseStatusEventId(eventId);
    setPurchaseStatus("Waiting for MetaMask confirmation...");

    const provider = new BrowserProvider(window.ethereum);

    const signer = await provider.getSigner();

    const contract = new Contract(
      CONTRACT_ADDRESS,
      CONTRACT_ABI,
      signer
    );

    const transaction = await contract.purchaseTicket(eventId, {
      value: parseEther(price),
    });

    setPurchaseStatus(
      "Ticket purchase submitted. Waiting for confirmation..."
    );

    await transaction.wait();

    setPurchaseStatus("Ticket purchased successfully!");

    await loadEvents();
    await loadMyTickets();

  } catch (error) {
    console.error("Ticket purchase failed:", error);

    const reason = error.reason || "";

    setPurchaseStatusEventId(eventId);

    if (
      reason ===
      "Organizer cannot purchase own event ticket"
    ) {
      setPurchaseStatus(
        "You cannot purchase tickets for your own event."
      );
    } else if (reason === "Incorrect ticket price") {
      setPurchaseStatus("Incorrect ticket price.");
    } else if (reason === "Tickets sold out") {
      setPurchaseStatus("This event is sold out.");
    } else {
      setPurchaseStatus(
        "Ticket purchase failed. Check MetaMask and try again."
      );
    }
  }
}

  // ================================
  // VERIFY TICKET
  // ================================

  async function verifyTicket() {
    if (!window.ethereum) {
      alert("MetaMask is not installed!");
      return;
    }

    if (ticketIdToVerify === "") {
      alert("Please enter a Ticket ID.");
      return;
    }

    try {
      setStatus("Verifying ticket...");

      const provider = new BrowserProvider(window.ethereum);

      const contract = new Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        provider
      );

      const ticket = await contract.getTicket(ticketIdToVerify);

      // Check whether ticket exists
      if (
        ticket.owner ===
        "0x0000000000000000000000000000000000000000"
      ) {
        setVerifiedTicket({
          ticketId: ticketIdToVerify,
          exists: false,
        });

        setStatus("Ticket does not exist.");

        return;
      }

      // Check whether ticket is valid
      const isValid = await contract.verifyTicket(
        ticketIdToVerify
      );

      setVerifiedTicket({
        ticketId: ticket.ticketId.toString(),
        eventId: ticket.eventId.toString(),
        owner: ticket.owner,
        used: ticket.used,
        isValid: isValid,
        exists: true,
      });

      setStatus("Ticket verification completed.");
    } catch (error) {
      console.error("Ticket verification failed:", error);

      setVerifiedTicket({
        ticketId: ticketIdToVerify,
        exists: false,
      });

      setStatus("Ticket does not exist.");
    }
  }

  // ================================
  // CREATE EVENT
  // ================================

  async function createEvent() {
    if (!window.ethereum) {
      alert("MetaMask is not installed!");
      return;
    }

    if (
      !eventName ||
      !eventDate ||
      !eventVenue ||
      !ticketPrice ||
      !totalTickets
    ) {
      alert("Please fill all fields.");
      return;
    }

    try {
      setStatus("Waiting for MetaMask confirmation...");

      const provider = new BrowserProvider(window.ethereum);

      const signer = await provider.getSigner();

      const contract = new Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer
      );

      const priceInWei = parseEther(ticketPrice);

      const transaction = await contract.createEvent(
        eventName,
        eventDate,
        eventVenue,
        priceInWei,
        totalTickets
      );

      setStatus(
        "Transaction submitted. Waiting for confirmation..."
      );

      await transaction.wait();

      setStatus("Event created successfully!");

      setEventName("");
      setEventDate("");
      setEventVenue("");
      setTicketPrice("");
      setTotalTickets("");

      await loadEvents();
    } catch (error) {
      console.error("Create event failed:", error);

      setStatus(
        "Transaction failed. Check MetaMask and try again."
      );
    }
  }

  async function useTicket() {
    if (!window.ethereum) {
      alert("MetaMask is not installed!");
      return;
    }

    if (ticketIdToUse === "") {
      alert("Please enter a Ticket ID.");
      return;
    }

    try {
      setStatus("Waiting for MetaMask confirmation...");

      const provider = new BrowserProvider(window.ethereum);

      const signer = await provider.getSigner();

      const contract = new Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer
      );

      // First check the ticket
      const ticket = await contract.getTicket(ticketIdToUse);

      // Check whether ticket exists
      if (
        ticket.owner ===
        "0x0000000000000000000000000000000000000000"
      ) {
        setStatus("Ticket does not exist.");
        return;
      }

      // Check whether ticket is already used
      if (ticket.used) {
        setStatus("Ticket has already been used.");
        return;
      }

      // Call the blockchain function
      const transaction = await contract.useTicket(
        ticketIdToUse
      );

      setStatus(
        "Ticket usage submitted. Waiting for confirmation..."
      );

      await transaction.wait();

      setStatus("Ticket marked as used successfully!");

      // Refresh My Tickets
      await loadMyTickets();

      // Refresh verification result
      setVerifiedTicket({
        ticketId: ticket.ticketId.toString(),
        eventId: ticket.eventId.toString(),
        owner: ticket.owner,
        used: true,
        isValid: false,
        exists: true,
      });
    } catch (error) {
      console.error("Failed to use ticket:", error);

      if (
        error.reason ===
        "Only organizer can use ticket"
      ) {
        setStatus(
          "Only the event organizer can mark this ticket as used."
        );
      } else {
        setStatus(
          "Failed to mark ticket as used. Check MetaMask."
        );
      }
    }
  }

  // ================================
  // FRONTEND
  // ================================

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* ================= NAVBAR ================= */}
      <nav className="border-b border-slate-800 bg-slate-900/90 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-4">

          <div className="flex items-center justify-between">

            {/* Logo */}
            <div className="flex items-center gap-3">

              <div className="w-11 h-11 rounded-xl bg-indigo-600 flex items-center justify-center text-2xl shadow-lg shadow-indigo-600/20">
                🎟️
              </div>

              <div>
                <h1 className="text-lg font-bold text-white">
                  BlockTix
                </h1>

                <p className="text-xs text-slate-400">
                  Blockchain Event Ticketing
                </p>
              </div>

            </div>


            {/* Wallet */}
            {!account ? (

              <button
                onClick={connectWallet}
                className="bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 px-5 py-2.5 rounded-xl font-semibold transition shadow-lg shadow-indigo-600/20"
              >
                🦊 Connect Wallet
              </button>

            ) : (

              <div className="flex items-center gap-3">

                <div className="hidden sm:block text-right">
                  <p className="text-xs text-slate-500">
                    Connected Wallet
                  </p>

                  <p className="text-sm font-mono text-slate-200">
                    {account.slice(0, 6)}...
                    {account.slice(-4)}
                  </p>
                </div>

                <div className="w-10 h-10 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                  🟢
                </div>

              </div>

            )}

          </div>

        </div>
      </nav>


      {/* ================= MAIN ================= */}
      <main className="max-w-6xl mx-auto px-6 py-10">


        {/* ================= HERO ================= */}
        <section className="text-center py-10 md:py-14">

          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <span>🔗</span>
            Decentralized Ticketing
          </div>

          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
            Events Powered by
            <span className="text-indigo-500">
              {" "}Blockchain
            </span>
          </h2>

          <p className="text-slate-400 max-w-2xl mx-auto mt-5 text-base md:text-lg leading-relaxed">
            Create, purchase and verify event tickets securely
            using blockchain technology.
          </p>

        </section>


        {/* ================= WALLET DASHBOARD ================= */}
        {account && (

          <section className="mb-10">

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6">

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">

                {/* Wallet Information */}
                <div className="flex items-center gap-4">

                  <div className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-xl">
                    🟢
                  </div>

                  <div>

                    <p className="text-xs text-slate-500 uppercase tracking-wider">
                      Wallet Connected
                    </p>

                    <p className="text-sm font-mono text-slate-200 mt-1 break-all">
                      {account}
                    </p>

                  </div>

                </div>


                {/* Quick Actions */}
                <div className="flex flex-wrap gap-3">

                  <button
                    onClick={getEventCount}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm font-medium text-slate-200 transition"
                  >
                    📊 Event Count
                  </button>

                  <button
                    onClick={loadEvents}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-sm font-semibold transition shadow-lg shadow-indigo-600/10"
                  >
                    🔄 Refresh Events
                  </button>

                  <button
                    onClick={loadMyTickets}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm font-medium text-slate-200 transition"
                  >
                    🎟️ My Tickets
                  </button>

                </div>

              </div>


              {/* Total Events */}
              {totalEvents !== null && (

                <div className="mt-5 pt-5 border-t border-slate-800">

                  <div className="inline-flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3">

                    <span className="text-xl">
                      🎪
                    </span>

                    <div>
                      <p className="text-xs text-slate-500">
                        Total Events
                      </p>

                      <p className="text-lg font-bold text-white">
                        {totalEvents}
                      </p>
                    </div>

                  </div>

                </div>

              )}

            </div>

          </section>

        )}


        {/* ================= DASHBOARD TITLE ================= */}
        <div className="mb-8">

          <h2 className="text-2xl font-bold text-white">
            Event Dashboard
          </h2>

          <p className="text-slate-400 mt-1">
            Manage events, tickets and blockchain transactions.
          </p>

        </div>

        {/* ================================
          CREATE EVENT
      ================================= */}

        {account && (
          <section className="mb-10">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl">

              {/* Section Header */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-xl">
                    🎫
                  </div>

                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      Create New Event
                    </h2>

                    <p className="text-sm text-slate-400">
                      Create an event and publish its ticket details on the blockchain.
                    </p>
                  </div>
                </div>
              </div>

              {/* Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                {/* Event Name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Event Name
                  </label>

                  <input
                    type="text"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    placeholder="Tech Conference 2026"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Date
                  </label>

                  <input
                    type="text"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    placeholder="30-10-2026"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
                  />
                </div>

                {/* Venue */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Venue
                  </label>

                  <input
                    type="text"
                    value={eventVenue}
                    onChange={(e) => setEventVenue(e.target.value)}
                    placeholder="Mumbai"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
                  />
                </div>

                {/* Ticket Price */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Ticket Price (ETH)
                  </label>

                  <input
                    type="number"
                    step="0.001"
                    value={ticketPrice}
                    onChange={(e) => setTicketPrice(e.target.value)}
                    placeholder="0.01"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
                  />
                </div>

                {/* Total Tickets */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Total Tickets
                  </label>

                  <input
                    type="number"
                    value={totalTickets}
                    onChange={(e) => setTotalTickets(e.target.value)}
                    placeholder="100"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
                  />
                </div>

              </div>

              {/* Create Button */}
              <div className="mt-6">
                <button
                  onClick={createEvent}
                  className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold px-6 py-3 rounded-xl transition shadow-lg shadow-indigo-600/20"
                >
                  Create Event
                </button>
              </div>

              {/* Status */}
              {status && (
                <div className="mt-5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 px-4 py-3 rounded-xl">
                  <span className="font-semibold">Status:</span>{" "}
                  {status}
                </div>
              )}

            </div>
          </section>
        )}



        {/* ================================
          AVAILABLE EVENTS
      ================================= */}

        {account && (
          <section className="mb-10">

            {/* Section Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white">
                Available Events
              </h2>

              <p className="text-slate-400 mt-1">
                Browse events and purchase tickets securely through the blockchain.
              </p>
            </div>

            {/* No Events */}
            {events.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
                <div className="text-4xl mb-3">
                  🎫
                </div>

                <h3 className="text-lg font-semibold text-white">
                  No Events Found
                </h3>

                <p className="text-slate-400 mt-1">
                  Create an event to start selling tickets.
                </p>
              </div>
            ) : (

              /* Event Cards */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {events.map((event) => {

                  const soldOut =
                    Number(event.ticketsSold) >=
                    Number(event.totalTickets);

                  const ticketsRemaining =
                    Number(event.totalTickets) -
                    Number(event.ticketsSold);

                  return (
                    <div
                      key={event.eventId}
                      className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg hover:border-indigo-500/40 hover:shadow-indigo-500/5 transition"
                    >

                      {/* Card Header */}
                      <div className="p-6 border-b border-slate-800">

                        <div className="flex items-start justify-between gap-4">

                          <div>
                            <p className="text-xs text-indigo-400 font-semibold uppercase tracking-wider">
                              Event #{event.eventId}
                            </p>

                            <h3 className="text-xl font-bold text-white mt-1">
                              {event.name}
                            </h3>
                          </div>

                          <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-xl shrink-0">
                            🎟️
                          </div>

                        </div>

                      </div>

                      {/* Event Details */}
                      <div className="p-6 space-y-4">

                        {/* Date */}
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center">
                            📅
                          </div>

                          <div>
                            <p className="text-xs text-slate-500">
                              Date
                            </p>

                            <p className="text-sm text-slate-200">
                              {event.date}
                            </p>
                          </div>
                        </div>

                        {/* Venue */}
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center">
                            📍
                          </div>

                          <div>
                            <p className="text-xs text-slate-500">
                              Venue
                            </p>

                            <p className="text-sm text-slate-200">
                              {event.venue}
                            </p>
                          </div>
                        </div>

                        {/* Price + Tickets */}
                        <div className="grid grid-cols-2 gap-4">

                          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                            <p className="text-xs text-slate-500">
                              Ticket Price
                            </p>

                            <p className="text-lg font-bold text-indigo-400 mt-1">
                              {event.ticketPrice} ETH
                            </p>
                          </div>

                          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                            <p className="text-xs text-slate-500">
                              Tickets
                            </p>

                            <p className="text-lg font-bold text-white mt-1">
                              {event.ticketsSold}
                              <span className="text-slate-500 text-sm font-normal">
                                {" "} / {event.totalTickets}
                              </span>
                            </p>
                          </div>

                        </div>

                        {/* Availability */}
                        <div className="flex items-center justify-between pt-1">

                          <span className="text-sm text-slate-400">
                            {soldOut
                              ? "All tickets sold"
                              : `${ticketsRemaining} tickets remaining`}
                          </span>

                          <span
                            className={`text-xs font-semibold px-3 py-1 rounded-full ${soldOut
                              ? "bg-red-500/10 text-red-400 border border-red-500/20"
                              : "bg-green-500/10 text-green-400 border border-green-500/20"
                              }`}
                          >
                            {soldOut ? "Sold Out" : "Available"}
                          </span>

                        </div>

                        {/* Organizer */}
                        <div className="pt-3 border-t border-slate-800">

                          <p className="text-xs text-slate-500 mb-1">
                            Organizer
                          </p>

                          <p className="text-xs font-mono text-slate-400 break-all">
                            {event.organizer}
                          </p>

                        </div>

                        {/* Buy Button */}
                        <button
                          onClick={() =>
                            purchaseTicket(
                              event.eventId,
                              event.ticketPrice
                            )
                          }
                          disabled={soldOut}
                          className={`w-full py-3 rounded-xl font-semibold transition ${soldOut
                            ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                            : "bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-lg shadow-indigo-600/20"
                            }`}
                        >
                          {soldOut
                            ? "Sold Out"
                            : "🎟️ Buy Ticket"}
                        </button>
                        {purchaseStatus &&
  purchaseStatusEventId === event.eventId && (
    <div className="mt-3 bg-slate-950 border border-slate-800 rounded-xl p-3">
      <p className="text-sm text-slate-300">
        {purchaseStatus}
      </p>
    </div>
  )}

                      </div>

                    </div>
                  );
                })}

              </div>
            )}

          </section>
        )}


        {/* ================================
          MY TICKETS
      ================================= */}

        {account && (
          <section className="mb-10">

            {/* Section Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white">
                My Tickets
              </h2>

              <p className="text-slate-400 mt-1">
                View the tickets owned by your connected wallet.
              </p>
            </div>

            {/* No Tickets */}
            {myTickets.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">

                <div className="text-4xl mb-3">
                  🎟️
                </div>

                <h3 className="text-lg font-semibold text-white">
                  No Tickets Found
                </h3>

                <p className="text-slate-400 mt-1">
                  Purchase a ticket from the available events.
                </p>

              </div>
            ) : (

              /* Ticket Cards */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {myTickets.map((ticket) => (

                  <div
                    key={ticket.ticketId}
                    className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg"
                  >

                    {/* Ticket Header */}
                    <div className="p-6 border-b border-slate-800">

                      <div className="flex items-center justify-between">

                        <div>
                          <p className="text-xs text-indigo-400 font-semibold uppercase tracking-wider">
                            Blockchain Ticket
                          </p>

                          <h3 className="text-xl font-bold text-white mt-1">
                            Ticket #{ticket.ticketId}
                          </h3>
                        </div>

                        <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-xl">
                          🎟️
                        </div>

                      </div>

                    </div>

                    {/* Ticket Details */}
                    <div className="p-6 space-y-5">

                      {/* Event ID */}
                      <div className="flex items-center justify-between">

                        <div>
                          <p className="text-xs text-slate-500">
                            Event ID
                          </p>

                          <p className="text-sm font-semibold text-white mt-1">
                            #{ticket.eventId}
                          </p>
                        </div>

                        <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center">
                          🎫
                        </div>

                      </div>

                      {/* Owner */}
                      <div>
                        <p className="text-xs text-slate-500 mb-1">
                          Ticket Owner
                        </p>

                        <p className="text-xs font-mono text-slate-300 break-all bg-slate-950 border border-slate-800 rounded-lg px-3 py-2">
                          {ticket.owner}
                        </p>
                      </div>

                      {/* Status */}
                      <div className="flex items-center justify-between pt-4 border-t border-slate-800">

                        <span className="text-sm text-slate-400">
                          Ticket Status
                        </span>

                        {ticket.used ? (
                          <span className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                            ❌ Used
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                            ✅ Valid
                          </span>
                        )}

                      </div>

                    </div>

                  </div>

                ))}

              </div>
            )}

          </section>
        )}

        <hr />

        {/* ================================
          VERIFY TICKET
      ================================= */}

        {/* Verify Ticket */}
        <section className="mb-10">

          {/* Section Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white">
              Verify Ticket
            </h2>

            <p className="text-slate-400 mt-1">
              Check the authenticity and current status of a blockchain ticket.
            </p>
          </div>

          {/* Verification Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl">

            {/* Input Area */}
            <div className="flex flex-col md:flex-row gap-4">

              <div className="flex-1">

                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Ticket ID
                </label>

                <input
                  type="number"
                  placeholder="Enter Ticket ID"
                  value={ticketIdToVerify}
                  onChange={(e) => setTicketIdToVerify(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
                />

              </div>

              <div className="md:flex md:items-end">

                <button
                  onClick={verifyTicket}
                  className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold px-6 py-3 rounded-xl transition shadow-lg shadow-indigo-600/20"
                >
                  🔍 Verify Ticket
                </button>

              </div>

            </div>

            {/* Verification Result */}
            {verifiedTicket && (
              <div className="mt-6">

                {/* Ticket Not Found */}
                {!verifiedTicket.exists ? (

                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-5">

                    <div className="flex items-center gap-3">

                      <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-xl">
                        ❌
                      </div>

                      <div>
                        <h3 className="font-semibold text-red-400">
                          Ticket Not Found
                        </h3>

                        <p className="text-sm text-slate-400 mt-1">
                          Ticket #{verifiedTicket.ticketId} does not exist.
                        </p>
                      </div>

                    </div>

                  </div>

                ) : (

                  /* Ticket Exists */
                  <div
                    className={`rounded-xl p-6 border ${verifiedTicket.isValid
                      ? "bg-green-500/10 border-green-500/20"
                      : "bg-red-500/10 border-red-500/20"
                      }`}
                  >

                    {/* Result Header */}
                    <div className="flex items-center justify-between gap-4 mb-5">

                      <div className="flex items-center gap-3">

                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${verifiedTicket.isValid
                            ? "bg-green-500/10 border border-green-500/20"
                            : "bg-red-500/10 border border-red-500/20"
                            }`}
                        >
                          {verifiedTicket.isValid ? "✅" : "❌"}
                        </div>

                        <div>
                          <h3
                            className={`font-semibold ${verifiedTicket.isValid
                              ? "text-green-400"
                              : "text-red-400"
                              }`}
                          >
                            {verifiedTicket.isValid
                              ? "Valid Ticket"
                              : "Ticket Already Used"}
                          </h3>

                          <p className="text-sm text-slate-400">
                            Ticket #{verifiedTicket.ticketId}
                          </p>
                        </div>

                      </div>

                      <span
                        className={`text-xs font-semibold px-3 py-1.5 rounded-full ${verifiedTicket.isValid
                          ? "bg-green-500/10 text-green-400 border border-green-500/20"
                          : "bg-red-500/10 text-red-400 border border-red-500/20"
                          }`}
                      >
                        {verifiedTicket.isValid
                          ? "VALID"
                          : "USED"}
                      </span>

                    </div>

                    {/* Ticket Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                      <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                        <p className="text-xs text-slate-500">
                          Ticket ID
                        </p>

                        <p className="text-sm font-semibold text-white mt-1">
                          #{verifiedTicket.ticketId}
                        </p>
                      </div>

                      <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                        <p className="text-xs text-slate-500">
                          Event ID
                        </p>

                        <p className="text-sm font-semibold text-white mt-1">
                          #{verifiedTicket.eventId}
                        </p>
                      </div>

                      <div className="md:col-span-2 bg-slate-950/60 border border-slate-800 rounded-xl p-4">

                        <p className="text-xs text-slate-500 mb-1">
                          Ticket Owner
                        </p>

                        <p className="text-xs font-mono text-slate-300 break-all">
                          {verifiedTicket.owner}
                        </p>

                      </div>

                    </div>

                  </div>

                )}

              </div>
            )}

          </div>

        </section>
        <hr />

        <div>
          {/* Mark Ticket Used */}
          <section className="mb-10">

            {/* Section Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white">
                Mark Ticket Used
              </h2>

              <p className="text-slate-400 mt-1">
                Organizers can mark a verified ticket as used after entry.
              </p>
            </div>

            {/* Organizer Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl">

              {/* Info */}
              <div className="flex items-start gap-4 mb-6">

                <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-xl shrink-0">
                  🔐
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Ticket Check-In
                  </h3>

                  <p className="text-sm text-slate-400 mt-1">
                    Enter a ticket ID to mark the ticket as used.
                    Only the event organizer can perform this action.
                  </p>
                </div>

              </div>

              {/* Input + Button */}
              <div className="flex flex-col md:flex-row gap-4">

                <div className="flex-1">

                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Ticket ID
                  </label>

                  <input
                    type="number"
                    placeholder="Enter Ticket ID"
                    value={ticketIdToUse}
                    onChange={(e) => setTicketIdToUse(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition"
                  />

                </div>

                <div className="md:flex md:items-end">

                  <button
                    onClick={useTicket}
                    className="w-full md:w-auto bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-semibold px-6 py-3 rounded-xl transition shadow-lg shadow-amber-500/10"
                  >
                    ✓ Mark as Used
                  </button>

                </div>

              </div>

              {/* Security Note */}
              <div className="mt-5 bg-slate-950 border border-slate-800 rounded-xl p-4">

                <div className="flex items-start gap-3">

                  <span className="text-sm">
                    🔒
                  </span>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    This action is recorded on the blockchain. Once a ticket
                    is marked as used, it cannot be used again.
                  </p>

                </div>

              </div>

            </div>

          </section>
        </div>
      </main>
      {/* Footer */}
      <footer className="border-t border-slate-800 mt-10">
        <div className="max-w-6xl mx-auto px-6 py-6 text-center">
          <p className="text-sm text-slate-500">
            Decentralized Event Ticketing System
          </p>

          <p className="text-xs text-slate-600 mt-1">
            Powered by Blockchain • MetaMask • Solidity
          </p>
        </div>
      </footer>
    </div>

  );
}

export default App;
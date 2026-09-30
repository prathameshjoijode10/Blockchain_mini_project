// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract EventTicketing {

    // -----------------------------
    // STRUCTURES
    // -----------------------------

    struct Event {
        uint256 eventId;
        string name;
        string date;
        string venue;
        uint256 ticketPrice;
        uint256 totalTickets;
        uint256 ticketsSold;
        address organizer;
    }

    struct Ticket {
        uint256 ticketId;
        uint256 eventId;
        address owner;
        bool used;
    }


    // -----------------------------
    // STATE VARIABLES
    // -----------------------------

    uint256 private nextEventId;
    uint256 private nextTicketId;

    mapping(uint256 => Event) public events;
    mapping(uint256 => Ticket) public tickets;


    // -----------------------------
    // EVENTS
    // -----------------------------

    event EventCreated(
        uint256 indexed eventId,
        string name,
        address indexed organizer
    );

    event TicketPurchased(
        uint256 indexed ticketId,
        uint256 indexed eventId,
        address indexed owner
    );

    event TicketUsed(
        uint256 indexed ticketId,
        uint256 indexed eventId
    );


    // -----------------------------
    // CREATE EVENT
    // -----------------------------

    function createEvent(
        string memory _name,
        string memory _date,
        string memory _venue,
        uint256 _ticketPrice,
        uint256 _totalTickets
    ) public {

        require(
            _totalTickets > 0,
            "Ticket quantity must be greater than zero"
        );

        require(
            _ticketPrice > 0,
            "Ticket price must be greater than zero"
        );

        events[nextEventId] = Event({
            eventId: nextEventId,
            name: _name,
            date: _date,
            venue: _venue,
            ticketPrice: _ticketPrice,
            totalTickets: _totalTickets,
            ticketsSold: 0,
            organizer: msg.sender
        });

        emit EventCreated(
            nextEventId,
            _name,
            msg.sender
        );

        nextEventId++;
    }


    // -----------------------------
    // PURCHASE TICKET
    // -----------------------------

    function purchaseTicket(uint256 _eventId) public payable {
    Event storage selectedEvent = events[_eventId];

    require(selectedEvent.totalTickets > 0, "Event does not exist");

    require(
        msg.sender != selectedEvent.organizer,
        "Organizer cannot purchase own event ticket"
    );

    require(
        selectedEvent.ticketsSold < selectedEvent.totalTickets,
        "Tickets sold out"
    );

    require(
        msg.value == selectedEvent.ticketPrice,
        "Incorrect ticket price"
    );

    tickets[nextTicketId] = Ticket({
        ticketId: nextTicketId,
        eventId: _eventId,
        owner: msg.sender,
        used: false
    });

    selectedEvent.ticketsSold++;

    emit TicketPurchased(nextTicketId, _eventId, msg.sender);
    nextTicketId++;
}


    // -----------------------------
    // GET EVENT
    // -----------------------------

    function getEvent(uint256 _eventId)
        public
        view
        returns (Event memory)
    {
        return events[_eventId];
    }


    // -----------------------------
    // GET TICKET
    // -----------------------------

    function getTicket(uint256 _ticketId)
        public
        view
        returns (Ticket memory)
    {
        return tickets[_ticketId];
    }


    // -----------------------------
    // VERIFY TICKET
    // -----------------------------

    function verifyTicket(uint256 _ticketId)
        public
        view
        returns (bool)
    {
        Ticket memory ticket = tickets[_ticketId];

        if (ticket.owner == address(0)) {
            return false;
        }

        if (ticket.used) {
            return false;
        }

        return true;
    }


    // -----------------------------
    // USE TICKET
    // -----------------------------

    function useTicket(uint256 _ticketId)
        public
    {
        Ticket storage ticket = tickets[_ticketId];

        require(
            ticket.owner != address(0),
            "Ticket does not exist"
        );

        require(
            !ticket.used,
            "Ticket already used"
        );

        require(
            msg.sender == events[ticket.eventId].organizer,
            "Only organizer can use ticket"
        );

        ticket.used = true;

        emit TicketUsed(
            _ticketId,
            ticket.eventId
        );
    }


    // -----------------------------
    // GET TOTAL EVENTS
    // -----------------------------

    function getTotalEvents()
        public
        view
        returns (uint256)
    {
        return nextEventId;
    }


    // -----------------------------
    // GET TOTAL TICKETS
    // -----------------------------

    function getTotalTickets()
        public
        view
        returns (uint256)
    {
        return nextTicketId;
    }

    function getMyTickets(address _owner)
    public
    view
    returns (uint256[] memory)
{
    uint256 ticketCount = nextTicketId;

    uint256[] memory tempTickets = new uint256[](ticketCount);
    uint256 count = 0;

    for (uint256 i = 0; i < ticketCount; i++) {
        if (tickets[i].owner == _owner) {
            tempTickets[count] = i;
            count++;
        }
    }

    uint256[] memory myTickets = new uint256[](count);

    for (uint256 i = 0; i < count; i++) {
        myTickets[i] = tempTickets[i];
    }

    return myTickets;
}
}
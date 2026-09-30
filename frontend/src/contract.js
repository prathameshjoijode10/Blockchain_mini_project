export const CONTRACT_ADDRESS =
  "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

export const CONTRACT_ABI = [
  {
    inputs: [],
    name: "getTotalEvents",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },

  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "events",
    outputs: [
      {
        internalType: "uint256",
        name: "eventId",
        type: "uint256",
      },
      {
        internalType: "string",
        name: "name",
        type: "string",
      },
      {
        internalType: "string",
        name: "date",
        type: "string",
      },
      {
        internalType: "string",
        name: "venue",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "ticketPrice",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "totalTickets",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "ticketsSold",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "organizer",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },

  {
    inputs: [
      {
        internalType: "string",
        name: "_name",
        type: "string",
      },
      {
        internalType: "string",
        name: "_date",
        type: "string",
      },
      {
        internalType: "string",
        name: "_venue",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "_ticketPrice",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_totalTickets",
        type: "uint256",
      },
    ],
    name: "createEvent",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },

  {
    inputs: [
      {
        internalType: "uint256",
        name: "_eventId",
        type: "uint256",
      },
    ],
    name: "purchaseTicket",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },

  {
    inputs: [
      {
        internalType: "uint256",
        name: "_ticketId",
        type: "uint256",
      },
    ],
    name: "getTicket",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "ticketId",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "eventId",
            type: "uint256",
          },
          {
            internalType: "address",
            name: "owner",
            type: "address",
          },
          {
            internalType: "bool",
            name: "used",
            type: "bool",
          },
        ],
        internalType: "struct EventTicketing.Ticket",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },

  {
    inputs: [
      {
        internalType: "uint256",
        name: "_ticketId",
        type: "uint256",
      },
    ],
    name: "verifyTicket",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },

  {
    inputs: [
      {
        internalType: "address",
        name: "_owner",
        type: "address",
      },
    ],
    name: "getMyTickets",
    outputs: [
      {
        internalType: "uint256[]",
        name: "",
        type: "uint256[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
  inputs: [
    {
      internalType: "uint256",
      name: "_ticketId",
      type: "uint256",
    },
  ],
  name: "useTicket",
  outputs: [],
  stateMutability: "nonpayable",
  type: "function",
},
];
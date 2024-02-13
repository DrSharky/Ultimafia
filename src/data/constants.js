const modifierData = require("./modifiers");

const modifiers = Object.entries(modifierData)
  .map((e) => ({
    [e[0]]: Object.entries(e[1])
      .map((x) => ({ [x[0]]: x[1].internal }))
      .reduce((acc, e) => {
        const [z] = Object.entries(e);
        acc[z[0]] = z[1];
        return acc;
      }, {}),
  }))
  .reduce((acc, e) => {
    const [k] = Object.entries(e);
    acc[k[0]] = k[1];
    return acc;
  }, {});

var rates = null;

if (process.env.NODE_ENV.includes("development")) {
  rates = {
    hostGame: 60 * 100,
    createSetup: 60 * 100,
    createThread: 5 * 60 * 100,
    postReply: 30 * 100,
    vote: 500,
    sendChatMessage: 500,
    deleteAccount: 60 * 60 * 100,
    postComment: 30 * 100,
    favSetup: 500,
  };
} else {
  rates = {
    hostGame: 60 * 1000,
    createSetup: 60 * 1000,
    createThread: 5 * 60 * 1000,
    postReply: 30 * 1000,
    vote: 500,
    sendChatMessage: 500,
    deleteAccount: 24 * 60 * 60 * 1000,
    postComment: 30 * 1000,
    favSetup: 500,
  };
}

module.exports = {
  restart: null,
  gameTypes: [
    "Mafia",
    "Split Decision",
    "Resistance",
    "One Night",
    "Ghost",
    "Jotto",
    "Acrotopia",
    "Secret Dictator",
    "Wacky Words",
  ],
  lobbies: ["Mafia", "Competitive", "Games", "Roleplay"],
  alignments: {
    Mafia: ["Village", "Mafia", "Cult", "Independent", "Hostile"],
    "Split Decision": ["Blue", "Red", "Independent"],
    Resistance: ["Resistance", "Spies"],
    "One Night": ["Village", "Werewolves", "Independent"],
    Ghost: ["Town", "Ghost", "Host"],
    Jotto: ["Town"],
    Acrotopia: ["Town"],
    "Secret Dictator": ["Liberals", "Fascists"],
    "Wacky Words": ["Town"],
  },
  startStates: {
    Mafia: ["Night", "Day"],
    "Split Decision": ["Round"],
    Resistance: ["Team Selection"],
    "One Night": ["Night"],
    Ghost: ["Night"],
    Jotto: ["Select Word"],
    Acrotopia: ["Night"],
    "Secret Dictator": ["Nomination"],
    "Wacky Words": ["Night"],
  },
  configurableStates: {
    Mafia: {
      Day: {
        min: 1 * 60 * 1000,
        max: 30 * 60 * 1000,
        default: 10 * 60 * 1000,
      },
      Night: {
        min: 1 * 60 * 1000,
        max: 10 * 60 * 1000,
        default: 2 * 60 * 1000,
      },
    },
    "Split Decision": {
      "Initial Round": {
        min: 1 * 60 * 1000,
        max: 5 * 60 * 1000,
        default: 3 * 60 * 1000,
      },
      "Hostage Swap": {
        min: 0.1 * 60 * 1000,
        max: 1 * 60 * 1000,
        default: 0.5 * 60 * 1000,
      },
    },
    Resistance: {
      "Team Selection": {
        min: 1 * 60 * 1000,
        max: 5 * 60 * 1000,
        default: 2 * 60 * 1000,
      },
      "Team Approval": {
        min: 0.1 * 60 * 1000,
        max: 2 * 60 * 1000,
        default: 0.5 * 60 * 1000,
      },
      Mission: {
        min: 0.1 * 60 * 1000,
        max: 1 * 60 * 1000,
        default: 0.5 * 60 * 1000,
      },
    },
    "One Night": {
      Day: {
        min: 1 * 60 * 1000,
        max: 30 * 60 * 1000,
        default: 10 * 60 * 1000,
      },
      Night: {
        min: 1 * 60 * 1000,
        max: 10 * 60 * 1000,
        default: 2 * 60 * 1000,
      },
    },
    Ghost: {
      Night: {
        min: 1 * 60 * 1000,
        max: 1 * 60 * 1000,
        default: 1 * 60 * 1000,
      },
      "Give Clue": {
        min: 1 * 60 * 1000,
        max: 3 * 60 * 1000,
        default: 2 * 60 * 1000,
      },
      Day: {
        min: 1 * 60 * 1000,
        max: 30 * 60 * 1000,
        default: 10 * 60 * 1000,
      },
      "Guess Word": {
        min: 1 * 60 * 1000,
        max: 3 * 60 * 1000,
        default: 2 * 60 * 1000,
      },
    },
    Jotto: {
      "Select Word": {
        min: 30 * 1000,
        max: 5 * 60 * 1000,
        default: 1 * 60 * 1000,
      },
      "Guess Word": {
        min: 30 * 1000,
        max: 5 * 60 * 1000,
        default: 1 * 60 * 1000,
      },
    },
    Acrotopia: {
      Day: {
        min: 1 * 60 * 1000,
        max: 5 * 60 * 1000,
        default: 5 * 60 * 1000,
      },
      Night: {
        min: 1 * 60 * 1000,
        max: 5 * 60 * 1000,
        default: 2 * 60 * 1000,
      },
    },
    "Secret Dictator": {
      Nomination: {
        min: 0.5 * 60 * 1000,
        max: 30 * 60 * 1000,
        default: 1 * 60 * 1000,
      },
      Election: {
        min: 0.5 * 60 * 1000,
        max: 30 * 60 * 1000,
        default: 2 * 60 * 1000,
      },
      "Legislative Session": {
        min: 1 * 60 * 1000,
        max: 15 * 60 * 1000,
        default: 2 * 60 * 1000,
      },
      "Executive Action": {
        min: 0.5 * 60 * 1000,
        max: 30 * 60 * 1000,
        default: 1 * 60 * 1000,
      },
      "Special Nomination": {
        min: 0.5 * 60 * 1000,
        max: 30 * 60 * 1000,
        default: 1 * 60 * 1000,
      },
    },
    "Wacky Words": {
      Day: {
        min: 1 * 60 * 1000,
        max: 5 * 60 * 1000,
        default: 5 * 60 * 1000,
      },
      Night: {
        min: 1 * 60 * 1000,
        max: 5 * 60 * 1000,
        default: 2 * 60 * 1000,
      },
    },
  },
  noQuotes: {},

  modifiers: modifiers,

  maxPlayers: 50,
  maxSpectators: 100,
  maxOwnedSetups: 100,
  maxFavSetups: 100,
  maxOwnedAnonymousDecks: 10,
  maxDeckNameLength: 25, // maxSetupNameLength
  minDeckSize: 5, // minMafiaSetupTotal
  maxDeckSize: 50, // maxPlayers
  maxNameLengthInDeck: 20, // maxUserNameLength

  maxGameMessageLength: 240,
  maxGameTextInputLength: 100,
  maxWillLength: 280,
  maxWillNewLines: 8,
  maxSetupNameLength: 25,
  gameReserveTime: 5 * 60 * 1000,
  minRolePlaysForPoints: 20,

  msgSpamSumLimit: 15,
  msgSpamRateLimit: 10,
  voteSpamSumLimit: 15,
  voteSpamRateLimit: 10,

  maxUserNameLength: 20,
  maxGroupNameLength: 20,
  maxCategoryNameLength: 20,
  maxBoardNameLength: 20,
  maxBoardDescLength: 60,
  maxThreadTitleLength: 50,
  maxThreadContentLength: 20000,
  maxReplyLength: 20000,
  threadsPerPage: 10,
  repliesPerPage: 20,
  recentReplyAmt: 3,
  newestThreadAmt: 1,
  boardRecentReplyAmt: 3,
  maxAnnouncementLength: 1000,

  maxChatMessageLength: 240,
  chatMessagesPerLoad: 20,
  maxChannelNameLength: 20,

  maxCommentLength: 500,
  maxLargeCommentLength: 2000,
  maxCommentLocationLength: 20,
  commentsPerPage: 10,

  lobbyPageSize: 14,
  modActionPageSize: 7,
  newestUsersPageSize: 7,
  announcementsPageSize: 7,

  userOnlineTTL: 1000 * 60,
  chatUserSearchAmt: 20,
  chatUserOnlineAmt: 50,
  mainUserSearchAmt: 20,
  mainUserOnlineAmt: 100,

  friendsPerPage: 10,
  referralGames: 5,
  referralCoins: 50,

  minMafiaSetupTotal: 3,
  captchaThreshold: 0.25,

  // Perms given to all users
  defaultPerms: [
    "signIn",
    "playGame",
    "createThread",
    "postReply",
    "vote",
    "deleteOwnPost",
    "editPost",
    "publicChat",
    "privateChat",
    "editBio",
    "changeName",
    "changeBday",
    "viewVotes",
  ],
  // Perms that can only be granted by a user with rank Infinity
  protectedPerms: [
    "createGroup",
    "giveGroup",
    "removeFromGroup",
    "updateGroupPerms",
    "givePermToAll",
    "clearAllIPs",
    "giveCoins",
    "changeUsersName",
    "scheduleRestart",
    "breakPortGames",
  ],
  // The list of all enabled perms
  allPerms: {
    signIn: true,
    playGame: true,
    createThread: true,
    postReply: true,
    vote: true,
    deleteOwnPost: true,
    editPost: true,
    publicChat: true,
    privateChat: true,
    editBio: true,
    changeName: true,
    changeBday: true,

    createCategory: true,
    deleteAnyPost: true,
    lockThreads: true,
    pinThreads: true,
    postInLocked: true,
    moveThread: true,
    createGroup: true,
    deleteGroup: true,
    giveGroup: true,
    removeFromGroup: true,
    updateGroupPerms: true,
    viewPerms: true,
    viewDeleted: true,
    restoreDeleted: true,
    createBoard: true,
    deleteBoard: true,
    updateBoard: true,
    createRoom: true,
    deleteRoom: true,
    deleteChatMessage: true,
    viewModActions: true,
    forumBan: true,
    chatBan: true,
    gameBan: true,
    rankedBan: true,
    competitiveBan: true,
    siteBan: true,
    forumUnban: true,
    chatUnban: true,
    gameUnban: true,
    rankedUnban: true,
    competitiveUnban: true,
    siteUnban: true,
    forceSignOut: true,
    viewIPs: true,
    viewAlts: true,
    viewFlagged: true,
    clearSetupName: true,
    clearBio: true,
    clearAvi: true,
    clearAccountDisplay: true,
    clearName: true,
    viewBans: true,
    noCooldowns: true,
    canSpectateAny: true,
    breakGame: true,
    clearAllIPs: true,
    featureSetup: true,
    deleteSetup: true,
    disableDeck: true,
    clearAllUserContent: true,
    giveCoins: true,
    changeUsersName: true,
    whitelist: true,
    scheduleRestart: true,
    disableAllCensors: true,
    breakPortGames: true,
    kick: true,
    announce: true,
    blockName: true,
    approvePending: true,
    reviewPrivate: true,
    approveRanked: true,
    approveCompetitive: true,
    playRanked: true,
    playCompetitive: true,
    viewVotes: true
  },
  defaultGroups: {
    Owner: {
      rank: Infinity,
      visible: false,
      perms: "*",
    },
    Dev: {
      rank: Infinity,
      visible: false,
      perms: [
        "createGroup",
        "deleteGroup",
        "giveGroup",
        "removeFromGroup",
        "updateGroupPerms",
        "viewPerms",
        "viewDeleted",
        "viewModActions",
        "forceSignOut",
        "viewIPs",
        "viewAlts",
        "viewBans",
        "noCooldowns",
        "canSpectateAny",
        "breakGame",
        "clearAllIPs",
        "giveCoins",
        "whitelist",
        "scheduleRestart",
        "disableAllCensors",
        "kick",
        "reviewPrivate",
      ],
    },
    Admin: {
      rank: 10,
      visible: true,
      perms: [
        "deleteAnyPost",
        "lockThreads",
        "pinThreads",
        "postInLocked",
        "moveThread",
        "createGroup",
        "giveGroup",
        "removeFromGroup",
        "updateGroupPerms",
        "viewPerms",
        "viewDeleted",
        "restoreDeleted",
        "createBoard",
        "updateBoard",
        "createRoom",
        "deleteRoom",
        "deleteChatMessage",
        "viewModActions",
        "forumBan",
        "chatBan",
        "gameBan",
        "rankedBan",
        "competitiveBan",
        "siteBan",
        "forumUnban",
        "chatUnban",
        "gameUnban",
        "rankedUnban",
        "competitiveUnban",
        "siteUnban",
        "forceSignOut",
        "viewAlts",
        "clearSetupName",
        "clearBio",
        "clearAvi",
        "clearAccountDisplay",
        "clearName",
        "viewBans",
        "canSpectateAny",
        "breakGame",
        "featureSetup",
        "deleteSetup",
        "disableDeck",
        "clearAllUserContent",
        "whitelist",
        "disableAllCensors",
        "kick",
        "announce",
        "viewFlagged",
        "blockName",
        "approvePending",
        "changeUsersName",
        "reviewPrivate",
        "approveRanked",
        "approveCompetitive",
        "playRanked",
        "playCompetitive",
      ],
    },
    "Head Mod": {
      rank: 6,
      visible: true,
      perms: [
        "deleteAnyPost",
        "lockThreads",
        "pinThreads",
        "postInLocked",
        "moveThread",
        "viewPerms",
        "viewDeleted",
        "restoreDeleted",
        "viewModActions",
        "deleteChatMessage",
        "forumBan",
        "chatBan",
        "gameBan",
        "rankedBan",
        "competitiveBan",
        "siteBan",
        "forumUnban",
        "chatUnban",
        "gameUnban",
        "rankedUnban",
        "competitiveUnban",
        "siteUnban",
        "forceSignOut",
        "viewAlts",
        "clearSetupName",
        "clearBio",
        "clearAvi",
        "clearAccountDisplay",
        "clearName",
        "viewBans",
        "canSpectateAny",
        "breakGame",
        "featureSetup",
        "deleteSetup",
        "disableDeck",
        "whitelist",
        "disableAllCensors",
        "kick",
        "announce",
        "viewFlagged",
        "blockName",
        "approvePending",
        "reviewPrivate",
        "approveRanked",
        "approveCompetitive",
        "playRanked",
        "playCompetitive",
      ],
    },
    Mod: {
      rank: 5,
      visible: true,
      perms: [
        "deleteAnyPost",
        "lockThreads",
        "pinThreads",
        "postInLocked",
        "moveThread",
        "viewPerms",
        "viewDeleted",
        "restoreDeleted",
        "viewModActions",
        "deleteChatMessage",
        "forumBan",
        "chatBan",
        "gameBan",
        "rankedBan",
        "competitiveBan",
        "siteBan",
        "forumUnban",
        "chatUnban",
        "gameUnban",
        "rankedUnban",
        "competitiveUnban",
        "siteUnban",
        "forceSignOut",
        "clearSetupName",
        "clearBio",
        "clearAvi",
        "clearAccountDisplay",
        "clearName",
        "viewBans",
        "canSpectateAny",
        "breakGame",
        "featureSetup",
        "deleteSetup",
        "disableDeck",
        "whitelist",
        "disableAllCensors",
        "kick",
        "announce",
        "viewFlagged",
        "approvePending",
        "reviewPrivate",
        "approveRanked",
        "approveCompetitive",
        "playRanked",
        "playCompetitive",
      ],
    },
    "Ranked Player": {
      rank: 0,
      visible: false,
      perms: ["playRanked"],
    },
    "Competitive Player": {
      rank: 0,
      visible: false,
      perms: ["playRanked", "playCompetitive"],
    },
  },

  rateLimits: rates,
};
import { badMathRandomWithStringSeed } from "../utilsFolder";

export const swears = [
  "ass",
  "asshole",
  "bastard",
  "bitch",
  "bitches",
  "cock",
  "crap",
  "cretin",
  "cunt",
  "dick",
  "dickhead",
  "dumbass",
  "fuck",
  "fucked",
  "fucking",
  "jackass",
  "motherfuck",
  "motherfucked",
  "motherfucker",
  "motherfucking",
  "pussy",
  "shit",
  "slut",
  "tit",
  "twat",
  "wanker",
  "whore",
];

// Replacements

const fruitsAndVegetables = [
  "🍇",
  "🍈",
  "🍉",
  "🍊",
  "🍋",
  "🍌",
  "🍍",
  "🥭",
  "🍎",
  "🍏",
  "🍐",
  "🍑",
  "🍒",
  "🍓",
  "🫐",
  "🥝",
  "🍅",
  "🫒",
  "🥥",
  "🥑",
  "🍆",
  "🥔",
  "🥕",
  "🌽",
  "🌶️",
  "🫑",
  "🥒",
  "🥬",
  "🥦",
  "🧄",
  "🧅",
  "🥜",
  "🫘",
  "🌰",
  "🫚",
  "🫛",
  ":boar:",
];

const swearReplacementArr = Array.from(new Set([...fruitsAndVegetables]));

export const getSwearReplacement = (seed) =>
  swearReplacementArr[
    Math.floor(badMathRandomWithStringSeed(seed) * swearReplacementArr.length)
  ];

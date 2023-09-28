type GameType = "Mafia" | "Split Decision" | "Resistance" | "One Night" | "Ghost" | "Jotto" | "Acrotopia" | "Secret Dictator";
type Lobby = "Mafia" | "Competitive" | "Games" | "Roleplay";

type AlignmentsType = {
    [key in GameType]: string[];
};

type GameStatesType = {
    [key in GameType]: string[];
};

type RatingThresholdsType = {
    wins: Record<string, unknown>;
    losses: Record<string, unknown>;
    abandons: Record<string, unknown>;
};

// Define and export constants with types
export const GameTypes: GameType[] = [
    "Mafia",
    "Split Decision",
    "Resistance",
    "One Night",
    "Ghost",
    "Jotto",
    "Acrotopia",
    "Secret Dictator",
];

export const Lobbies: Lobby[] = ["Mafia", "Competitive", "Games", "Roleplay"];

export const Alignments: AlignmentsType = {
    Mafia: ["Village", "Mafia", "Cult", "Independent", "Hostile"],
    "Split Decision": ["Blue", "Red", "Independent"],
    Resistance: ["Resistance", "Spies"],
    "One Night": ["Village", "Werewolves", "Independent"],
    Ghost: ["Town", "Ghost", "Host"],
    Jotto: ["Town"],
    Acrotopia: ["Town"],
    "Secret Dictator": ["Liberals", "Fascists"],
};

export const GameStates: GameStatesType = {
    Mafia: ["Day", "Night"],
    "Split Decision": ["Initial Round", "Hostage Swap"],
    Resistance: ["Team Selection", "Team Approval", "Mission"],
    "One Night": ["Day", "Night"],
    Ghost: ["Night", "Give Clue", "Day", "Guess Word"],
    Jotto: ["Select Word", "Guess Word"],
    Acrotopia: ["Day", "Night"],
    "Secret Dictator": [
        "Nomination",
        "Election",
        "Legislative Session",
        "Executive Action",
        "Special Nomination",
    ],
};

export const RatingThresholds: RatingThresholdsType = {
    wins: {},
    losses: {},
    abandons: {},
};

export const RequiredTotalForStats: number = 1;

export const MaxGameMessageLength: number = 240;
export const MaxTextInputLength: number = 100;
export const MaxWillLength: number = 100;

export const MaxGroupNameLength: number = 20;
export const MaxCategoryNameLength: number = 20;
export const MaxBoardNameLength: number = 20;
export const MaxBoardDescLength: number = 60;
export const MaxThreadTitleLength: number = 50;
export const MaxThreadContentLength: number = 5000;
export const MaxReplyLength: number = 1000;

export const MaxChatMessageLength: number = 240;

export const AlertFadeTimeout: number = 3000;
export const AlertFadeDuration: number = 500;

export const PreferredDeckId: string = "jWqL8KjS_";
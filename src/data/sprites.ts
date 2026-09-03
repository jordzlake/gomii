// Sprite catalogue. Every entry maps to a file cut from the uploaded tile maps,
// keeping the original grid position (sheet, row, frame) in its name.

export type Avatar = {
  id: string;
  name: string;
  blurb: string;
  sheet: string;
  row: number;
  frames: number;
};

const avatarNames: Record<string, [string, string][]> = {
  char1: [
    ["The Alchemist", "Brews something new in every pot"],
    ["The Healer", "Looks after people, starting with themselves"],
    ["The Aeronaut", "Charts the map, then flies off it"],
    ["The Athlete", "Adds one more rep, every time"],
    ["The Cook", "Turns raw ingredients into good days"],
    ["The Swimmer", "Moves through anything, calmly"],
  ],
  char2: [
    ["The Hauler", "Carries the load nobody else will"],
    ["The Companions", "Better with someone beside them"],
    ["The Painter", "Leaves colour wherever they pass"],
    ["The Bard", "Talks their way into every room"],
    ["The Scholar", "Reads first, decides second"],
    ["The Gardener", "Plants now, harvests much later"],
  ],
  char3: [
    ["The Photographer", "Notices what everyone walks past"],
    ["The Saver", "Small coins, long horizons"],
    ["The Early Riser", "Wins the morning before it starts"],
    ["The Monk", "Sits still until the noise stops"],
    ["The Skipper", "Finds rhythm in repetition"],
    ["The Dreamer", "Sleeps properly, on purpose"],
  ],
  char4: [
    ["The Mechanic", "Fixes what others replace"],
    ["The Herbalist", "Listens to quiet things"],
    ["The Orator", "Says the difficult thing out loud"],
    ["The Neighbour", "Gives away more than they keep"],
    ["The Packer", "Always half an hour from leaving"],
    ["The Magician", "Makes the impossible look routine"],
  ],
};

export const AVATARS: Avatar[] = Object.entries(avatarNames).flatMap(([sheet, rows]) =>
  rows.map(([name, blurb], row) => ({
    id: `${sheet}_r${row}`,
    name,
    blurb,
    sheet,
    row,
    frames: 5,
  }))
);

export function avatarFrame(id: string, frame: number) {
  const [sheet, row] = id.split("_");
  return `/sprites/characters/${sheet}_${row}_f${frame}.png`;
}

/** Effect strips from tile map 5: five frames each, index 0 = dormant, 4 = peak. */
export const EFFECTS = {
  growth: 0,
  flame: 1,
  chest: 2,
  idea: 3,
  trophy: 4,
} as const;

export type EffectName = keyof typeof EFFECTS;

export function effectFrame(name: EffectName, frame: number) {
  return `/sprites/effects/fx_r${EFFECTS[name]}_f${Math.max(0, Math.min(4, frame))}.png`;
}

/** Icon tile map: 8 x 8 grid, addressed by name so grid positions stay traceable. */
export const ICONS = {
  book: [0, 0], graduation: [0, 1], school: [0, 2], books: [0, 3],
  novel: [0, 4], notebook: [0, 5], laptop: [0, 6], brain: [0, 7],
  idea: [1, 0], flask: [1, 1], microscope: [1, 2], telescope: [1, 3],
  code: [1, 4], palette: [1, 5], music: [1, 6], mic: [1, 7],
  lipstick: [2, 0], camera: [2, 1], pencil: [2, 2], wand: [2, 3],
  trophy: [2, 4], medal: [2, 5], target: [2, 6], checklist: [2, 7],
  calendar: [3, 0], alarm: [3, 1], hourglass: [3, 2], search: [3, 3],
  rocket: [3, 4], briefcase: [3, 5], chart: [3, 6], moneybag: [3, 7],
  coin: [4, 0], piggybank: [4, 1], house: [4, 2], people: [4, 3],
  care: [4, 4], celebrate: [4, 5], chat: [4, 6], giftbox: [4, 7],
  heart: [5, 0], letter: [5, 1], globe: [5, 2], kindness: [5, 3],
  firstaid: [5, 4], shield: [5, 5], lotus: [5, 6], moon: [5, 7],
  water: [6, 0], apple: [6, 1], salad: [6, 2], soup: [6, 3],
  dumbbell: [6, 4], shoe: [6, 5], bicycle: [6, 6], mountain: [6, 7],
  plant: [7, 0], dog: [7, 1], plane: [7, 2], map: [7, 3],
  beach: [7, 4], camp: [7, 5], meditate: [7, 6], confetti: [7, 7],
} as const;

export type IconName = keyof typeof ICONS;

export function iconSrc(name: IconName) {
  const [r, c] = ICONS[name];
  return `/sprites/icons/icon_r${r}_c${c}.png`;
}

export const ICON_NAMES = Object.keys(ICONS) as IconName[];

/** Default icon for each preset category in tasks.json. */
export const CATEGORY_ICONS: Record<string, IconName> = {
  Books: "book",
  Cooking: "soup",
  Skills: "wand",
  Social: "chat",
  Travelling: "plane",
  Driving: "map",
  Movies: "camera",
  Swimming: "water",
};

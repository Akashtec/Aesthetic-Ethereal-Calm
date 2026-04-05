const subjects = [
  "A lone wanderer",
  "The forgotten princess",
  "A rogue mecha pilot",
  "The last spirit of the forest",
  "A time-traveling student",
  "An exiled star-child",
  "The silent guardian"
];

const actions = [
  "gazes at",
  "reaches out towards",
  "defends",
  "searches for",
  "dreams of",
  "whispers to",
  "stands before"
];

const objects = [
  "the shattered moon",
  "a glowing crystal",
  "the ancient ruins",
  "a fading memory",
  "the digital horizon",
  "an ethereal gateway",
  "the crimson dawn"
];

const settings = [
  "under a sky of falling stars.",
  "while the cherry blossoms drift away.",
  "in the neon-lit rain.",
  "at the edge of the world.",
  "within the silent void.",
  "as the timeline fractures.",
  "where shadows and light converge."
];

export function generateStory(): string {
  const subject = subjects[Math.floor(Math.random() * subjects.length)];
  const action = actions[Math.floor(Math.random() * actions.length)];
  const object = objects[Math.floor(Math.random() * objects.length)];
  const setting = settings[Math.floor(Math.random() * settings.length)];

  return `${subject} ${action} ${object} ${setting}`;
}

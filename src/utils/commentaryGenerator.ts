/**
 * Automated Cricket Commentary Generator
 * Generates rich, contextual commentary blocks for live ball events.
 */

const BOUNDARY_FOUR_TEMPLATES = [
  "FOUR! Beautiful cover drive, races away to the boundary.",
  "FOUR! Pierces the gap between point and cover fielders. Magnificent shot!",
  "FOUR! Cracking shot, pulled away ruthlessly through mid-wicket.",
  "FOUR! Flicked off the pads with sheer elegance. Timing at its best.",
  "FOUR! Cut away past backward point. No chance for the third man fielder."
];

const BOUNDARY_SIX_TEMPLATES = [
  "SIX! Massive hit over long-on! That went deep into the stands.",
  "SIX! Swept away high and handsome! Incredible power from the batsman.",
  "SIX! Clean connection, sails over cow corner. Magnificent bat swing!",
  "SIX! Smashed down the ground, bowler can only look in awe.",
  "SIX! Pulled over deep square leg, effortless pick-up shot!"
];

const DOT_BALL_TEMPLATES = [
  "No run. Played defensively back to the bowler.",
  "No run. Left alone outside off stump.",
  "No run. Steered straight to the fielder at point.",
  "No run. Solid defense from the crease.",
  "No run. Well bowled, beating the outside edge."
];

const SINGLE_RUN_TEMPLATES = [
  "1 run. Tucked away to deep mid-wicket for a single.",
  "1 run. Pushed into the gap at cover to rotate strike.",
  "1 run. Guided down to third man for an easy single.",
  "1 run. Played with soft hands, quick single taken."
];

const MULTI_RUN_TEMPLATES = [
  "2 runs. Nicely placed into the deep, hard running between wickets.",
  "2 runs. Driven through cover, fielders cut it off nearby boundary.",
  "3 runs. Swept fine, excellent work to prevent a boundary."
];

const WICKET_TEMPLATES = {
  Bowled: ["WICKET! Clean bowled. The stumps are in a mess!", "WICKET! Bowled! Complete breakdown of defense. Stumps shattered!"],
  Caught: ["WICKET! Caught! Threw away his wicket. Caught comfortably at deep mid-wicket.", "WICKET! Caught! Leading edge and a simple catch to the fielder at mid-off."],
  LBW: ["WICKET! LBW! Up goes the finger. Plumb in front!", "WICKET! Strike on the pads, loud appeal and given LBW!"],
  "Run Out": ["WICKET! Run Out! Tremendous throw from the fielder and he is well short of his crease!", "WICKET! Run out! Direct hit at the non-striker's end. Brilliant piece of fielding!"],
  Stumped: ["WICKET! Stumped! Dragged his foot out and the keeper does the rest in a flash!", "WICKET! Stumped! Slipped past the bat, keeper whipped the bails off in an instant."],
  "Hit Wicket": ["WICKET! Hit Wicket! Disastrous. He's knocked his own stumps down while attempting the pull!", "WICKET! Hit wicket! Stepped too far back and clips the leg stump."],
  "Retire Out": ["Retired Out! Batsman walks off to allow others to bat.", "Retired out. Tactically retired."]
};

const EXTRA_TEMPLATES = {
  Wide: ["Wide ball called by umpire. Sprayed down the leg side.", "Wide ball. Drifting too far outside off-stump."],
  "No Ball": ["No ball! Overstepped. Free hit coming up!", "No ball called! High full toss, batsman catches a break."],
  Bye: ["1 run (bye). Keeper misses it, batsmen steal a run.", "2 runs (byes). Sneaks past everyone."],
  "Leg Bye": ["1 run (leg bye). Deflected off the pads to square leg.", "2 runs (leg byes). Placed away fine off the legs."]
};

export function generateCommentary(
  batsmanName: string,
  bowlerName: string,
  runs: number,
  isWicket: boolean,
  wicketType?: keyof typeof WICKET_TEMPLATES,
  extraType?: keyof typeof EXTRA_TEMPLATES
): string {
  const getRand = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
  
  const prefix = `${bowlerName} to ${batsmanName}, `;

  if (isWicket) {
    const type = wicketType || "Bowled";
    const templates = WICKET_TEMPLATES[type] || WICKET_TEMPLATES.Bowled;
    return `${prefix}${getRand(templates)}`;
  }

  if (extraType) {
    const templates = EXTRA_TEMPLATES[extraType];
    const baseExtra = getRand(templates);
    if (extraType === "Wide" || extraType === "No Ball") {
      return `${prefix}${baseExtra}`;
    }
    return `${prefix}${baseExtra} (${runs} run${runs === 1 ? "" : "s"})`;
  }

  if (runs === 4) {
    return `${prefix}${getRand(BOUNDARY_FOUR_TEMPLATES)}`;
  }
  
  if (runs === 6) {
    return `${prefix}${getRand(BOUNDARY_SIX_TEMPLATES)}`;
  }

  if (runs === 0) {
    return `${prefix}${getRand(DOT_BALL_TEMPLATES)}`;
  }

  if (runs === 1) {
    return `${prefix}${getRand(SINGLE_RUN_TEMPLATES)}`;
  }

  // Runs 2, 3, 5, etc.
  return `${prefix}${getRand(MULTI_RUN_TEMPLATES).replace("2 runs", `${runs} runs`)}`;
}

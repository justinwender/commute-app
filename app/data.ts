export type DotColor = "green" | "amber" | "red" | "blue";

export interface Factor {
  val: string;
  dots: number | null;
  color: DotColor;
}

export interface Route {
  name: string;
  desc: string;
  rank: number;
  badge: "best" | "ok" | "bad";
  factors: Record<string, Factor>;
  note: string;
}

export type Origin = "hy" | "pa";
export type Weather = "good" | "bad";

export const DATA: Record<Origin, Record<Weather, Route[]>> = {
  hy: {
    good: [
      {
        name: "E (or C) → Spring St",
        desc: "Walk ~10 min to 34th-Penn, take E/C local to Spring St, walk ~5 min to 594 Broadway",
        rank: 1, badge: "best",
        factors: {
          "Above-ground walk": { val: "~15 min total", dots: 3, color: "amber" },
          "Underground walk": { val: "Minimal", dots: 1, color: "green" },
          "Transfers": { val: "None", dots: 1, color: "green" },
          "Reliability": { val: "E: moderate / C: poor", dots: 3, color: "amber" },
          "Crowding": { val: "High — loaded from Queens", dots: 4, color: "red" },
          "Est. time": { val: "~25 min", dots: null, color: "green" },
        },
        note: "Take whichever E or C arrives first — both stop at Spring St. Avoid boarding A by mistake (skips Spring St). Platform split at 34th: A is express, C/E share local platform. E arrives already crowded from Queens during morning rush.",
      },
      {
        name: "7 → Times Sq → E/C → Spring St",
        desc: "Walk ~2 min to HY station, ride 7 to Times Sq, transfer to E/C local, exit Spring St, walk ~5 min",
        rank: 2, badge: "ok",
        factors: {
          "Above-ground walk": { val: "~7 min total", dots: 1, color: "green" },
          "Underground walk": { val: "Times Sq transfer", dots: 2, color: "amber" },
          "Transfers": { val: "1 (Times Sq)", dots: 2, color: "amber" },
          "Reliability": { val: "7 excellent / E moderate", dots: 2, color: "green" },
          "Crowding": { val: "7 light (reverse peak)", dots: 1, color: "green" },
          "Est. time": { val: "~28–33 min", dots: null, color: "green" },
        },
        note: "You board the 7 outbound toward Times Sq — reverse peak direction, so trains are lightly loaded. Good reliability on the 7. The E leg picks up some crowding but it's a short ride.",
      },
      {
        name: "7 → Times Sq → R/W → Prince St",
        desc: "Walk ~2 min to HY station, ride 7 to Times Sq, transfer to R/W, exit Prince St, walk ~3 min north",
        rank: 3, badge: "ok",
        factors: {
          "Above-ground walk": { val: "~5 min total", dots: 1, color: "green" },
          "Underground walk": { val: "Times Sq transfer", dots: 2, color: "amber" },
          "Transfers": { val: "1 (Times Sq)", dots: 2, color: "amber" },
          "Reliability": { val: "R: ~80% OTP / W: limited hrs", dots: 2, color: "amber" },
          "Crowding": { val: "7 light (reverse peak) / R low", dots: 1, color: "green" },
          "Est. time": { val: "~30–35 min", dots: null, color: "green" },
        },
        note: "Prince St is 2 blocks closer to 594 than Spring St. Both 7 and R legs are comfortable — 7 is reverse peak, R is lightly used in this segment. W runs limited service so don't count on it. Rising car-problem incidents on R in 2025 are worth watching.",
      },
    ],
    bad: [
      {
        name: "7 → Times Sq → E/C → Spring St",
        desc: "Walk ~2 min to HY station, ride 7 to Times Sq, transfer to E/C local, exit Spring St, walk ~5 min",
        rank: 1, badge: "best",
        factors: {
          "Above-ground walk": { val: "~7 min total", dots: 1, color: "green" },
          "Underground walk": { val: "Times Sq transfer", dots: 2, color: "amber" },
          "Transfers": { val: "1 (Times Sq)", dots: 2, color: "amber" },
          "Reliability": { val: "7 excellent / E moderate", dots: 2, color: "green" },
          "Crowding": { val: "7 light (reverse peak)", dots: 1, color: "green" },
          "Est. time": { val: "~28–33 min", dots: null, color: "green" },
        },
        note: "In bad weather this jumps to #1 — the 7 is 2 min from your door, reverse-peak so comfortable, and keeps you underground to Times Sq. The E leg is crowded but short. Saves the 10-min walk to Penn entirely.",
      },
      {
        name: "7 → Times Sq → R/W → Prince St",
        desc: "Walk ~2 min to HY station, ride 7 to Times Sq, transfer to R/W, exit Prince St, walk ~3 min",
        rank: 2, badge: "ok",
        factors: {
          "Above-ground walk": { val: "~5 min total", dots: 1, color: "green" },
          "Underground walk": { val: "Times Sq transfer", dots: 2, color: "amber" },
          "Transfers": { val: "1 (Times Sq)", dots: 2, color: "amber" },
          "Reliability": { val: "R: ~80% OTP / W: limited hrs", dots: 2, color: "amber" },
          "Crowding": { val: "7 light (reverse peak) / R low", dots: 1, color: "green" },
          "Est. time": { val: "~30–35 min", dots: null, color: "green" },
        },
        note: "Best egress of any option — 3 min from Prince St to 594. Slightly longer ride than E/C route and depends on R/W timing. Don't wait more than a few minutes; fall back to E/C.",
      },
      {
        name: "E (or C) → Spring St",
        desc: "Walk ~10 min to 34th-Penn, take E/C local to Spring St, walk ~5 min",
        rank: 3, badge: "bad",
        factors: {
          "Above-ground walk": { val: "~15 min total", dots: 3, color: "red" },
          "Underground walk": { val: "Minimal", dots: 1, color: "green" },
          "Transfers": { val: "None", dots: 1, color: "green" },
          "Reliability": { val: "E: moderate / C: poor", dots: 3, color: "amber" },
          "Crowding": { val: "High — loaded from Queens", dots: 4, color: "red" },
          "Est. time": { val: "~25 min + wet", dots: null, color: "green" },
        },
        note: "Good-weather default falls to last in bad weather. 15 min of exposure to get to Penn, then a crowded E. The transfer options via the 7 are strictly better when weather is a factor.",
      },
    ],
  },
  pa: {
    good: [
      {
        name: "E (or C) → Spring St",
        desc: "Walk downstairs in PABT to A/C/E platform, take E/C to Spring St, walk ~5 min to 594 Broadway",
        rank: 1, badge: "best",
        factors: {
          "Above-ground walk": { val: "~5 min (egress only)", dots: 1, color: "green" },
          "Underground walk": { val: "Minimal (PABT→platform)", dots: 1, color: "green" },
          "Transfers": { val: "None", dots: 1, color: "green" },
          "Reliability": { val: "E: moderate / C: poor", dots: 2, color: "amber" },
          "Crowding": { val: "High — loaded from Queens", dots: 4, color: "red" },
          "Est. time": { val: "~18–22 min", dots: null, color: "green" },
        },
        note: "Structurally the cleanest route despite E crowding — you're already in the complex, zero transfer, short egress. Crowding is uncomfortable but the ride is only a few stops. C and E share the platform at 42nd, take whichever comes first.",
      },
      {
        name: "R/W → Prince St",
        desc: "Walk through Times Sq complex underground to R/W platform, ride to Prince St, walk ~3 min north",
        rank: 2, badge: "ok",
        factors: {
          "Above-ground walk": { val: "~3 min (egress only)", dots: 1, color: "green" },
          "Underground walk": { val: "~5–7 min to R/W platform", dots: 2, color: "amber" },
          "Transfers": { val: "None (one-seat ride)", dots: 1, color: "green" },
          "Reliability": { val: "R: ~80% OTP / W: limited hrs", dots: 2, color: "amber" },
          "Crowding": { val: "R low — lightly used segment", dots: 1, color: "green" },
          "Est. time": { val: "~22–28 min", dots: null, color: "green" },
        },
        note: "Better comfort than the E — R is much less loaded through this segment. Prince St also puts you 2 blocks closer to 594 than Spring St. The underground walk to the R/W platform is the only cost. Rising car-problem incidents on R in 2025 are worth watching.",
      },
      {
        name: "E/C → W4 → BDFM → Broadway-Lafayette",
        desc: "Take E/C to West 4th, transfer to B/D/F/M uptown, exit Broadway-Lafayette (1 min to 594)",
        rank: 3, badge: "bad",
        factors: {
          "Above-ground walk": { val: "Minimal (~1 min egress)", dots: 1, color: "green" },
          "Underground walk": { val: "W4 transfer platform", dots: 2, color: "amber" },
          "Transfers": { val: "1 (West 4th)", dots: 2, color: "amber" },
          "Reliability": { val: "B 65% / D 72% / F 70%", dots: 4, color: "red" },
          "Crowding": { val: "6th Ave trunk busy", dots: 3, color: "amber" },
          "Est. time": { val: "~25–35 min", dots: null, color: "green" },
        },
        note: "Broadway-Lafayette is essentially the front door of 594, but the 6th Ave trunk is the least reliable in the system and a missed connection at W4 can cost 10+ minutes. Not worth the gamble.",
      },
      {
        name: "Times Sq connector → BDFM → Broadway-Lafayette",
        desc: "Walk through Times Sq/Bryant Park connector underground, board B/D/F/M at Bryant Park, one stop to Broadway-Lafayette",
        rank: 4, badge: "bad",
        factors: {
          "Above-ground walk": { val: "None", dots: 1, color: "green" },
          "Underground walk": { val: "~7–10 min connector walk", dots: 3, color: "amber" },
          "Transfers": { val: "None (one-seat from Bryant Pk)", dots: 1, color: "green" },
          "Reliability": { val: "B 65% / D 72% / F 70%", dots: 4, color: "red" },
          "Crowding": { val: "6th Ave trunk busy", dots: 3, color: "amber" },
          "Est. time": { val: "~25–32 min", dots: null, color: "green" },
        },
        note: "Fully underground with no transfer once on the train, but the connector walk is substantial and you're at the mercy of the worst-reliability trunk in the system. Connector open 6am–midnight only.",
      },
    ],
    bad: [
      {
        name: "R/W → Prince St",
        desc: "Walk through Times Sq complex underground to R/W platform, ride to Prince St, walk ~3 min north",
        rank: 1, badge: "best",
        factors: {
          "Above-ground walk": { val: "~3 min (egress only)", dots: 1, color: "green" },
          "Underground walk": { val: "~5–7 min to R/W platform", dots: 2, color: "amber" },
          "Transfers": { val: "None (one-seat ride)", dots: 1, color: "green" },
          "Reliability": { val: "R: ~80% OTP / W: limited hrs", dots: 2, color: "amber" },
          "Crowding": { val: "R low — lightly used segment", dots: 1, color: "green" },
          "Est. time": { val: "~22–28 min", dots: null, color: "green" },
        },
        note: "Jumps to #1 in bad weather — comfortable ride, minimal exposure (only 3 min outdoors at Prince St), and better reliability than the BDFM connector option. The underground walk to the R/W platform is the tradeoff but it's all sheltered.",
      },
      {
        name: "E (or C) → Spring St",
        desc: "Walk downstairs in PABT to A/C/E platform, take E/C to Spring St, walk ~5 min to 594 Broadway",
        rank: 2, badge: "ok",
        factors: {
          "Above-ground walk": { val: "~5 min (egress only)", dots: 1, color: "amber" },
          "Underground walk": { val: "Minimal (PABT→platform)", dots: 1, color: "green" },
          "Transfers": { val: "None", dots: 1, color: "green" },
          "Reliability": { val: "E: moderate / C: poor", dots: 2, color: "amber" },
          "Crowding": { val: "High — loaded from Queens", dots: 4, color: "red" },
          "Est. time": { val: "~18–22 min", dots: null, color: "green" },
        },
        note: "Still fast and structurally simple. 5 min outdoor walk is manageable in light rain. Falls behind R/W in bad weather mainly because Prince St is closer to 594 and the R is far more comfortable to ride.",
      },
      {
        name: "Times Sq connector → BDFM → Broadway-Lafayette",
        desc: "Walk through Times Sq/Bryant Park connector underground, board B/D/F/M at Bryant Park, one stop to Broadway-Lafayette",
        rank: 3, badge: "ok",
        factors: {
          "Above-ground walk": { val: "None (fully underground)", dots: 1, color: "green" },
          "Underground walk": { val: "~7–10 min connector walk", dots: 3, color: "amber" },
          "Transfers": { val: "None (one-seat from Bryant Pk)", dots: 1, color: "green" },
          "Reliability": { val: "B 65% / D 72% / F 70%", dots: 4, color: "red" },
          "Crowding": { val: "6th Ave trunk busy", dots: 3, color: "amber" },
          "Est. time": { val: "~25–32 min", dots: null, color: "green" },
        },
        note: "Zero outdoor exposure is the only argument for this in bad weather. But the BDFM reliability penalty is severe enough that it stays in third — you could easily add 10+ min waiting on a delayed train. Connector open 6am–midnight only.",
      },
    ],
  },
};

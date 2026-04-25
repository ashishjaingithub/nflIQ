import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Home, Trophy, TrendingUp, Star, Shield, Zap, Target, Lock,
  RefreshCw, ArrowRight, MapPin, Activity, Send, Users,
  Crosshair, Briefcase, Award, AlertTriangle, ChevronDown,
  Play, Sparkles, BarChart3, Repeat, MessageSquare,
} from "lucide-react";

const COLORS = {
  bg:        "#f6f8fa",   // canvas.subtle (page background)
  surface:   "#ffffff",   // canvas.default (card background)
  raised:    "#eef1f5",   // canvas.inset (dropdowns, raised chips)
  border:    "#d0d7de",   // border.default
  text:      "#1f2328",   // fg.default (near-black, never pure)
  textSec:   "#59636e",   // fg.muted (secondary text)
  textMute:  "#818b98",   // fg.subtle (least-important labels)
  green:     "#1a7f37",   // success.fg (4.5:1 on white)
  red:       "#cf222e",   // danger.fg
  blue:      "#0969da",   // accent.fg
  gold:      "#bf8700",   // attention.fg (warmer than fg.muted-yellow)
};

// Type scale (px). Tuned for arm's-length tablet viewing at a STEM fair.
const TYPE = {
  title:        34,
  teamNameLg:   26,
  teamNameMd:   22,
  probHero:     72,
  probSticky:   56,
  resultName:   32,
  factorLabel:  18,
  factorDesc:   15,
  body:         15,
  pillLabel:    12,
  pillValue:    16,
  caps:         13,
  small:        12,
};

// === Color contrast helpers (WCAG-aware) ===
function _hexToRgb(hex) {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function _rgbToHex(r, g, b) {
  const c = (x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, "0");
  return "#" + c(r) + c(g) + c(b);
}
function relLum(hex) {
  const [r, g, b] = _hexToRgb(hex).map((v) => v / 255);
  const f = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function contrastRatio(a, b) {
  const L1 = relLum(a), L2 = relLum(b);
  const hi = Math.max(L1, L2), lo = Math.min(L1, L2);
  return (hi + 0.05) / (lo + 0.05);
}
function lighten(hex, amount) {
  const [r, g, b] = _hexToRgb(hex);
  return _rgbToHex(r + amount * 255, g + amount * 255, b + amount * 255);
}
function darken(hex, amount) {
  const [r, g, b] = _hexToRgb(hex);
  return _rgbToHex(r - amount * 255, g - amount * 255, b - amount * 255);
}
// Pick a foreground color for `team` against `bg` that meets WCAG AA (4.5:1).
// Algorithm: primary → primary darkened/lightened until passable → secondary →
// secondary adjusted → fallback text. Direction is chosen by bg luminance:
// dark bg => lighten; light bg => darken. This way "Steelers gold" stays gold
// (just deepened) instead of jumping to black on a white surface.
function fgColor(team, bg = COLORS.surface) {
  if (!team) return COLORS.text;
  const bgIsDark = relLum(bg) < 0.4;
  const adjust = bgIsDark ? lighten : darken;
  const tryColor = (c) => {
    if (!c) return null;
    if (contrastRatio(c, bg) >= 4.5) return c;
    let v = c;
    for (let i = 0; i < 14 && contrastRatio(v, bg) < 4.5; i++) v = adjust(v, 0.07);
    return contrastRatio(v, bg) >= 4.5 ? v : null;
  };
  return tryColor(team.primary) || tryColor(team.secondary) || COLORS.text;
}

const ICON_MAP = {
  Home, Trophy, TrendingUp, Star, Shield, Zap, Target, Lock,
  RefreshCw, ArrowRight, MapPin, Activity, Send, Users,
  Crosshair, Briefcase, Award, AlertTriangle,
};

// === NFL_TEAMS data (spliced in by build) ===
const NFL_TEAMS = [
  {
    "id": "cardinals",
    "name": "Arizona Cardinals",
    "city": "Arizona",
    "abbr": "ARI",
    "conference": "NFC",
    "division": "West",
    "primary": "#97233F",
    "secondary": "#000000",
    "record": {
      "w": 3,
      "l": 14,
      "t": 0
    },
    "pointsPerGame": 20.9,
    "pointsAllowed": 28.7,
    "qb": {
      "name": "Jacoby Brissett",
      "passerRating": 94.1,
      "touchdowns": 23,
      "interceptions": 8,
      "completionPct": 64.9,
      "grade": 3.3
    },
    "offenseLine": {
      "grade": 2.2
    },
    "defenseLine": {
      "grade": 2.2
    },
    "rushOffense": {
      "yardsPerGame": 93.1,
      "grade": 1.3
    },
    "passOffense": {
      "yardsPerGame": 256.1,
      "grade": 8.8
    },
    "rushDefense": {
      "yardsAllowed": 125.7,
      "grade": 3.9
    },
    "passDefense": {
      "yardsAllowed": 232.4,
      "grade": 3.9
    },
    "thirdDownPct": 33.1,
    "redZonePct": 51.4,
    "turnoverDiff": 1,
    "specialTeams": {
      "fgPct": 75.8,
      "grade": 1.6
    },
    "coach": {
      "name": "Jonathan Gannon",
      "grade": 6.2
    },
    "homeField": {
      "stadium": "State Farm Stadium",
      "isOutdoor": false,
      "homeWinPct": 12.5,
      "advantageGrade": 1.3
    },
    "recentForm": [
      "L",
      "L",
      "L",
      "L",
      "L"
    ],
    "keyPlayers": {
      "wr1": {
        "name": "Michael Wilson",
        "grade": 5.9
      },
      "rb1": {
        "name": "Michael Carter",
        "grade": 1.0
      },
      "cb1": {
        "name": "Denzel Burke",
        "grade": 6.8
      },
      "pass_rusher": {
        "name": "Josh Sweat",
        "grade": 8.0
      }
    },
    "injuryImpact": 0.0,
    "playoffExperience": 3.5
  },
  {
    "id": "falcons",
    "name": "Atlanta Falcons",
    "city": "Atlanta",
    "abbr": "ATL",
    "conference": "NFC",
    "division": "South",
    "primary": "#A71930",
    "secondary": "#000000",
    "record": {
      "w": 8,
      "l": 9,
      "t": 0
    },
    "pointsPerGame": 20.8,
    "pointsAllowed": 23.6,
    "qb": {
      "name": "Michael Penix Jr.",
      "passerRating": 88.5,
      "touchdowns": 9,
      "interceptions": 3,
      "completionPct": 60.1,
      "grade": 4.5
    },
    "offenseLine": {
      "grade": 9.1
    },
    "defenseLine": {
      "grade": 9.7
    },
    "rushOffense": {
      "yardsPerGame": 125.8,
      "grade": 8.0
    },
    "passOffense": {
      "yardsPerGame": 217.8,
      "grade": 4.5
    },
    "rushDefense": {
      "yardsAllowed": 93.0,
      "grade": 8.8
    },
    "passDefense": {
      "yardsAllowed": 187.3,
      "grade": 9.7
    },
    "thirdDownPct": 33.8,
    "redZonePct": 52.2,
    "turnoverDiff": 9,
    "specialTeams": {
      "fgPct": 82.1,
      "grade": 3.3
    },
    "coach": {
      "name": "Raheem Morris",
      "grade": 6.8
    },
    "homeField": {
      "stadium": "Mercedes-Benz Stadium",
      "isOutdoor": false,
      "homeWinPct": 50.0,
      "advantageGrade": 4.8
    },
    "recentForm": [
      "W",
      "W",
      "W",
      "W",
      "L"
    ],
    "keyPlayers": {
      "wr1": {
        "name": "Drake London",
        "grade": 5.1
      },
      "rb1": {
        "name": "Bijan Robinson",
        "grade": 9.1
      },
      "cb1": {
        "name": "Dee Alford",
        "grade": 7.4
      },
      "pass_rusher": {
        "name": "James Pearce Jr.",
        "grade": 7.1
      }
    },
    "injuryImpact": 0.0,
    "playoffExperience": 4.0
  },
  {
    "id": "ravens",
    "name": "Baltimore Ravens",
    "city": "Baltimore",
    "abbr": "BAL",
    "conference": "AFC",
    "division": "North",
    "primary": "#241773",
    "secondary": "#9E7C0C",
    "record": {
      "w": 8,
      "l": 9,
      "t": 0
    },
    "pointsPerGame": 24.9,
    "pointsAllowed": 23.4,
    "qb": {
      "name": "Lamar Jackson",
      "passerRating": 103.8,
      "touchdowns": 21,
      "interceptions": 7,
      "completionPct": 63.6,
      "grade": 5.4
    },
    "offenseLine": {
      "grade": 4.2
    },
    "defenseLine": {
      "grade": 1.9
    },
    "rushOffense": {
      "yardsPerGame": 156.6,
      "grade": 9.7
    },
    "passOffense": {
      "yardsPerGame": 192.8,
      "grade": 2.2
    },
    "rushDefense": {
      "yardsAllowed": 129.7,
      "grade": 3.3
    },
    "passDefense": {
      "yardsAllowed": 234.8,
      "grade": 3.6
    },
    "thirdDownPct": 41.6,
    "redZonePct": 61.9,
    "turnoverDiff": 2,
    "specialTeams": {
      "fgPct": 88.2,
      "grade": 6.8
    },
    "coach": {
      "name": "John Harbaugh",
      "grade": 9.2
    },
    "homeField": {
      "stadium": "M&T Bank Stadium",
      "isOutdoor": true,
      "homeWinPct": 33.3,
      "advantageGrade": 3.0
    },
    "recentForm": [
      "L",
      "W",
      "L",
      "W",
      "L"
    ],
    "keyPlayers": {
      "wr1": {
        "name": "Zay Flowers",
        "grade": 8.5
      },
      "rb1": {
        "name": "Derrick Henry",
        "grade": 9.7
      },
      "cb1": {
        "name": "Nate Wiggins",
        "grade": 8.5
      },
      "pass_rusher": {
        "name": "Dre'Mont Jones",
        "grade": 3.3
      }
    },
    "injuryImpact": 0.0,
    "playoffExperience": 8.5
  },
  {
    "id": "bills",
    "name": "Buffalo Bills",
    "city": "Buffalo",
    "abbr": "BUF",
    "conference": "AFC",
    "division": "East",
    "primary": "#00338D",
    "secondary": "#C60C30",
    "record": {
      "w": 12,
      "l": 5,
      "t": 0
    },
    "pointsPerGame": 28.3,
    "pointsAllowed": 21.5,
    "qb": {
      "name": "Josh Allen",
      "passerRating": 102.2,
      "touchdowns": 25,
      "interceptions": 10,
      "completionPct": 69.3,
      "grade": 8.3
    },
    "offenseLine": {
      "grade": 4.8
    },
    "defenseLine": {
      "grade": 4.8
    },
    "rushOffense": {
      "yardsPerGame": 159.6,
      "grade": 10.0
    },
    "passOffense": {
      "yardsPerGame": 234.2,
      "grade": 6.5
    },
    "rushDefense": {
      "yardsAllowed": 100.3,
      "grade": 7.7
    },
    "passDefense": {
      "yardsAllowed": 223.1,
      "grade": 5.1
    },
    "thirdDownPct": 46.7,
    "redZonePct": 68.3,
    "turnoverDiff": 4,
    "specialTeams": {
      "fgPct": 90.5,
      "grade": 8.0
    },
    "coach": {
      "name": "Sean McDermott",
      "grade": 8.0
    },
    "homeField": {
      "stadium": "Highmark Stadium",
      "isOutdoor": true,
      "homeWinPct": 77.8,
      "advantageGrade": 9.4
    },
    "recentForm": [
      "W",
      "L",
      "W",
      "W",
      "W"
    ],
    "keyPlayers": {
      "wr1": {
        "name": "Khalil Shakir",
        "grade": 3.0
      },
      "rb1": {
        "name": "James Cook",
        "grade": 10.0
      },
      "cb1": {
        "name": "Taron Johnson",
        "grade": 1.0
      },
      "pass_rusher": {
        "name": "Greg Rousseau",
        "grade": 3.0
      }
    },
    "injuryImpact": 0.0,
    "playoffExperience": 8.0
  },
  {
    "id": "panthers",
    "name": "Carolina Panthers",
    "city": "Carolina",
    "abbr": "CAR",
    "conference": "NFC",
    "division": "South",
    "primary": "#0085CA",
    "secondary": "#101820",
    "record": {
      "w": 8,
      "l": 9,
      "t": 0
    },
    "pointsPerGame": 18.3,
    "pointsAllowed": 22.4,
    "qb": {
      "name": "Bryce Young",
      "passerRating": 87.8,
      "touchdowns": 23,
      "interceptions": 11,
      "completionPct": 63.6,
      "grade": 2.7
    },
    "offenseLine": {
      "grade": 6.8
    },
    "defenseLine": {
      "grade": 1.6
    },
    "rushOffense": {
      "yardsPerGame": 116.3,
      "grade": 4.8
    },
    "passOffense": {
      "yardsPerGame": 194.4,
      "grade": 2.5
    },
    "rushDefense": {
      "yardsAllowed": 143.0,
      "grade": 1.3
    },
    "passDefense": {
      "yardsAllowed": 225.4,
      "grade": 4.8
    },
    "thirdDownPct": 31.8,
    "redZonePct": 49.7,
    "turnoverDiff": 1,
    "specialTeams": {
      "fgPct": 82.8,
      "grade": 3.9
    },
    "coach": {
      "name": "Dave Canales",
      "grade": 5.5
    },
    "homeField": {
      "stadium": "Bank of America Stadium",
      "isOutdoor": true,
      "homeWinPct": 62.5,
      "advantageGrade": 6.8
    },
    "recentForm": [
      "L",
      "L",
      "W",
      "L",
      "W"
    ],
    "keyPlayers": {
      "wr1": {
        "name": "Tetairoa McMillan",
        "grade": 7.1
      },
      "rb1": {
        "name": "Rico Dowdle",
        "grade": 6.2
      },
      "cb1": {
        "name": "Mike Jackson",
        "grade": 10.0
      },
      "pass_rusher": {
        "name": "Derrick Brown",
        "grade": 1.3
      }
    },
    "injuryImpact": 0.0,
    "playoffExperience": 2.5
  },
  {
    "id": "bears",
    "name": "Chicago Bears",
    "city": "Chicago",
    "abbr": "CHI",
    "conference": "NFC",
    "division": "North",
    "primary": "#0B162A",
    "secondary": "#C83803",
    "record": {
      "w": 11,
      "l": 6,
      "t": 0
    },
    "pointsPerGame": 25.9,
    "pointsAllowed": 24.4,
    "qb": {
      "name": "Caleb Williams",
      "passerRating": 90.1,
      "touchdowns": 27,
      "interceptions": 7,
      "completionPct": 58.1,
      "grade": 6.5
    },
    "offenseLine": {
      "grade": 9.4
    },
    "defenseLine": {
      "grade": 3.9
    },
    "rushOffense": {
      "yardsPerGame": 144.2,
      "grade": 9.4
    },
    "passOffense": {
      "yardsPerGame": 234.8,
      "grade": 6.8
    },
    "rushDefense": {
      "yardsAllowed": 137.0,
      "grade": 2.2
    },
    "passDefense": {
      "yardsAllowed": 200.6,
      "grade": 8.0
    },
    "thirdDownPct": 43.6,
    "redZonePct": 64.4,
    "turnoverDiff": 23,
    "specialTeams": {
      "fgPct": 84.6,
      "grade": 5.1
    },
    "coach": {
      "name": "Ben Johnson",
      "grade": 7.0
    },
    "homeField": {
      "stadium": "Soldier Field",
      "isOutdoor": true,
      "homeWinPct": 75.0,
      "advantageGrade": 8.5
    },
    "recentForm": [
      "L",
      "L",
      "W",
      "W",
      "L"
    ],
    "keyPlayers": {
      "wr1": {
        "name": "DJ Moore",
        "grade": 2.5
      },
      "rb1": {
        "name": "D'Andre Swift",
        "grade": 6.8
      },
      "cb1": {
        "name": "Nahshon Wright",
        "grade": 9.1
      },
      "pass_rusher": {
        "name": "Montez Sweat",
        "grade": 6.5
      }
    },
    "injuryImpact": 0.0,
    "playoffExperience": 3.0
  },
  {
    "id": "bengals",
    "name": "Cincinnati Bengals",
    "city": "Cincinnati",
    "abbr": "CIN",
    "conference": "AFC",
    "division": "North",
    "primary": "#FB4F14",
    "secondary": "#000000",
    "record": {
      "w": 6,
      "l": 11,
      "t": 0
    },
    "pointsPerGame": 24.4,
    "pointsAllowed": 28.9,
    "qb": {
      "name": "Joe Flacco",
      "passerRating": 79.2,
      "touchdowns": 15,
      "interceptions": 10,
      "completionPct": 60.3,
      "grade": 2.2
    },
    "offenseLine": {
      "grade": 6.2
    },
    "defenseLine": {
      "grade": 3.6
    },
    "rushOffense": {
      "yardsPerGame": 93.6,
      "grade": 1.9
    },
    "passOffense": {
      "yardsPerGame": 249.6,
      "grade": 8.3
    },
    "rushDefense": {
      "yardsAllowed": 145.0,
      "grade": 1.0
    },
    "passDefense": {
      "yardsAllowed": 219.2,
      "grade": 5.6
    },
    "thirdDownPct": 37.1,
    "redZonePct": 56.4,
    "turnoverDiff": 0,
    "specialTeams": {
      "fgPct": 89.3,
      "grade": 7.7
    },
    "coach": {
      "name": "Zac Taylor",
      "grade": 7.5
    },
    "homeField": {
      "stadium": "Paycor Stadium",
      "isOutdoor": true,
      "homeWinPct": 33.3,
      "advantageGrade": 2.7
    },
    "recentForm": [
      "L",
      "W",
      "W",
      "L",
      "L"
    ],
    "keyPlayers": {
      "wr1": {
        "name": "Ja'Marr Chase",
        "grade": 9.1
      },
      "rb1": {
        "name": "Chase Brown",
        "grade": 5.4
      },
      "cb1": {
        "name": "Daxton Hill",
        "grade": 5.6
      },
      "pass_rusher": {
        "name": "Myles Murphy",
        "grade": 1.6
      }
    },
    "injuryImpact": 0.0,
    "playoffExperience": 6.5
  },
  {
    "id": "browns",
    "name": "Cleveland Browns",
    "city": "Cleveland",
    "abbr": "CLE",
    "conference": "AFC",
    "division": "North",
    "primary": "#311D00",
    "secondary": "#FF3C00",
    "record": {
      "w": 5,
      "l": 12,
      "t": 0
    },
    "pointsPerGame": 16.4,
    "pointsAllowed": 22.3,
    "qb": {
      "name": "Shedeur Sanders",
      "passerRating": 68.1,
      "touchdowns": 7,
      "interceptions": 10,
      "completionPct": 56.6,
      "grade": 1.6
    },
    "offenseLine": {
      "grade": 2.7
    },
    "defenseLine": {
      "grade": 9.4
    },
    "rushOffense": {
      "yardsPerGame": 97.0,
      "grade": 2.5
    },
    "passOffense": {
      "yardsPerGame": 185.4,
      "grade": 1.3
    },
    "rushDefense": {
      "yardsAllowed": 85.0,
      "grade": 10.0
    },
    "passDefense": {
      "yardsAllowed": 207.6,
      "grade": 7.1
    },
    "thirdDownPct": 28.7,
    "redZonePct": 45.8,
    "turnoverDiff": -4,
    "specialTeams": {
      "fgPct": 88.9,
      "grade": 7.4
    },
    "coach": {
      "name": "Kevin Stefanski",
      "grade": 6.5
    },
    "homeField": {
      "stadium": "Huntington Bank Field",
      "isOutdoor": true,
      "homeWinPct": 33.3,
      "advantageGrade": 2.5
    },
    "recentForm": [
      "W",
      "W",
      "L",
      "L",
      "L"
    ],
    "keyPlayers": {
      "wr1": {
        "name": "Jerry Jeudy",
        "grade": 1.9
      },
      "rb1": {
        "name": "Quinshon Judkins",
        "grade": 3.9
      },
      "cb1": {
        "name": "Tyson Campbell",
        "grade": 8.3
      },
      "pass_rusher": {
        "name": "Myles Garrett",
        "grade": 10.0
      }
    },
    "injuryImpact": 0.0,
    "playoffExperience": 3.5
  },
  {
    "id": "cowboys",
    "name": "Dallas Cowboys",
    "city": "Dallas",
    "abbr": "DAL",
    "conference": "NFC",
    "division": "East",
    "primary": "#003594",
    "secondary": "#869397",
    "record": {
      "w": 7,
      "l": 9,
      "t": 1
    },
    "pointsPerGame": 27.7,
    "pointsAllowed": 30.1,
    "qb": {
      "name": "Dak Prescott",
      "passerRating": 99.5,
      "touchdowns": 30,
      "interceptions": 10,
      "completionPct": 67.3,
      "grade": 9.4
    },
    "offenseLine": {
      "grade": 7.7
    },
    "defenseLine": {
      "grade": 3.3
    },
    "rushOffense": {
      "yardsPerGame": 125.6,
      "grade": 7.7
    },
    "passOffense": {
      "yardsPerGame": 278.5,
      "grade": 10.0
    },
    "rushDefense": {
      "yardsAllowed": 106.3,
      "grade": 6.8
    },
    "passDefense": {
      "yardsAllowed": 250.3,
      "grade": 1.6
    },
    "thirdDownPct": 46.0,
    "redZonePct": 67.5,
    "turnoverDiff": -6,
    "specialTeams": {
      "fgPct": 85.7,
      "grade": 5.6
    },
    "coach": {
      "name": "Brian Schottenheimer",
      "grade": 6.0
    },
    "homeField": {
      "stadium": "AT&T Stadium",
      "isOutdoor": false,
      "homeWinPct": 50.0,
      "advantageGrade": 4.5
    },
    "recentForm": [
      "L",
      "W",
      "L",
      "L",
      "L"
    ],
    "keyPlayers": {
      "wr1": {
        "name": "George Pickens",
        "grade": 9.4
      },
      "rb1": {
        "name": "Javonte Williams",
        "grade": 7.7
      },
      "cb1": {
        "name": "DaRon Bland",
        "grade": 2.5
      },
      "pass_rusher": {
        "name": "Jadeveon Clowney",
        "grade": 5.4
      }
    },
    "injuryImpact": 0.0,
    "playoffExperience": 5.5
  },
  {
    "id": "broncos",
    "name": "Denver Broncos",
    "city": "Denver",
    "abbr": "DEN",
    "conference": "AFC",
    "division": "West",
    "primary": "#FB4F14",
    "secondary": "#002244",
    "record": {
      "w": 14,
      "l": 3,
      "t": 0
    },
    "pointsPerGame": 23.6,
    "pointsAllowed": 18.3,
    "qb": {
      "name": "Bo Nix",
      "passerRating": 87.8,
      "touchdowns": 25,
      "interceptions": 11,
      "completionPct": 63.4,
      "grade": 7.4
    },
    "offenseLine": {
      "grade": 10.0
    },
    "defenseLine": {
      "grade": 10.0
    },
    "rushOffense": {
      "yardsPerGame": 118.7,
      "grade": 5.6
    },
    "passOffense": {
      "yardsPerGame": 231.2,
      "grade": 5.4
    },
    "rushDefense": {
      "yardsAllowed": 114.3,
      "grade": 5.6
    },
    "passDefense": {
      "yardsAllowed": 185.0,
      "grade": 10.0
    },
    "thirdDownPct": 42.2,
    "redZonePct": 62.8,
    "turnoverDiff": 0,
    "specialTeams": {
      "fgPct": 87.5,
      "grade": 6.2
    },
    "coach": {
      "name": "Sean Payton",
      "grade": 8.0
    },
    "homeField": {
      "stadium": "Empower Field at Mile High",
      "isOutdoor": true,
      "homeWinPct": 88.9,
      "advantageGrade": 10.0
    },
    "recentForm": [
      "W",
      "W",
      "L",
      "W",
      "W"
    ],
    "keyPlayers": {
      "wr1": {
        "name": "Courtland Sutton",
        "grade": 7.4
      },
      "rb1": {
        "name": "J.K. Dobbins",
        "grade": 3.3
      },
      "cb1": {
        "name": "Riley Moss",
        "grade": 8.8
      },
      "pass_rusher": {
        "name": "Nik Bonitto",
        "grade": 8.8
      }
    },
    "injuryImpact": 0.0,
    "playoffExperience": 4.5
  },
  {
    "id": "lions",
    "name": "Detroit Lions",
    "city": "Detroit",
    "abbr": "DET",
    "conference": "NFC",
    "division": "North",
    "primary": "#0076B6",
    "secondary": "#B0B7BC",
    "record": {
      "w": 9,
      "l": 8,
      "t": 0
    },
    "pointsPerGame": 28.3,
    "pointsAllowed": 24.3,
    "qb": {
      "name": "Jared Goff",
      "passerRating": 105.5,
      "touchdowns": 34,
      "interceptions": 8,
      "completionPct": 68.0,
      "grade": 8.8
    },
    "offenseLine": {
      "grade": 5.1
    },
    "defenseLine": {
      "grade": 8.8
    },
    "rushOffense": {
      "yardsPerGame": 120.1,
      "grade": 6.2
    },
    "passOffense": {
      "yardsPerGame": 268.6,
      "grade": 9.4
    },
    "rushDefense": {
      "yardsAllowed": 121.7,
      "grade": 4.5
    },
    "passDefense": {
      "yardsAllowed": 205.2,
      "grade": 7.4
    },
    "thirdDownPct": 42.9,
    "redZonePct": 63.6,
    "turnoverDiff": 4,
    "specialTeams": {
      "fgPct": 79.4,
      "grade": 2.5
    },
    "coach": {
      "name": "Dan Campbell",
      "grade": 8.5
    },
    "homeField": {
      "stadium": "Ford Field",
      "isOutdoor": false,
      "homeWinPct": 62.5,
      "advantageGrade": 6.5
    },
    "recentForm": [
      "W",
      "L",
      "L",
      "L",
      "W"
    ],
    "keyPlayers": {
      "wr1": {
        "name": "Amon-Ra St. Brown",
        "grade": 8.8
      },
      "rb1": {
        "name": "Jahmyr Gibbs",
        "grade": 8.3
      },
      "cb1": {
        "name": "Amik Robertson",
        "grade": 5.9
      },
      "pass_rusher": {
        "name": "Aidan Hutchinson",
        "grade": 9.1
      }
    },
    "injuryImpact": 0.0,
    "playoffExperience": 7.5
  },
  {
    "id": "packers",
    "name": "Green Bay Packers",
    "city": "Green Bay",
    "abbr": "GB",
    "conference": "NFC",
    "division": "North",
    "primary": "#203731",
    "secondary": "#FFB612",
    "record": {
      "w": 9,
      "l": 7,
      "t": 1
    },
    "pointsPerGame": 23.0,
    "pointsAllowed": 21.2,
    "qb": {
      "name": "Jordan Love",
      "passerRating": 101.2,
      "touchdowns": 23,
      "interceptions": 6,
      "completionPct": 66.3,
      "grade": 9.1
    },
    "offenseLine": {
      "grade": 8.3
    },
    "defenseLine": {
      "grade": 4.5
    },
    "rushOffense": {
      "yardsPerGame": 119.8,
      "grade": 5.9
    },
    "passOffense": {
      "yardsPerGame": 226.2,
      "grade": 5.1
    },
    "rushDefense": {
      "yardsAllowed": 141.0,
      "grade": 1.6
    },
    "passDefense": {
      "yardsAllowed": 245.7,
      "grade": 2.2
    },
    "thirdDownPct": 45.3,
    "redZonePct": 66.7,
    "turnoverDiff": 1,
    "specialTeams": {
      "fgPct": 82.4,
      "grade": 3.6
    },
    "coach": {
      "name": "Matt LaFleur",
      "grade": 8.2
    },
    "homeField": {
      "stadium": "Lambeau Field",
      "isOutdoor": true,
      "homeWinPct": 62.5,
      "advantageGrade": 6.2
    },
    "recentForm": [
      "L",
      "L",
      "L",
      "L",
      "W"
    ],
    "keyPlayers": {
      "wr1": {
        "name": "Romeo Doubs",
        "grade": 3.3
      },
      "rb1": {
        "name": "Josh Jacobs",
        "grade": 4.5
      },
      "cb1": {
        "name": "Keisean Nixon",
        "grade": 7.1
      },
      "pass_rusher": {
        "name": "Micah Parsons",
        "grade": 8.3
      }
    },
    "injuryImpact": 0.0,
    "playoffExperience": 7.5
  },
  {
    "id": "texans",
    "name": "Houston Texans",
    "city": "Houston",
    "abbr": "HOU",
    "conference": "AFC",
    "division": "South",
    "primary": "#03202F",
    "secondary": "#A71930",
    "record": {
      "w": 12,
      "l": 5,
      "t": 0
    },
    "pointsPerGame": 23.8,
    "pointsAllowed": 17.4,
    "qb": {
      "name": "C.J. Stroud",
      "passerRating": 92.9,
      "touchdowns": 19,
      "interceptions": 8,
      "completionPct": 64.5,
      "grade": 7.1
    },
    "offenseLine": {
      "grade": 7.4
    },
    "defenseLine": {
      "grade": 8.3
    },
    "rushOffense": {
      "yardsPerGame": 108.9,
      "grade": 3.9
    },
    "passOffense": {
      "yardsPerGame": 232.7,
      "grade": 6.2
    },
    "rushDefense": {
      "yardsAllowed": 95.0,
      "grade": 8.5
    },
    "passDefense": {
      "yardsAllowed": 189.7,
      "grade": 9.4
    },
    "thirdDownPct": 34.4,
    "redZonePct": 53.1,
    "turnoverDiff": 20,
    "specialTeams": {
      "fgPct": 92.3,
      "grade": 8.5
    },
    "coach": {
      "name": "DeMeco Ryans",
      "grade": 7.8
    },
    "homeField": {
      "stadium": "NRG Stadium",
      "isOutdoor": false,
      "homeWinPct": 77.8,
      "advantageGrade": 9.1
    },
    "recentForm": [
      "W",
      "W",
      "W",
      "W",
      "W"
    ],
    "keyPlayers": {
      "wr1": {
        "name": "Nico Collins",
        "grade": 8.0
      },
      "rb1": {
        "name": "Woody Marks",
        "grade": 2.5
      },
      "cb1": {
        "name": "Kamari Lassiter",
        "grade": 9.7
      },
      "pass_rusher": {
        "name": "Danielle Hunter",
        "grade": 9.4
      }
    },
    "injuryImpact": 0.0,
    "playoffExperience": 5.0
  },
  {
    "id": "colts",
    "name": "Indianapolis Colts",
    "city": "Indianapolis",
    "abbr": "IND",
    "conference": "AFC",
    "division": "South",
    "primary": "#002C5F",
    "secondary": "#A2AAAD",
    "record": {
      "w": 8,
      "l": 9,
      "t": 0
    },
    "pointsPerGame": 27.4,
    "pointsAllowed": 24.2,
    "qb": {
      "name": "Daniel Jones",
      "passerRating": 100.2,
      "touchdowns": 19,
      "interceptions": 8,
      "completionPct": 68.0,
      "grade": 7.7
    },
    "offenseLine": {
      "grade": 8.0
    },
    "defenseLine": {
      "grade": 5.9
    },
    "rushOffense": {
      "yardsPerGame": 118.1,
      "grade": 5.4
    },
    "passOffense": {
      "yardsPerGame": 240.3,
      "grade": 8.0
    },
    "rushDefense": {
      "yardsAllowed": 112.3,
      "grade": 5.9
    },
    "passDefense": {
      "yardsAllowed": 212.2,
      "grade": 6.5
    },
    "thirdDownPct": 44.2,
    "redZonePct": 65.3,
    "turnoverDiff": 2,
    "specialTeams": {
      "fgPct": 94.4,
      "grade": 9.7
    },
    "coach": {
      "name": "Shane Steichen",
      "grade": 6.5
    },
    "homeField": {
      "stadium": "Lucas Oil Stadium",
      "isOutdoor": false,
      "homeWinPct": 66.7,
      "advantageGrade": 8.0
    },
    "recentForm": [
      "L",
      "L",
      "L",
      "L",
      "L"
    ],
    "keyPlayers": {
      "wr1": {
        "name": "Alec Pierce",
        "grade": 5.6
      },
      "rb1": {
        "name": "Jonathan Taylor",
        "grade": 9.4
      },
      "cb1": {
        "name": "Mekhi Blackmon",
        "grade": 5.1
      },
      "pass_rusher": {
        "name": "Laiatu Latu",
        "grade": 5.1
      }
    },
    "injuryImpact": 0.0,
    "playoffExperience": 4.0
  },
  {
    "id": "jaguars",
    "name": "Jacksonville Jaguars",
    "city": "Jacksonville",
    "abbr": "JAX",
    "conference": "AFC",
    "division": "South",
    "primary": "#006778",
    "secondary": "#9F792C",
    "record": {
      "w": 13,
      "l": 4,
      "t": 0
    },
    "pointsPerGame": 27.9,
    "pointsAllowed": 19.8,
    "qb": {
      "name": "Trevor Lawrence",
      "passerRating": 91.0,
      "touchdowns": 29,
      "interceptions": 12,
      "completionPct": 60.9,
      "grade": 6.2
    },
    "offenseLine": {
      "grade": 4.5
    },
    "defenseLine": {
      "grade": 2.5
    },
    "rushOffense": {
      "yardsPerGame": 115.1,
      "grade": 4.5
    },
    "passOffense": {
      "yardsPerGame": 236.8,
      "grade": 7.1
    },
    "rushDefense": {
      "yardsAllowed": 115.7,
      "grade": 5.4
    },
    "passDefense": {
      "yardsAllowed": 194.3,
      "grade": 8.8
    },
    "thirdDownPct": 40.2,
    "redZonePct": 60.3,
    "turnoverDiff": 14,
    "specialTeams": {
      "fgPct": 88.2,
      "grade": 6.5
    },
    "coach": {
      "name": "Liam Coen",
      "grade": 6.0
    },
    "homeField": {
      "stadium": "EverBank Stadium",
      "isOutdoor": true,
      "homeWinPct": 77.8,
      "advantageGrade": 8.8
    },
    "recentForm": [
      "W",
      "W",
      "W",
      "W",
      "W"
    ],
    "keyPlayers": {
      "wr1": {
        "name": "Parker Washington",
        "grade": 4.2
      },
      "rb1": {
        "name": "Travis Etienne",
        "grade": 7.1
      },
      "cb1": {
        "name": "Montaric Brown",
        "grade": 6.5
      },
      "pass_rusher": {
        "name": "Josh Hines-Allen",
        "grade": 4.2
      }
    },
    "injuryImpact": 0.0,
    "playoffExperience": 4.0
  },
  {
    "id": "chiefs",
    "name": "Kansas City Chiefs",
    "city": "Kansas City",
    "abbr": "KC",
    "conference": "AFC",
    "division": "West",
    "primary": "#E31837",
    "secondary": "#FFB81C",
    "record": {
      "w": 6,
      "l": 11,
      "t": 0
    },
    "pointsPerGame": 21.3,
    "pointsAllowed": 19.3,
    "qb": {
      "name": "Patrick Mahomes",
      "passerRating": 89.6,
      "touchdowns": 22,
      "interceptions": 11,
      "completionPct": 62.7,
      "grade": 8.0
    },
    "offenseLine": {
      "grade": 3.9
    },
    "defenseLine": {
      "grade": 2.7
    },
    "rushOffense": {
      "yardsPerGame": 106.6,
      "grade": 3.0
    },
    "passOffense": {
      "yardsPerGame": 232.2,
      "grade": 5.6
    },
    "rushDefense": {
      "yardsAllowed": 131.7,
      "grade": 3.0
    },
    "passDefense": {
      "yardsAllowed": 243.3,
      "grade": 2.5
    },
    "thirdDownPct": 40.9,
    "redZonePct": 61.1,
    "turnoverDiff": -1,
    "specialTeams": {
      "fgPct": 86.8,
      "grade": 5.9
    },
    "coach": {
      "name": "Andy Reid",
      "grade": 9.8
    },
    "homeField": {
      "stadium": "GEHA Field at Arrowhead Stadium",
      "isOutdoor": true,
      "homeWinPct": 55.6,
      "advantageGrade": 5.4
    },
    "recentForm": [
      "L",
      "L",
      "L",
      "L",
      "L"
    ],
    "keyPlayers": {
      "wr1": {
        "name": "Marquise Brown",
        "grade": 1.6
      },
      "rb1": {
        "name": "Kareem Hunt",
        "grade": 1.9
      },
      "cb1": {
        "name": "Trent McDuffie",
        "grade": 3.3
      },
      "pass_rusher": {
        "name": "Chris Jones",
        "grade": 2.7
      }
    },
    "injuryImpact": 0.0,
    "playoffExperience": 9.8
  },
  {
    "id": "chargers",
    "name": "Los Angeles Chargers",
    "city": "Los Angeles",
    "abbr": "LAC",
    "conference": "AFC",
    "division": "West",
    "primary": "#0080C6",
    "secondary": "#FFC20E",
    "record": {
      "w": 11,
      "l": 6,
      "t": 0
    },
    "pointsPerGame": 21.6,
    "pointsAllowed": 20.0,
    "qb": {
      "name": "Justin Herbert",
      "passerRating": 94.1,
      "touchdowns": 26,
      "interceptions": 13,
      "completionPct": 66.4,
      "grade": 5.1
    },
    "offenseLine": {
      "grade": 1.9
    },
    "defenseLine": {
      "grade": 7.4
    },
    "rushOffense": {
      "yardsPerGame": 121.6,
      "grade": 6.8
    },
    "passOffense": {
      "yardsPerGame": 232.5,
      "grade": 5.9
    },
    "rushDefense": {
      "yardsAllowed": 98.3,
      "grade": 8.0
    },
    "passDefense": {
      "yardsAllowed": 196.7,
      "grade": 8.5
    },
    "thirdDownPct": 32.4,
    "redZonePct": 50.6,
    "turnoverDiff": 6,
    "specialTeams": {
      "fgPct": 92.7,
      "grade": 8.8
    },
    "coach": {
      "name": "Jim Harbaugh",
      "grade": 8.5
    },
    "homeField": {
      "stadium": "SoFi Stadium",
      "isOutdoor": false,
      "homeWinPct": 66.7,
      "advantageGrade": 7.7
    },
    "recentForm": [
      "L",
      "L",
      "W",
      "W",
      "W"
    ],
    "keyPlayers": {
      "wr1": {
        "name": "Ladd McConkey",
        "grade": 3.9
      },
      "rb1": {
        "name": "Kimani Vidal",
        "grade": 2.2
      },
      "cb1": {
        "name": "Cam Hart",
        "grade": 5.4
      },
      "pass_rusher": {
        "name": "Tuli Tuipulotu",
        "grade": 8.5
      }
    },
    "injuryImpact": 0.0,
    "playoffExperience": 5.5
  },
  {
    "id": "rams",
    "name": "Los Angeles Rams",
    "city": "Los Angeles",
    "abbr": "LAR",
    "conference": "NFC",
    "division": "West",
    "primary": "#003594",
    "secondary": "#FFA300",
    "record": {
      "w": 12,
      "l": 5,
      "t": 0
    },
    "pointsPerGame": 30.5,
    "pointsAllowed": 20.4,
    "qb": {
      "name": "Matthew Stafford",
      "passerRating": 109.2,
      "touchdowns": 46,
      "interceptions": 8,
      "completionPct": 65.0,
      "grade": 9.7
    },
    "offenseLine": {
      "grade": 9.7
    },
    "defenseLine": {
      "grade": 8.0
    },
    "rushOffense": {
      "yardsPerGame": 126.6,
      "grade": 8.3
    },
    "passOffense": {
      "yardsPerGame": 276.9,
      "grade": 9.7
    },
    "rushDefense": {
      "yardsAllowed": 139.0,
      "grade": 1.9
    },
    "passDefense": {
      "yardsAllowed": 202.9,
      "grade": 7.7
    },
    "thirdDownPct": 47.3,
    "redZonePct": 69.2,
    "turnoverDiff": 12,
    "specialTeams": {
      "fgPct": 78.6,
      "grade": 2.2
    },
    "coach": {
      "name": "Sean McVay",
      "grade": 9.0
    },
    "homeField": {
      "stadium": "SoFi Stadium",
      "isOutdoor": false,
      "homeWinPct": 87.5,
      "advantageGrade": 9.7
    },
    "recentForm": [
      "W",
      "L",
      "L",
      "W",
      "W"
    ],
    "keyPlayers": {
      "wr1": {
        "name": "Puka Nacua",
        "grade": 9.7
      },
      "rb1": {
        "name": "Kyren Williams",
        "grade": 8.5
      },
      "cb1": {
        "name": "Emmanuel Forbes",
        "grade": 9.4
      },
      "pass_rusher": {
        "name": "Byron Young",
        "grade": 7.7
      }
    },
    "injuryImpact": 0.0,
    "playoffExperience": 8.0
  },
  {
    "id": "raiders",
    "name": "Las Vegas Raiders",
    "city": "Las Vegas",
    "abbr": "LV",
    "conference": "AFC",
    "division": "West",
    "primary": "#000000",
    "secondary": "#A5ACAF",
    "record": {
      "w": 3,
      "l": 14,
      "t": 0
    },
    "pointsPerGame": 14.2,
    "pointsAllowed": 25.4,
    "qb": {
      "name": "Geno Smith",
      "passerRating": 84.7,
      "touchdowns": 19,
      "interceptions": 17,
      "completionPct": 67.4,
      "grade": 1.3
    },
    "offenseLine": {
      "grade": 1.0
    },
    "defenseLine": {
      "grade": 4.2
    },
    "rushOffense": {
      "yardsPerGame": 77.5,
      "grade": 1.0
    },
    "passOffense": {
      "yardsPerGame": 195.0,
      "grade": 2.7
    },
    "rushDefense": {
      "yardsAllowed": 89.0,
      "grade": 9.4
    },
    "passDefense": {
      "yardsAllowed": 248.0,
      "grade": 1.9
    },
    "thirdDownPct": 28.0,
    "redZonePct": 45.0,
    "turnoverDiff": -6,
    "specialTeams": {
      "fgPct": 81.5,
      "grade": 3.0
    },
    "coach": {
      "name": "Pete Carroll",
      "grade": 7.0
    },
    "homeField": {
      "stadium": "Allegiant Stadium",
      "isOutdoor": false,
      "homeWinPct": 22.2,
      "advantageGrade": 1.9
    },
    "recentForm": [
      "W",
      "L",
      "L",
      "L",
      "L"
    ],
    "keyPlayers": {
      "wr1": {
        "name": "Tre Tucker",
        "grade": 2.7
      },
      "rb1": {
        "name": "Ashton Jeanty",
        "grade": 5.1
      },
      "cb1": {
        "name": "Eric Stokes",
        "grade": 1.6
      },
      "pass_rusher": {
        "name": "Maxx Crosby",
        "grade": 6.2
      }
    },
    "injuryImpact": 0.0,
    "playoffExperience": 3.0
  },
  {
    "id": "dolphins",
    "name": "Miami Dolphins",
    "city": "Miami",
    "abbr": "MIA",
    "conference": "AFC",
    "division": "East",
    "primary": "#008E97",
    "secondary": "#FC4C02",
    "record": {
      "w": 7,
      "l": 10,
      "t": 0
    },
    "pointsPerGame": 20.4,
    "pointsAllowed": 24.9,
    "qb": {
      "name": "Tua Tagovailoa",
      "passerRating": 88.5,
      "touchdowns": 20,
      "interceptions": 15,
      "completionPct": 67.7,
      "grade": 4.8
    },
    "offenseLine": {
      "grade": 5.6
    },
    "defenseLine": {
      "grade": 5.6
    },
    "rushOffense": {
      "yardsPerGame": 120.2,
      "grade": 6.5
    },
    "passOffense": {
      "yardsPerGame": 195.4,
      "grade": 3.0
    },
    "rushDefense": {
      "yardsAllowed": 119.7,
      "grade": 4.8
    },
    "passDefense": {
      "yardsAllowed": 241.8,
      "grade": 2.7
    },
    "thirdDownPct": 35.8,
    "redZonePct": 54.7,
    "turnoverDiff": -1,
    "specialTeams": {
      "fgPct": 93.1,
      "grade": 9.1
    },
    "coach": {
      "name": "Mike McDaniel",
      "grade": 7.2
    },
    "homeField": {
      "stadium": "Hard Rock Stadium",
      "isOutdoor": true,
      "homeWinPct": 55.6,
      "advantageGrade": 5.1
    },
    "recentForm": [
      "L",
      "W",
      "L",
      "L",
      "W"
    ],
    "keyPlayers": {
      "wr1": {
        "name": "Jaylen Waddle",
        "grade": 4.8
      },
      "rb1": {
        "name": "De'Von Achane",
        "grade": 8.8
      },
      "cb1": {
        "name": "Jack Jones",
        "grade": 2.2
      },
      "pass_rusher": {
        "name": "Bradley Chubb",
        "grade": 4.8
      }
    },
    "injuryImpact": 0.0,
    "playoffExperience": 5.0
  },
  {
    "id": "vikings",
    "name": "Minnesota Vikings",
    "city": "Minnesota",
    "abbr": "MIN",
    "conference": "NFC",
    "division": "North",
    "primary": "#4F2683",
    "secondary": "#FFC62F",
    "record": {
      "w": 9,
      "l": 8,
      "t": 0
    },
    "pointsPerGame": 20.2,
    "pointsAllowed": 19.6,
    "qb": {
      "name": "J.J. McCarthy",
      "passerRating": 72.6,
      "touchdowns": 11,
      "interceptions": 12,
      "completionPct": 57.6,
      "grade": 1.9
    },
    "offenseLine": {
      "grade": 1.6
    },
    "defenseLine": {
      "grade": 9.1
    },
    "rushOffense": {
      "yardsPerGame": 108.3,
      "grade": 3.6
    },
    "passOffense": {
      "yardsPerGame": 188.7,
      "grade": 1.6
    },
    "rushDefense": {
      "yardsAllowed": 87.0,
      "grade": 9.7
    },
    "passDefense": {
      "yardsAllowed": 220.8,
      "grade": 5.4
    },
    "thirdDownPct": 30.7,
    "redZonePct": 48.3,
    "turnoverDiff": -5,
    "specialTeams": {
      "fgPct": 94.3,
      "grade": 9.4
    },
    "coach": {
      "name": "Kevin O'Connell",
      "grade": 7.8
    },
    "homeField": {
      "stadium": "U.S. Bank Stadium",
      "isOutdoor": false,
      "homeWinPct": 50.0,
      "advantageGrade": 4.2
    },
    "recentForm": [
      "W",
      "W",
      "W",
      "W",
      "W"
    ],
    "keyPlayers": {
      "wr1": {
        "name": "Justin Jefferson",
        "grade": 7.7
      },
      "rb1": {
        "name": "Jordan Mason",
        "grade": 3.0
      },
      "cb1": {
        "name": "Byron Murphy",
        "grade": 4.8
      },
      "pass_rusher": {
        "name": "Dallas Turner",
        "grade": 3.9
      }
    },
    "injuryImpact": 0.0,
    "playoffExperience": 6.0
  },
  {
    "id": "patriots",
    "name": "New England Patriots",
    "city": "New England",
    "abbr": "NE",
    "conference": "AFC",
    "division": "East",
    "primary": "#002244",
    "secondary": "#C60C30",
    "record": {
      "w": 14,
      "l": 3,
      "t": 0
    },
    "pointsPerGame": 28.8,
    "pointsAllowed": 18.8,
    "qb": {
      "name": "Drake Maye",
      "passerRating": 113.5,
      "touchdowns": 31,
      "interceptions": 8,
      "completionPct": 72.0,
      "grade": 10.0
    },
    "offenseLine": {
      "grade": 3.6
    },
    "defenseLine": {
      "grade": 3.0
    },
    "rushOffense": {
      "yardsPerGame": 128.9,
      "grade": 8.5
    },
    "passOffense": {
      "yardsPerGame": 262.3,
      "grade": 9.1
    },
    "rushDefense": {
      "yardsAllowed": 104.3,
      "grade": 7.1
    },
    "passDefense": {
      "yardsAllowed": 237.1,
      "grade": 3.3
    },
    "thirdDownPct": 48.0,
    "redZonePct": 70.0,
    "turnoverDiff": 4,
    "specialTeams": {
      "fgPct": 84.4,
      "grade": 4.8
    },
    "coach": {
      "name": "Mike Vrabel",
      "grade": 8.0
    },
    "homeField": {
      "stadium": "Gillette Stadium",
      "isOutdoor": true,
      "homeWinPct": 66.7,
      "advantageGrade": 7.4
    },
    "recentForm": [
      "W",
      "W",
      "W",
      "L",
      "W"
    ],
    "keyPlayers": {
      "wr1": {
        "name": "Stefon Diggs",
        "grade": 6.5
      },
      "rb1": {
        "name": "TreVeyon Henderson",
        "grade": 4.2
      },
      "cb1": {
        "name": "Christian Gonzalez",
        "grade": 4.2
      },
      "pass_rusher": {
        "name": "Harold Landry III",
        "grade": 4.5
      }
    },
    "injuryImpact": 0.0,
    "playoffExperience": 5.0
  },
  {
    "id": "saints",
    "name": "New Orleans Saints",
    "city": "New Orleans",
    "abbr": "NO",
    "conference": "NFC",
    "division": "South",
    "primary": "#D3BC8D",
    "secondary": "#101820",
    "record": {
      "w": 6,
      "l": 11,
      "t": 0
    },
    "pointsPerGame": 18.0,
    "pointsAllowed": 22.5,
    "qb": {
      "name": "Tyler Shough",
      "passerRating": 91.3,
      "touchdowns": 10,
      "interceptions": 6,
      "completionPct": 67.6,
      "grade": 3.9
    },
    "offenseLine": {
      "grade": 3.0
    },
    "defenseLine": {
      "grade": 7.1
    },
    "rushOffense": {
      "yardsPerGame": 94.3,
      "grade": 2.2
    },
    "passOffense": {
      "yardsPerGame": 236.9,
      "grade": 7.4
    },
    "rushDefense": {
      "yardsAllowed": 96.3,
      "grade": 8.3
    },
    "passDefense": {
      "yardsAllowed": 214.6,
      "grade": 6.2
    },
    "thirdDownPct": 31.3,
    "redZonePct": 49.2,
    "turnoverDiff": 2,
    "specialTeams": {
      "fgPct": 71.4,
      "grade": 1.0
    },
    "coach": {
      "name": "Kellen Moore",
      "grade": 5.8
    },
    "homeField": {
      "stadium": "Caesars Superdome",
      "isOutdoor": false,
      "homeWinPct": 37.5,
      "advantageGrade": 3.6
    },
    "recentForm": [
      "L",
      "W",
      "W",
      "W",
      "W"
    ],
    "keyPlayers": {
      "wr1": {
        "name": "Chris Olave",
        "grade": 8.3
      },
      "rb1": {
        "name": "Alvin Kamara",
        "grade": 1.3
      },
      "cb1": {
        "name": "Alontae Taylor",
        "grade": 6.2
      },
      "pass_rusher": {
        "name": "Cameron Jordan",
        "grade": 6.8
      }
    },
    "injuryImpact": 0.0,
    "playoffExperience": 4.5
  },
  {
    "id": "giants",
    "name": "New York Giants",
    "city": "New York",
    "abbr": "NYG",
    "conference": "NFC",
    "division": "East",
    "primary": "#0B2265",
    "secondary": "#A71930",
    "record": {
      "w": 4,
      "l": 13,
      "t": 0
    },
    "pointsPerGame": 22.4,
    "pointsAllowed": 25.8,
    "qb": {
      "name": "Jaxson Dart",
      "passerRating": 91.7,
      "touchdowns": 15,
      "interceptions": 5,
      "completionPct": 63.7,
      "grade": 4.2
    },
    "offenseLine": {
      "grade": 3.3
    },
    "defenseLine": {
      "grade": 5.4
    },
    "rushOffense": {
      "yardsPerGame": 129.1,
      "grade": 8.8
    },
    "passOffense": {
      "yardsPerGame": 217.8,
      "grade": 4.2
    },
    "rushDefense": {
      "yardsAllowed": 102.3,
      "grade": 7.4
    },
    "passDefense": {
      "yardsAllowed": 227.8,
      "grade": 4.5
    },
    "thirdDownPct": 38.2,
    "redZonePct": 57.8,
    "turnoverDiff": 1,
    "specialTeams": {
      "fgPct": 88.5,
      "grade": 7.1
    },
    "coach": {
      "name": "Brian Daboll",
      "grade": 6.0
    },
    "homeField": {
      "stadium": "MetLife Stadium",
      "isOutdoor": true,
      "homeWinPct": 37.5,
      "advantageGrade": 3.3
    },
    "recentForm": [
      "W",
      "W",
      "L",
      "L",
      "L"
    ],
    "keyPlayers": {
      "wr1": {
        "name": "Wan'Dale Robinson",
        "grade": 6.8
      },
      "rb1": {
        "name": "Tyrone Tracy Jr.",
        "grade": 2.7
      },
      "cb1": {
        "name": "Paulson Adebo",
        "grade": 3.9
      },
      "pass_rusher": {
        "name": "Brian Burns",
        "grade": 9.7
      }
    },
    "injuryImpact": 0.0,
    "playoffExperience": 3.5
  },
  {
    "id": "jets",
    "name": "New York Jets",
    "city": "New York",
    "abbr": "NYJ",
    "conference": "AFC",
    "division": "East",
    "primary": "#125740",
    "secondary": "#000000",
    "record": {
      "w": 3,
      "l": 14,
      "t": 0
    },
    "pointsPerGame": 17.6,
    "pointsAllowed": 29.6,
    "qb": {
      "name": "Justin Fields",
      "passerRating": 89.5,
      "touchdowns": 7,
      "interceptions": 1,
      "completionPct": 62.7,
      "grade": 2.5
    },
    "offenseLine": {
      "grade": 1.3
    },
    "defenseLine": {
      "grade": 1.3
    },
    "rushOffense": {
      "yardsPerGame": 123.3,
      "grade": 7.4
    },
    "passOffense": {
      "yardsPerGame": 163.8,
      "grade": 1.0
    },
    "rushDefense": {
      "yardsAllowed": 123.7,
      "grade": 4.2
    },
    "passDefense": {
      "yardsAllowed": 255.0,
      "grade": 1.0
    },
    "thirdDownPct": 30.0,
    "redZonePct": 47.5,
    "turnoverDiff": -17,
    "specialTeams": {
      "fgPct": 96.6,
      "grade": 10.0
    },
    "coach": {
      "name": "Aaron Glenn",
      "grade": 6.0
    },
    "homeField": {
      "stadium": "MetLife Stadium",
      "isOutdoor": true,
      "homeWinPct": 22.2,
      "advantageGrade": 1.6
    },
    "recentForm": [
      "L",
      "L",
      "L",
      "L",
      "L"
    ],
    "keyPlayers": {
      "wr1": {
        "name": "Adonai Mitchell",
        "grade": 1.0
      },
      "rb1": {
        "name": "Breece Hall",
        "grade": 5.9
      },
      "cb1": {
        "name": "Brandon Stephens",
        "grade": 3.0
      },
      "pass_rusher": {
        "name": "Will McDonald IV",
        "grade": 3.6
      }
    },
    "injuryImpact": 0.0,
    "playoffExperience": 3.0
  },
  {
    "id": "eagles",
    "name": "Philadelphia Eagles",
    "city": "Philadelphia",
    "abbr": "PHI",
    "conference": "NFC",
    "division": "East",
    "primary": "#004C54",
    "secondary": "#A5ACAF",
    "record": {
      "w": 11,
      "l": 6,
      "t": 0
    },
    "pointsPerGame": 22.3,
    "pointsAllowed": 19.1,
    "qb": {
      "name": "Jalen Hurts",
      "passerRating": 98.5,
      "touchdowns": 25,
      "interceptions": 6,
      "completionPct": 64.8,
      "grade": 5.9
    },
    "offenseLine": {
      "grade": 6.5
    },
    "defenseLine": {
      "grade": 6.8
    },
    "rushOffense": {
      "yardsPerGame": 116.9,
      "grade": 5.1
    },
    "passOffense": {
      "yardsPerGame": 205.8,
      "grade": 3.6
    },
    "rushDefense": {
      "yardsAllowed": 127.7,
      "grade": 3.6
    },
    "passDefense": {
      "yardsAllowed": 209.9,
      "grade": 6.8
    },
    "thirdDownPct": 37.8,
    "redZonePct": 57.2,
    "turnoverDiff": 11,
    "specialTeams": {
      "fgPct": 74.1,
      "grade": 1.3
    },
    "coach": {
      "name": "Nick Sirianni",
      "grade": 8.5
    },
    "homeField": {
      "stadium": "Lincoln Financial Field",
      "isOutdoor": true,
      "homeWinPct": 62.5,
      "advantageGrade": 5.9
    },
    "recentForm": [
      "L",
      "W",
      "W",
      "W",
      "L"
    ],
    "keyPlayers": {
      "wr1": {
        "name": "DeVonta Smith",
        "grade": 6.2
      },
      "rb1": {
        "name": "Saquon Barkley",
        "grade": 7.4
      },
      "cb1": {
        "name": "Cooper DeJean",
        "grade": 8.0
      },
      "pass_rusher": {
        "name": "Jalyx Hunt",
        "grade": 1.9
      }
    },
    "injuryImpact": 0.0,
    "playoffExperience": 9.0
  },
  {
    "id": "steelers",
    "name": "Pittsburgh Steelers",
    "city": "Pittsburgh",
    "abbr": "PIT",
    "conference": "AFC",
    "division": "North",
    "primary": "#FFB612",
    "secondary": "#101820",
    "record": {
      "w": 10,
      "l": 7,
      "t": 0
    },
    "pointsPerGame": 23.4,
    "pointsAllowed": 22.8,
    "qb": {
      "name": "Aaron Rodgers",
      "passerRating": 94.8,
      "touchdowns": 24,
      "interceptions": 7,
      "completionPct": 65.7,
      "grade": 5.6
    },
    "offenseLine": {
      "grade": 7.1
    },
    "defenseLine": {
      "grade": 8.5
    },
    "rushOffense": {
      "yardsPerGame": 103.3,
      "grade": 2.7
    },
    "passOffense": {
      "yardsPerGame": 213.6,
      "grade": 3.9
    },
    "rushDefense": {
      "yardsAllowed": 91.0,
      "grade": 9.1
    },
    "passDefense": {
      "yardsAllowed": 198.2,
      "grade": 8.3
    },
    "thirdDownPct": 39.6,
    "redZonePct": 59.4,
    "turnoverDiff": 16,
    "specialTeams": {
      "fgPct": 84.4,
      "grade": 4.5
    },
    "coach": {
      "name": "Mike Tomlin",
      "grade": 9.0
    },
    "homeField": {
      "stadium": "Acrisure Stadium",
      "isOutdoor": true,
      "homeWinPct": 66.7,
      "advantageGrade": 7.1
    },
    "recentForm": [
      "W",
      "L",
      "W",
      "W",
      "W"
    ],
    "keyPlayers": {
      "wr1": {
        "name": "DK Metcalf",
        "grade": 4.5
      },
      "rb1": {
        "name": "Jaylen Warren",
        "grade": 4.8
      },
      "cb1": {
        "name": "Jalen Ramsey",
        "grade": 3.6
      },
      "pass_rusher": {
        "name": "Alex Highsmith",
        "grade": 5.9
      }
    },
    "injuryImpact": 0.0,
    "playoffExperience": 7.0
  },
  {
    "id": "seahawks",
    "name": "Seattle Seahawks",
    "city": "Seattle",
    "abbr": "SEA",
    "conference": "NFC",
    "division": "West",
    "primary": "#002244",
    "secondary": "#69BE28",
    "record": {
      "w": 14,
      "l": 3,
      "t": 0
    },
    "pointsPerGame": 28.4,
    "pointsAllowed": 17.2,
    "qb": {
      "name": "Sam Darnold",
      "passerRating": 99.1,
      "touchdowns": 25,
      "interceptions": 14,
      "completionPct": 67.7,
      "grade": 8.5
    },
    "offenseLine": {
      "grade": 8.8
    },
    "defenseLine": {
      "grade": 7.7
    },
    "rushOffense": {
      "yardsPerGame": 123.3,
      "grade": 7.1
    },
    "passOffense": {
      "yardsPerGame": 239.0,
      "grade": 7.7
    },
    "rushDefense": {
      "yardsAllowed": 108.3,
      "grade": 6.5
    },
    "passDefense": {
      "yardsAllowed": 192.0,
      "grade": 9.1
    },
    "thirdDownPct": 38.9,
    "redZonePct": 58.6,
    "turnoverDiff": 2,
    "specialTeams": {
      "fgPct": 85.4,
      "grade": 5.4
    },
    "coach": {
      "name": "Mike Macdonald",
      "grade": 7.5
    },
    "homeField": {
      "stadium": "Lumen Field",
      "isOutdoor": true,
      "homeWinPct": 75.0,
      "advantageGrade": 8.3
    },
    "recentForm": [
      "W",
      "W",
      "W",
      "W",
      "W"
    ],
    "keyPlayers": {
      "wr1": {
        "name": "Jaxon Smith-Njigba",
        "grade": 10.0
      },
      "rb1": {
        "name": "Kenneth Walker III",
        "grade": 5.6
      },
      "cb1": {
        "name": "Devon Witherspoon",
        "grade": 2.7
      },
      "pass_rusher": {
        "name": "Leonard Williams",
        "grade": 2.5
      }
    },
    "injuryImpact": 0.0,
    "playoffExperience": 6.0
  },
  {
    "id": "49ers",
    "name": "San Francisco 49ers",
    "city": "San Francisco",
    "abbr": "SF",
    "conference": "NFC",
    "division": "West",
    "primary": "#AA0000",
    "secondary": "#B3995D",
    "record": {
      "w": 12,
      "l": 5,
      "t": 0
    },
    "pointsPerGame": 25.7,
    "pointsAllowed": 21.8,
    "qb": {
      "name": "Mac Jones",
      "passerRating": 97.4,
      "touchdowns": 13,
      "interceptions": 6,
      "completionPct": 69.6,
      "grade": 6.8
    },
    "offenseLine": {
      "grade": 8.5
    },
    "defenseLine": {
      "grade": 1.0
    },
    "rushOffense": {
      "yardsPerGame": 106.9,
      "grade": 3.3
    },
    "passOffense": {
      "yardsPerGame": 254.0,
      "grade": 8.5
    },
    "rushDefense": {
      "yardsAllowed": 135.0,
      "grade": 2.5
    },
    "passDefense": {
      "yardsAllowed": 252.7,
      "grade": 1.3
    },
    "thirdDownPct": 44.7,
    "redZonePct": 65.8,
    "turnoverDiff": -4,
    "specialTeams": {
      "fgPct": 91.7,
      "grade": 8.3
    },
    "coach": {
      "name": "Kyle Shanahan",
      "grade": 8.8
    },
    "homeField": {
      "stadium": "Levi's Stadium",
      "isOutdoor": true,
      "homeWinPct": 62.5,
      "advantageGrade": 5.6
    },
    "recentForm": [
      "L",
      "W",
      "W",
      "W",
      "W"
    ],
    "keyPlayers": {
      "wr1": {
        "name": "Jauan Jennings",
        "grade": 2.2
      },
      "rb1": {
        "name": "Christian McCaffrey",
        "grade": 8.0
      },
      "cb1": {
        "name": "Upton Stout",
        "grade": 1.3
      },
      "pass_rusher": {
        "name": "Clelin Ferrell",
        "grade": 1.0
      }
    },
    "injuryImpact": 0.0,
    "playoffExperience": 8.5
  },
  {
    "id": "buccaneers",
    "name": "Tampa Bay Buccaneers",
    "city": "Tampa Bay",
    "abbr": "TB",
    "conference": "NFC",
    "division": "South",
    "primary": "#D50A0A",
    "secondary": "#FF7900",
    "record": {
      "w": 8,
      "l": 9,
      "t": 0
    },
    "pointsPerGame": 22.4,
    "pointsAllowed": 24.2,
    "qb": {
      "name": "Baker Mayfield",
      "passerRating": 90.6,
      "touchdowns": 26,
      "interceptions": 11,
      "completionPct": 63.2,
      "grade": 3.6
    },
    "offenseLine": {
      "grade": 5.4
    },
    "defenseLine": {
      "grade": 5.1
    },
    "rushOffense": {
      "yardsPerGame": 114.5,
      "grade": 4.2
    },
    "passOffense": {
      "yardsPerGame": 220.9,
      "grade": 4.8
    },
    "rushDefense": {
      "yardsAllowed": 110.3,
      "grade": 6.2
    },
    "passDefense": {
      "yardsAllowed": 216.9,
      "grade": 5.9
    },
    "thirdDownPct": 35.1,
    "redZonePct": 53.9,
    "turnoverDiff": 8,
    "specialTeams": {
      "fgPct": 84.2,
      "grade": 4.2
    },
    "coach": {
      "name": "Todd Bowles",
      "grade": 7.0
    },
    "homeField": {
      "stadium": "Raymond James Stadium",
      "isOutdoor": true,
      "homeWinPct": 50.0,
      "advantageGrade": 3.9
    },
    "recentForm": [
      "W",
      "L",
      "L",
      "L",
      "L"
    ],
    "keyPlayers": {
      "wr1": {
        "name": "Emeka Egbuka",
        "grade": 5.4
      },
      "rb1": {
        "name": "Bucky Irving",
        "grade": 1.6
      },
      "cb1": {
        "name": "Jacob Parrish",
        "grade": 4.5
      },
      "pass_rusher": {
        "name": "Yaya Diaby",
        "grade": 2.2
      }
    },
    "injuryImpact": 0.0,
    "playoffExperience": 6.5
  },
  {
    "id": "titans",
    "name": "Tennessee Titans",
    "city": "Tennessee",
    "abbr": "TEN",
    "conference": "AFC",
    "division": "South",
    "primary": "#0C2340",
    "secondary": "#4B92DB",
    "record": {
      "w": 3,
      "l": 14,
      "t": 0
    },
    "pointsPerGame": 16.7,
    "pointsAllowed": 28.1,
    "qb": {
      "name": "Cam Ward",
      "passerRating": 80.2,
      "touchdowns": 15,
      "interceptions": 7,
      "completionPct": 59.8,
      "grade": 1.0
    },
    "offenseLine": {
      "grade": 2.5
    },
    "defenseLine": {
      "grade": 6.5
    },
    "rushOffense": {
      "yardsPerGame": 93.5,
      "grade": 1.6
    },
    "passOffense": {
      "yardsPerGame": 190.6,
      "grade": 1.9
    },
    "rushDefense": {
      "yardsAllowed": 117.7,
      "grade": 5.1
    },
    "passDefense": {
      "yardsAllowed": 239.4,
      "grade": 3.0
    },
    "thirdDownPct": 29.3,
    "redZonePct": 46.7,
    "turnoverDiff": -4,
    "specialTeams": {
      "fgPct": 80.6,
      "grade": 2.7
    },
    "coach": {
      "name": "Brian Callahan",
      "grade": 5.5
    },
    "homeField": {
      "stadium": "Nissan Stadium",
      "isOutdoor": true,
      "homeWinPct": 11.1,
      "advantageGrade": 1.0
    },
    "recentForm": [
      "L",
      "L",
      "W",
      "L",
      "W"
    ],
    "keyPlayers": {
      "wr1": {
        "name": "Elic Ayomanor",
        "grade": 1.3
      },
      "rb1": {
        "name": "Tony Pollard",
        "grade": 6.5
      },
      "cb1": {
        "name": "Darrell Baker Jr.",
        "grade": 1.9
      },
      "pass_rusher": {
        "name": "Jeffery Simmons",
        "grade": 7.4
      }
    },
    "injuryImpact": 0.0,
    "playoffExperience": 3.5
  },
  {
    "id": "commanders",
    "name": "Washington Commanders",
    "city": "Washington",
    "abbr": "WAS",
    "conference": "NFC",
    "division": "East",
    "primary": "#5A1414",
    "secondary": "#FFB612",
    "record": {
      "w": 5,
      "l": 12,
      "t": 0
    },
    "pointsPerGame": 20.9,
    "pointsAllowed": 26.5,
    "qb": {
      "name": "Marcus Mariota",
      "passerRating": 86.1,
      "touchdowns": 10,
      "interceptions": 7,
      "completionPct": 61.2,
      "grade": 3.0
    },
    "offenseLine": {
      "grade": 5.9
    },
    "defenseLine": {
      "grade": 6.2
    },
    "rushOffense": {
      "yardsPerGame": 134.7,
      "grade": 9.1
    },
    "passOffense": {
      "yardsPerGame": 195.8,
      "grade": 3.3
    },
    "rushDefense": {
      "yardsAllowed": 133.7,
      "grade": 2.7
    },
    "passDefense": {
      "yardsAllowed": 230.1,
      "grade": 4.2
    },
    "thirdDownPct": 36.4,
    "redZonePct": 55.6,
    "turnoverDiff": -11,
    "specialTeams": {
      "fgPct": 76.7,
      "grade": 1.9
    },
    "coach": {
      "name": "Dan Quinn",
      "grade": 7.8
    },
    "homeField": {
      "stadium": "Northwest Stadium",
      "isOutdoor": true,
      "homeWinPct": 25.0,
      "advantageGrade": 2.2
    },
    "recentForm": [
      "W",
      "L",
      "L",
      "W",
      "L"
    ],
    "keyPlayers": {
      "wr1": {
        "name": "Deebo Samuel Sr.",
        "grade": 3.6
      },
      "rb1": {
        "name": "Jacory Croskey-Merritt",
        "grade": 3.6
      },
      "cb1": {
        "name": "Mike Sainristil",
        "grade": 7.7
      },
      "pass_rusher": {
        "name": "Von Miller",
        "grade": 5.6
      }
    },
    "injuryImpact": 0.0,
    "playoffExperience": 5.5
  }
];

// === Calculation engine ===
const FACTOR_DEFS = [
  { id: "home_field",         label: "Home field advantage",  icon: "Home",
    desc: "Playing at home gives teams a boost from crowd noise and familiar surroundings." },
  { id: "season_record",      label: "Season record",         icon: "Trophy",
    desc: "A team's win-loss record shows how well they've been playing all season long." },
  { id: "recent_form",        label: "Recent form",           icon: "TrendingUp",
    desc: "How a team has been playing recently matters — hot teams keep winning!" },
  { id: "quarterback",        label: "Quarterback play",      icon: "Star",
    desc: "The quarterback is the most important player on offense — they touch the ball every play." },
  { id: "offensive_line",     label: "Offensive line",        icon: "Shield",
    desc: "The offensive line protects the quarterback and creates running lanes. Unsung heroes!" },
  { id: "pass_rush",          label: "Pass rush",             icon: "Zap",
    desc: "A powerful pass rush forces the other quarterback into bad decisions and mistakes." },
  { id: "scoring_offense",    label: "Scoring offense",       icon: "Target",
    desc: "Teams that score more points win more games — it's that simple!" },
  { id: "scoring_defense",    label: "Scoring defense",       icon: "Lock",
    desc: "A great defense stops the other team from scoring — just as important as scoring." },
  { id: "turnover_battle",    label: "Turnover battle",       icon: "RefreshCw",
    desc: "Turnovers are huge momentum swings — the team that creates more usually wins." },
  { id: "third_down",         label: "Third-down efficiency", icon: "ArrowRight",
    desc: "Converting 3rd downs keeps drives alive and controls the ball longer." },
  { id: "red_zone",           label: "Red zone offense",      icon: "MapPin",
    desc: "The red zone is the last 20 yards — great teams turn chances into touchdowns." },
  { id: "rushing_attack",     label: "Rushing attack",        icon: "Activity",
    desc: "A strong running game wears down defenses and opens up the passing game." },
  { id: "passing_game",       label: "Passing game",          icon: "Send",
    desc: "The passing game moves the ball quickly and can score from anywhere." },
  { id: "wr_vs_cb",           label: "WR vs CB matchup",      icon: "Users",
    desc: "Receivers try to get open; corners try to stop them. This matchup can decide the game." },
  { id: "special_teams",      label: "Special teams",         icon: "Crosshair",
    desc: "Kicking, punting, and returns may not be glamorous, but they decide close games." },
  { id: "coaching",           label: "Coaching",              icon: "Briefcase",
    desc: "Great coaches make smart game plans and adjust during the game — they're the brain." },
  { id: "playoff_experience", label: "Playoff experience",    icon: "Award",
    desc: "Teams that have been to the playoffs know how to handle the pressure of big games." },
  { id: "injury_impact",      label: "Injury impact",         icon: "AlertTriangle",
    desc: "Injuries to star players hurt a team's chances — staying healthy is huge." },
];

function clamp(x, lo, hi) { return Math.max(lo, Math.min(hi, x)); }

function magnitudeOf(delta) {
  const a = Math.abs(delta);
  if (a > 4) return "major";
  if (a >= 2) return "moderate";
  return "minor";
}

function winnerOf(delta) {
  if (delta > 0.05) return "A";
  if (delta < -0.05) return "B";
  return "tie";
}

function fmtPct(n) { return Math.round(n * 10) / 10 + "%"; }

function winPct(rec) {
  const g = (rec.w || 0) + (rec.l || 0) + (rec.t || 0);
  return g === 0 ? 0.5 : ((rec.w || 0) + (rec.t || 0) * 0.5) / g;
}

function recentWins(form) {
  return (form || []).filter((r) => r === "W").length;
}

function calculateMatchup(teamA, teamB, opts = {}) {
  const homeTeam = opts.homeTeam || "A"; // "A" | "B" | "neutral"
  const factors = [];

  // 1. Home field
  {
    let delta = 0;
    let aVal = "Away game", bVal = "Away game";
    if (homeTeam === "A") {
      delta = 3.5;
      aVal = `${Math.round(teamA.homeField.homeWinPct)}% home W%`;
      bVal = "Away game";
    } else if (homeTeam === "B") {
      delta = -3.5;
      aVal = "Away game";
      bVal = `${Math.round(teamB.homeField.homeWinPct)}% home W%`;
    } else {
      aVal = "Neutral site"; bVal = "Neutral site";
    }
    factors.push({
      ...FACTOR_DEFS[0], teamAValue: aVal, teamBValue: bVal,
      winner: winnerOf(delta), delta, magnitude: magnitudeOf(delta),
    });
  }

  // 2. Season record
  {
    const a = winPct(teamA.record), b = winPct(teamB.record);
    const delta = clamp((a - b) * 16, -8, 8);
    factors.push({
      ...FACTOR_DEFS[1],
      teamAValue: `${teamA.record.w}-${teamA.record.l}${teamA.record.t ? "-" + teamA.record.t : ""}`,
      teamBValue: `${teamB.record.w}-${teamB.record.l}${teamB.record.t ? "-" + teamB.record.t : ""}`,
      winner: winnerOf(delta), delta, magnitude: magnitudeOf(delta),
    });
  }

  // 3. Recent form (last 5)
  {
    const aw = recentWins(teamA.recentForm), bw = recentWins(teamB.recentForm);
    const delta = clamp((aw - bw) * 1.5, -7.5, 7.5);
    factors.push({
      ...FACTOR_DEFS[2],
      teamAValue: `${aw}-${5 - aw} last 5`,
      teamBValue: `${bw}-${5 - bw} last 5`,
      winner: winnerOf(delta), delta, magnitude: magnitudeOf(delta),
    });
  }

  // 4. Quarterback
  {
    const delta = clamp((teamA.qb.grade - teamB.qb.grade) * 2.2, -10, 10);
    factors.push({
      ...FACTOR_DEFS[3],
      teamAValue: `${teamA.qb.name} (${teamA.qb.passerRating.toFixed(1)} rtg)`,
      teamBValue: `${teamB.qb.name} (${teamB.qb.passerRating.toFixed(1)} rtg)`,
      winner: winnerOf(delta), delta, magnitude: magnitudeOf(delta),
    });
  }

  // 5. Offensive line
  {
    const delta = clamp((teamA.offenseLine.grade - teamB.offenseLine.grade) * 1.5, -6, 6);
    factors.push({
      ...FACTOR_DEFS[4],
      teamAValue: `O-line ${teamA.offenseLine.grade.toFixed(1)}/10`,
      teamBValue: `O-line ${teamB.offenseLine.grade.toFixed(1)}/10`,
      winner: winnerOf(delta), delta, magnitude: magnitudeOf(delta),
    });
  }

  // 6. Pass rush
  {
    const delta = clamp((teamA.defenseLine.grade - teamB.defenseLine.grade) * 1.3, -5, 5);
    factors.push({
      ...FACTOR_DEFS[5],
      teamAValue: `Pass rush ${teamA.defenseLine.grade.toFixed(1)}/10`,
      teamBValue: `Pass rush ${teamB.defenseLine.grade.toFixed(1)}/10`,
      winner: winnerOf(delta), delta, magnitude: magnitudeOf(delta),
    });
  }

  // 7. Scoring offense
  {
    const delta = clamp((teamA.pointsPerGame - teamB.pointsPerGame) * 0.4, -6, 6);
    factors.push({
      ...FACTOR_DEFS[6],
      teamAValue: `${teamA.pointsPerGame.toFixed(1)} PPG`,
      teamBValue: `${teamB.pointsPerGame.toFixed(1)} PPG`,
      winner: winnerOf(delta), delta, magnitude: magnitudeOf(delta),
    });
  }

  // 8. Scoring defense
  {
    const delta = clamp((teamB.pointsAllowed - teamA.pointsAllowed) * 0.4, -6, 6);
    factors.push({
      ...FACTOR_DEFS[7],
      teamAValue: `${teamA.pointsAllowed.toFixed(1)} PA/g`,
      teamBValue: `${teamB.pointsAllowed.toFixed(1)} PA/g`,
      winner: winnerOf(delta), delta, magnitude: magnitudeOf(delta),
    });
  }

  // 9. Turnover battle
  {
    const delta = clamp((teamA.turnoverDiff - teamB.turnoverDiff) * 0.5, -5, 5);
    const sgn = (n) => (n > 0 ? `+${n}` : `${n}`);
    factors.push({
      ...FACTOR_DEFS[8],
      teamAValue: `${sgn(teamA.turnoverDiff)} TO diff`,
      teamBValue: `${sgn(teamB.turnoverDiff)} TO diff`,
      winner: winnerOf(delta), delta, magnitude: magnitudeOf(delta),
    });
  }

  // 10. Third down
  {
    const delta = clamp((teamA.thirdDownPct - teamB.thirdDownPct) * 0.2, -4, 4);
    factors.push({
      ...FACTOR_DEFS[9],
      teamAValue: `${teamA.thirdDownPct.toFixed(1)}% on 3rd`,
      teamBValue: `${teamB.thirdDownPct.toFixed(1)}% on 3rd`,
      winner: winnerOf(delta), delta, magnitude: magnitudeOf(delta),
    });
  }

  // 11. Red zone
  {
    const delta = clamp((teamA.redZonePct - teamB.redZonePct) * 0.15, -3, 3);
    factors.push({
      ...FACTOR_DEFS[10],
      teamAValue: `${teamA.redZonePct.toFixed(1)}% RZ TD`,
      teamBValue: `${teamB.redZonePct.toFixed(1)}% RZ TD`,
      winner: winnerOf(delta), delta, magnitude: magnitudeOf(delta),
    });
  }

  // 12. Rushing attack
  {
    const aAdv = teamA.rushOffense.grade - teamB.rushDefense.grade;
    const bAdv = teamB.rushOffense.grade - teamA.rushDefense.grade;
    const delta = clamp((aAdv - bAdv) * 0.7, -3, 3);
    factors.push({
      ...FACTOR_DEFS[11],
      teamAValue: `${Math.round(teamA.rushOffense.yardsPerGame)} rush yds/g`,
      teamBValue: `${Math.round(teamB.rushOffense.yardsPerGame)} rush yds/g`,
      winner: winnerOf(delta), delta, magnitude: magnitudeOf(delta),
    });
  }

  // 13. Passing game
  {
    const aAdv = teamA.passOffense.grade - teamB.passDefense.grade;
    const bAdv = teamB.passOffense.grade - teamA.passDefense.grade;
    const delta = clamp((aAdv - bAdv) * 0.8, -4, 4);
    factors.push({
      ...FACTOR_DEFS[12],
      teamAValue: `${Math.round(teamA.passOffense.yardsPerGame)} pass yds/g`,
      teamBValue: `${Math.round(teamB.passOffense.yardsPerGame)} pass yds/g`,
      winner: winnerOf(delta), delta, magnitude: magnitudeOf(delta),
    });
  }

  // 14. WR vs CB
  {
    const aAdv = teamA.keyPlayers.wr1.grade - teamB.keyPlayers.cb1.grade;
    const bAdv = teamB.keyPlayers.wr1.grade - teamA.keyPlayers.cb1.grade;
    const delta = clamp((aAdv - bAdv) * 0.6, -3, 3);
    factors.push({
      ...FACTOR_DEFS[13],
      teamAValue: `${teamA.keyPlayers.wr1.name} vs ${teamB.keyPlayers.cb1.name}`,
      teamBValue: `${teamB.keyPlayers.wr1.name} vs ${teamA.keyPlayers.cb1.name}`,
      winner: winnerOf(delta), delta, magnitude: magnitudeOf(delta),
    });
  }

  // 15. Special teams
  {
    const delta = clamp((teamA.specialTeams.grade - teamB.specialTeams.grade) * 0.5, -2, 2);
    factors.push({
      ...FACTOR_DEFS[14],
      teamAValue: `${teamA.specialTeams.fgPct.toFixed(1)}% FG`,
      teamBValue: `${teamB.specialTeams.fgPct.toFixed(1)}% FG`,
      winner: winnerOf(delta), delta, magnitude: magnitudeOf(delta),
    });
  }

  // 16. Coaching
  {
    const delta = clamp((teamA.coach.grade - teamB.coach.grade) * 1.2, -4, 4);
    factors.push({
      ...FACTOR_DEFS[15],
      teamAValue: `${teamA.coach.name}`,
      teamBValue: `${teamB.coach.name}`,
      winner: winnerOf(delta), delta, magnitude: magnitudeOf(delta),
    });
  }

  // 17. Playoff experience
  {
    const delta = clamp((teamA.playoffExperience - teamB.playoffExperience) * 0.4, -3, 3);
    factors.push({
      ...FACTOR_DEFS[16],
      teamAValue: `${teamA.playoffExperience.toFixed(1)}/10 exp`,
      teamBValue: `${teamB.playoffExperience.toFixed(1)}/10 exp`,
      winner: winnerOf(delta), delta, magnitude: magnitudeOf(delta),
    });
  }

  // 18. Injury impact
  {
    const delta = clamp(teamA.injuryImpact - teamB.injuryImpact, -5, 5);
    factors.push({
      ...FACTOR_DEFS[17],
      teamAValue: teamA.injuryImpact === 0 ? "Mostly healthy" : `${teamA.injuryImpact.toFixed(1)} impact`,
      teamBValue: teamB.injuryImpact === 0 ? "Mostly healthy" : `${teamB.injuryImpact.toFixed(1)} impact`,
      winner: winnerOf(delta), delta, magnitude: magnitudeOf(delta),
    });
  }

  let prob = 50.0;
  factors.forEach((f) => { prob += f.delta; });
  prob = clamp(prob, 5, 95);

  let confidenceLabel = "Too close to call";
  const swing = Math.abs(prob - 50);
  if (swing > 25) confidenceLabel = "Strong favorite";
  else if (swing > 15) confidenceLabel = "Likely winner";
  else if (swing > 8) confidenceLabel = "Slight edge";

  return {
    factors,
    finalProbability: prob,
    teamBProbability: 100 - prob,
    confidenceLabel,
  };
}

// === Hooks ===
function useAnimatedNumber(target, duration = 350) {
  const [display, setDisplay] = useState(target);
  const fromRef = useRef(target);
  const startRef = useRef(0);
  const rafRef = useRef(0);
  useEffect(() => {
    fromRef.current = display;
    startRef.current = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - startRef.current) / duration);
      const v = fromRef.current + (target - fromRef.current) * t;
      setDisplay(v);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);
  return display;
}

function injectStylesOnce() {
  if (typeof document === "undefined") return;
  if (document.getElementById("nfl-predictor-styles")) return;
  const el = document.createElement("style");
  el.id = "nfl-predictor-styles";
  el.textContent = `
    @keyframes nflSlideUp {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes nflPulse {
      0%, 100% { opacity: 1; }
      50%       { opacity: 0.4; }
    }
    @keyframes nflScanBar {
      0%   { left: 0%; width: 30%; }
      50%  { left: 70%; width: 30%; }
      100% { left: 0%; width: 30%; }
    }
    @keyframes nflFadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes nflShimmer {
      0%   { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    .nfl-focusable:focus-visible {
      outline: 3px solid #58a6ff;
      outline-offset: 2px;
      border-radius: 6px;
    }
    select.nfl-focusable:focus-visible,
    button.nfl-focusable:focus-visible { outline-offset: 3px; }
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    }
  `;
  document.head.appendChild(el);
}

const DIVISIONS = [
  ["AFC", "East",  ["BUF", "MIA", "NE", "NYJ"]],
  ["AFC", "North", ["BAL", "CIN", "CLE", "PIT"]],
  ["AFC", "South", ["HOU", "IND", "JAX", "TEN"]],
  ["AFC", "West",  ["DEN", "KC", "LAC", "LV"]],
  ["NFC", "East",  ["DAL", "NYG", "PHI", "WAS"]],
  ["NFC", "North", ["CHI", "DET", "GB", "MIN"]],
  ["NFC", "South", ["ATL", "CAR", "NO", "TB"]],
  ["NFC", "West",  ["ARI", "LAR", "SEA", "SF"]],
];

// === TeamTile (abbreviation chip — strong team mnemonic) ===
function TeamTile({ team, size = 56 }) {
  if (!team) return null;
  // White abbr on solid primary by default; if primary is too light, fall back to dark text.
  const onPrimary = contrastRatio("#ffffff", team.primary) >= 3.5 ? "#ffffff" : "#0d1117";
  return (
    <div
      aria-hidden="true"
      style={{
        width: size, height: size, borderRadius: 12, flexShrink: 0,
        background: team.primary,
        color: onPrimary,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontWeight: 900, fontSize: Math.round(size * 0.36),
        letterSpacing: -0.5, lineHeight: 1,
        border: `2px solid ${team.secondary || COLORS.border}`,
        boxShadow: `inset 0 0 0 2px rgba(255,255,255,0.08)`,
        fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
      }}
    >
      {team.abbr}
    </div>
  );
}

// === TeamPicker ===
function TeamPicker({ value, onChange, excludeId, side, allTeams }) {
  const team = allTeams.find((t) => t.id === value);
  const accent = team ? team.primary : COLORS.border;
  const teamFg = team ? fgColor(team) : COLORS.text;
  const sortedDivs = DIVISIONS.map(([conf, div, abbrs]) => {
    const teams = abbrs
      .map((a) => allTeams.find((t) => t.abbr === a))
      .filter(Boolean)
      .sort((x, y) => x.name.localeCompare(y.name));
    return { conf, div, teams };
  });

  return (
    <div
      style={{
        background: COLORS.surface,
        border: `0.5px solid ${COLORS.border}`,
        borderRadius: 14,
        padding: 18,
        borderLeft: side === "left" ? `5px solid ${accent}` : `0.5px solid ${COLORS.border}`,
        borderRight: side === "right" ? `5px solid ${accent}` : `0.5px solid ${COLORS.border}`,
        minHeight: 240,
        display: "flex", flexDirection: "column", gap: 14,
      }}
    >
      <div
        style={{
          fontSize: TYPE.caps, fontWeight: 700, letterSpacing: 1,
          color: COLORS.textSec, textTransform: "uppercase",
        }}
      >
        {side === "left" ? "Team A" : "Team B"}
      </div>
      <div style={{ position: "relative" }}>
        <label
          htmlFor={`nfl-pick-${side}`}
          style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap", border: 0 }}
        >
          {side === "left" ? "Choose Team A" : "Choose Team B"}
        </label>
        <select
          id={`nfl-pick-${side}`}
          className="nfl-focusable"
          value={value || ""}
          onChange={(e) => onChange(e.target.value || null)}
          style={{
            width: "100%", padding: "16px 48px 16px 16px",
            background: COLORS.raised, color: COLORS.text,
            border: `1px solid ${COLORS.border}`, borderRadius: 10,
            fontSize: 17, fontWeight: 600, appearance: "none",
            cursor: "pointer", outline: "none", minHeight: 52,
          }}
        >
          <option value="">— Choose a team —</option>
          {sortedDivs.map(({ conf, div, teams }) => (
            <optgroup key={`${conf}-${div}`} label={`${conf} ${div}`}>
              {teams.map((t) => (
                <option key={t.id} value={t.id} disabled={t.id === excludeId}>
                  {t.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <ChevronDown
          size={22}
          style={{
            position: "absolute", right: 14, top: "50%",
            transform: "translateY(-50%)", color: COLORS.textSec, pointerEvents: "none",
          }}
        />
      </div>
      {team ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div
            style={{
              background: `${team.primary}1f`,
              padding: "12px 14px", borderRadius: 10,
              borderLeft: `4px solid ${team.primary}`,
              display: "flex", alignItems: "center", gap: 12,
            }}
          >
            <TeamTile team={team} size={48} />
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: TYPE.teamNameLg, fontWeight: 800,
                  color: teamFg, lineHeight: 1.05,
                }}
              >
                {team.name}
              </div>
              <div
                style={{
                  fontSize: TYPE.small, color: COLORS.textSec,
                  marginTop: 4, fontWeight: 500,
                }}
              >
                {team.conference} {team.division} · {team.homeField.stadium}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <Pill emphasis>
              {team.record.w}-{team.record.l}{team.record.t ? `-${team.record.t}` : ""}
            </Pill>
            <Pill>QB: {team.qb.name}</Pill>
            <Pill>{team.pointsPerGame.toFixed(1)} PPG</Pill>
          </div>
        </div>
      ) : (
        <div style={{ color: COLORS.textSec, fontSize: 14, fontStyle: "italic" }}>
          Pick a team from the list above.
        </div>
      )}
    </div>
  );
}

function Pill({ children, emphasis }) {
  return (
    <span
      style={{
        padding: "6px 12px",
        background: emphasis ? COLORS.raised : COLORS.bg,
        border: `1px solid ${emphasis ? COLORS.textMute : COLORS.border}`,
        borderRadius: 999,
        fontSize: 13, color: COLORS.text, fontWeight: 600,
      }}
    >
      {children}
    </span>
  );
}

// === ProbabilityBar ===
function ProbabilityBar({ probA, colorA, colorB, teamAName, teamBName }) {
  const a = clamp(probA, 0, 100);
  // If the two team colors are too similar, render Team B with a diagonal stripe
  // pattern so the split is always legible.
  const colorsClash = contrastRatio(colorA, colorB) < 2.5;
  const bFill = colorsClash
    ? `repeating-linear-gradient(45deg, ${colorB} 0 10px, ${lighten(colorB, 0.18)} 10px 20px)`
    : colorB;
  return (
    <div
      role="img"
      aria-label={`${teamAName || "Team A"} ${Math.round(a)}% versus ${teamBName || "Team B"} ${Math.round(100 - a)}%`}
      style={{
        position: "relative", width: "100%", height: 18,
        background: COLORS.raised, borderRadius: 999, overflow: "hidden",
        border: `1px solid ${COLORS.border}`,
        boxShadow: "inset 0 1px 2px rgba(0,0,0,0.08)",
      }}
    >
      <div
        style={{
          position: "absolute", left: 0, top: 0, bottom: 0,
          width: `${a}%`, background: colorA,
          transition: "width 350ms ease-out",
        }}
      />
      <div
        style={{
          position: "absolute", right: 0, top: 0, bottom: 0,
          width: `${100 - a}%`, background: bFill,
          transition: "width 350ms ease-out",
          boxShadow: colorsClash ? "inset 0 0 0 2px rgba(255,255,255,0.3)" : "none",
        }}
      />
      <div
        style={{
          position: "absolute", top: 0, bottom: 0, left: `${a}%`,
          width: 3, background: "#ffffff",
          transform: "translateX(-1.5px)",
          transition: "left 350ms ease-out",
          boxShadow: "0 0 0 1px rgba(0,0,0,0.18)",
        }}
      />
    </div>
  );
}

// === FactorCard ===
function FactorCard({ factor, teamAName, teamBName, colorA, colorB, teamA, teamB, index, isActive }) {
  const Icon = ICON_MAP[factor.icon] || Sparkles;
  const isA = factor.winner === "A";
  const isB = factor.winner === "B";
  const isTie = factor.winner === "tie";
  // Use team-color (not generic green/red) for advantage so kids tie color → team
  const accent = isA ? colorA : isB ? colorB : COLORS.blue;
  const magOpacity = factor.magnitude === "major" ? 1 : factor.magnitude === "moderate" ? 0.85 : 0.65;
  const deltaText = isTie
    ? "±0%"
    : (factor.delta > 0 ? `+${factor.delta.toFixed(1)}%` : `${factor.delta.toFixed(1)}%`);
  // Team abbreviation (more recognizable than full name in a small badge)
  const winnerAbbr = isA ? (teamA && teamA.abbr) : isB ? (teamB && teamB.abbr) : null;
  const badgeText = isA
    ? `▲ ${winnerAbbr || teamAName} advantage`
    : isB
    ? `▼ ${winnerAbbr || teamBName} advantage`
    : "◆ Even matchup";
  const badgeFg = (isA || isB) && contrastRatio("#ffffff", accent) >= 3.5 ? "#ffffff" : "#0d1117";

  return (
    <div
      style={{
        background: COLORS.surface,
        border: `1px solid ${isActive ? accent : COLORS.border}`,
        borderLeft: `${isActive ? 8 : 5}px solid ${accent}`,
        borderRadius: 14,
        padding: isActive ? 18 : 16,
        boxShadow: isActive ? `0 8px 24px ${accent}33, 0 0 0 1px ${accent}55` : "none",
        transform: isActive ? "scale(1.01)" : "none",
        opacity: isActive ? 1 : 0.92,
        animation: "nflSlideUp 220ms ease-out both",
        animationDelay: `${Math.min(index * 30, 200)}ms`,
        display: "flex", flexDirection: "column", gap: 12,
        transition: "transform 200ms ease, opacity 200ms ease, box-shadow 200ms ease, padding 200ms ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        <div
          style={{
            width: 40, height: 40, flexShrink: 0,
            background: `${accent}22`, borderRadius: 10,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: accent, opacity: magOpacity,
            border: `1.5px solid ${accent}55`,
          }}
        >
          <Icon size={22} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex", justifyContent: "space-between",
              alignItems: "center", gap: 10,
            }}
          >
            <div style={{ fontSize: TYPE.factorLabel, fontWeight: 700, color: COLORS.text }}>
              {factor.label}
            </div>
            <div
              style={{
                fontSize: 16, fontWeight: 800, color: accent,
                fontVariantNumeric: "tabular-nums",
                background: `${accent}1f`,
                padding: "4px 10px", borderRadius: 8,
                border: `1px solid ${accent}55`,
              }}
            >
              {deltaText}
            </div>
          </div>
          <div
            style={{
              fontSize: TYPE.factorDesc, color: COLORS.textSec,
              marginTop: 6, lineHeight: 1.5,
            }}
          >
            {factor.description || factor.desc}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "stretch" }}>
        <StatPill color={colorA} label={teamA ? teamA.abbr : teamAName} value={factor.teamAValue} />
        <span
          style={{
            color: COLORS.textSec, fontSize: 12, fontWeight: 700, letterSpacing: 1,
            display: "flex", alignItems: "center",
            background: COLORS.raised, padding: "0 10px",
            borderRadius: 999, border: `1px solid ${COLORS.border}`,
          }}
        >
          VS
        </span>
        <StatPill color={colorB} label={teamB ? teamB.abbr : teamBName} value={factor.teamBValue} />
      </div>
      <div
        style={{
          display: "inline-flex", alignSelf: isA ? "flex-start" : isB ? "flex-end" : "center",
          padding: "8px 14px", borderRadius: 999,
          background: accent, color: badgeFg,
          fontSize: 13, fontWeight: 800, letterSpacing: 0.3,
          border: `1px solid ${accent}`,
          boxShadow: `0 2px 8px ${accent}44`,
        }}
      >
        {badgeText}
      </div>
    </div>
  );
}

function StatPill({ color, label, value }) {
  return (
    <div
      style={{
        display: "flex", flexDirection: "column",
        padding: "10px 14px", borderRadius: 10,
        background: `${color}26`,
        border: `2px solid ${color}`,
        borderLeft: `8px solid ${color}`,
        flex: "1 1 160px", minWidth: 0, minHeight: 56,
      }}
    >
      <div
        style={{
          fontSize: TYPE.pillLabel, fontWeight: 700, letterSpacing: 0.5,
          color: COLORS.textSec, textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: TYPE.pillValue, fontWeight: 700, color: COLORS.text,
          marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}
        title={value}
      >
        {value}
      </div>
    </div>
  );
}

// === MiniBarChart ===
function MiniBarChart({ factors, colorA, colorB }) {
  const maxAbs = Math.max(...factors.map((f) => Math.abs(f.delta)), 1);
  const colorsClash = contrastRatio(colorA, colorB) < 2.5;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {factors.map((f) => {
        const w = (Math.abs(f.delta) / maxAbs) * 50;
        const isA = f.delta > 0;
        const isB = f.delta < 0;
        let color = isA ? colorA : isB ? colorB : COLORS.blue;
        const stripe = colorsClash && isB
          ? `repeating-linear-gradient(45deg, ${colorB} 0 6px, ${lighten(colorB, 0.18)} 6px 12px)`
          : color;
        return (
          <div
            key={f.id}
            style={{
              display: "grid", gridTemplateColumns: "150px 1fr 64px",
              alignItems: "center", gap: 10, fontSize: TYPE.small,
            }}
          >
            <div
              style={{
                color: COLORS.text, textAlign: "right", fontWeight: 500,
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}
              title={f.label}
            >
              {f.label}
            </div>
            <div
              style={{
                position: "relative", height: 14,
                background: COLORS.raised, borderRadius: 4, overflow: "hidden",
                border: `1px solid ${COLORS.border}`,
              }}
            >
              <div
                style={{
                  position: "absolute", top: 0, bottom: 0, left: "50%",
                  width: 1, background: COLORS.textMute,
                }}
              />
              <div
                style={{
                  position: "absolute", top: 0, bottom: 0,
                  left: isA ? "50%" : `${50 - w}%`,
                  width: `${w}%`, background: stripe,
                  transition: "all 350ms ease-out",
                }}
              />
            </div>
            <div
              style={{
                color: isA ? colorA : isB ? lighten(colorB, 0.15) : COLORS.blue,
                fontWeight: 700,
                fontVariantNumeric: "tabular-nums", textAlign: "right",
              }}
            >
              {f.delta > 0 ? "+" : ""}{f.delta.toFixed(1)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// === Loading scanner ===
function ScanningPanel({ teamA, teamB }) {
  const messages = [
    `Loading ${teamA.abbr} roster...`,
    `Loading ${teamB.abbr} roster...`,
    `Comparing quarterbacks...`,
    `Calculating home field edge...`,
    `Running matchup model...`,
  ];
  const [msgIdx, setMsgIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setMsgIdx((i) => (i + 1) % messages.length), 1100);
    return () => clearInterval(id);
  }, []);
  return (
    <div
      style={{
        background: COLORS.surface, border: `0.5px solid ${COLORS.border}`,
        borderRadius: 16, padding: "32px 24px",
        display: "flex", flexDirection: "column",
        alignItems: "center", gap: 20, minHeight: 220,
      }}
    >
      <div
        style={{
          display: "flex", alignItems: "center", gap: 18,
          fontSize: TYPE.teamNameLg, fontWeight: 800,
        }}
      >
        <TeamTile team={teamA} size={48} />
        <span style={{ color: fgColor(teamA) }}>{teamA.name}</span>
        <span style={{ color: COLORS.textSec, fontSize: 16, letterSpacing: 2, fontWeight: 700 }}>VS</span>
        <span style={{ color: fgColor(teamB) }}>{teamB.name}</span>
        <TeamTile team={teamB} size={48} />
      </div>
      <div
        style={{
          position: "relative", width: "70%", height: 4,
          background: COLORS.raised, borderRadius: 2, overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute", top: 0, bottom: 0,
            background: `linear-gradient(90deg, transparent, ${COLORS.blue}, transparent)`,
            animation: "nflScanBar 1.4s ease-in-out infinite",
          }}
        />
      </div>
      <div
        aria-live="polite"
        style={{
          fontSize: 15, color: COLORS.text, fontWeight: 600,
          fontFamily: "ui-monospace, monospace", minHeight: 22,
        }}
      >
        {messages[msgIdx]}
      </div>
    </div>
  );
}

// === Main component ===
export default function NFLWinPredictor() {
  const [phase, setPhase] = useState("select"); // select | scanning | reveal | result
  const [teamAId, setTeamAId] = useState(null);
  const [teamBId, setTeamBId] = useState(null);
  const [matchup, setMatchup] = useState(null);
  const [revealedCount, setRevealedCount] = useState(0);
  const [currentProb, setCurrentProb] = useState(50);
  const [homeTeam, setHomeTeam] = useState("A"); // A | B | neutral

  useEffect(() => { injectStylesOnce(); }, []);

  const teamA = NFL_TEAMS.find((t) => t.id === teamAId) || null;
  const teamB = NFL_TEAMS.find((t) => t.id === teamBId) || null;
  const sameTeam = teamAId && teamBId && teamAId === teamBId;
  const canStart = teamA && teamB && !sameTeam;

  const animatedProb = useAnimatedNumber(currentProb, 350);

  // Phase 2 → Phase 3 (after 0.8s)
  useEffect(() => {
    if (phase !== "scanning") return;
    const t = setTimeout(() => setPhase("reveal"), 800);
    return () => clearTimeout(t);
  }, [phase]);

  // Phase 3 reveal sequencing
  useEffect(() => {
    if (phase !== "reveal" || !matchup) return;
    if (revealedCount >= matchup.factors.length) {
      const t = setTimeout(() => setPhase("result"), 600);
      return () => clearTimeout(t);
    }
    const delay = revealedCount === 0 ? 0 : 430;
    const t = setTimeout(() => {
      const next = revealedCount + 1;
      setRevealedCount(next);
      const newProb = matchup.factors
        .slice(0, next)
        .reduce((acc, f) => acc + f.delta, 50);
      setCurrentProb(clamp(newProb, 5, 95));
    }, delay);
    return () => clearTimeout(t);
  }, [phase, revealedCount, matchup]);

  const startAnalysis = useCallback(() => {
    if (!teamA || !teamB) return;
    const m = calculateMatchup(teamA, teamB, { homeTeam });
    setMatchup(m);
    setRevealedCount(0);
    setCurrentProb(50);
    setPhase("scanning");
  }, [teamA, teamB, homeTeam]);

  const reset = useCallback(() => {
    setPhase("select");
    setMatchup(null);
    setRevealedCount(0);
    setCurrentProb(50);
  }, []);

  const skipToResult = useCallback(() => {
    if (!matchup) return;
    setRevealedCount(matchup.factors.length);
    setCurrentProb(matchup.finalProbability);
    setPhase("result");
  }, [matchup]);

  const explainPrediction = useCallback(() => {
    if (!matchup || !teamA || !teamB) return;
    const winner = matchup.finalProbability >= 50 ? teamA : teamB;
    const winProb = Math.round(
      matchup.finalProbability >= 50 ? matchup.finalProbability : matchup.teamBProbability
    );
    const top3 = [...matchup.factors]
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
      .slice(0, 3)
      .map((f) => f.label)
      .join(", ");
    const prompt =
      `Explain the NFL win probability prediction for ${teamA.name} vs ${teamB.name}. ` +
      `The model predicted ${winner.name} with ${winProb}% probability. ` +
      `The biggest factors were: ${top3}. Use simple language for 5th graders.`;
    if (typeof window !== "undefined" && typeof window.sendPrompt === "function") {
      window.sendPrompt(prompt);
    } else if (typeof window !== "undefined" && typeof window.claude !== "undefined" && typeof window.claude.sendPrompt === "function") {
      window.claude.sendPrompt(prompt);
    } else if (typeof window !== "undefined") {
      console.log("[sendPrompt unavailable] →", prompt);
      alert("This button asks Claude to explain the prediction in 5th-grade language. (sendPrompt not available in this environment.)");
    }
  }, [matchup, teamA, teamB]);

  return (
    <div
      style={{
        background: COLORS.bg, color: COLORS.text,
        minHeight: 600, fontFamily: "system-ui, -apple-system, sans-serif",
        padding: 0,
      }}
    >
      <Header />
      <div style={{ padding: "20px 24px", maxWidth: 980, margin: "0 auto" }}>
        {phase === "select" && (
          <SelectScreen
            teamAId={teamAId} setTeamAId={setTeamAId}
            teamBId={teamBId} setTeamBId={setTeamBId}
            sameTeam={sameTeam} canStart={canStart}
            startAnalysis={startAnalysis}
            homeTeam={homeTeam} setHomeTeam={setHomeTeam}
            teamA={teamA} teamB={teamB}
          />
        )}
        {phase === "scanning" && teamA && teamB && (
          <ScanningPanel teamA={teamA} teamB={teamB} />
        )}
        {phase === "reveal" && matchup && teamA && teamB && (
          <RevealScreen
            teamA={teamA} teamB={teamB} matchup={matchup}
            revealedCount={revealedCount} animatedProb={animatedProb}
            onSkip={skipToResult}
          />
        )}
        {phase === "result" && matchup && teamA && teamB && (
          <ResultScreen
            teamA={teamA} teamB={teamB} matchup={matchup}
            reset={reset} explainPrediction={explainPrediction}
          />
        )}
        <HowItWorks />
      </div>
    </div>
  );
}

function Header() {
  return (
    <div
      style={{
        background: COLORS.surface, borderBottom: `1px solid ${COLORS.border}`,
        padding: "20px 24px",
      }}
    >
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 44, height: 44, borderRadius: 12,
              background: `linear-gradient(135deg, ${COLORS.blue}, ${COLORS.gold})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#ffffff",
            }}
          >
            <Sparkles size={24} />
          </div>
          <div>
            <div
              style={{
                fontSize: TYPE.title, fontWeight: 800,
                letterSpacing: -0.5, lineHeight: 1.05,
              }}
            >
              NFL Win Predictor
            </div>
            <div
              style={{
                fontSize: TYPE.body, color: COLORS.textSec,
                marginTop: 4, fontWeight: 500,
              }}
            >
              A STEM Fair Project — real 2025 NFL data + math = predictions
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SelectScreen({
  teamAId, setTeamAId, teamBId, setTeamBId, sameTeam, canStart,
  startAnalysis, homeTeam, setHomeTeam, teamA, teamB,
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          gap: 12, alignItems: "stretch",
        }}
      >
        <TeamPicker
          value={teamAId}
          onChange={setTeamAId}
          excludeId={teamBId}
          side="left"
          allTeams={NFL_TEAMS}
        />
        <div
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            minWidth: 44,
          }}
        >
          <span
            style={{
              width: 44, height: 44, borderRadius: 999,
              background: COLORS.raised, border: `1.5px solid ${COLORS.border}`,
              color: COLORS.textSec, fontSize: 14, fontWeight: 800, letterSpacing: 1,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            VS
          </span>
        </div>
        <TeamPicker
          value={teamBId}
          onChange={setTeamBId}
          excludeId={teamAId}
          side="right"
          allTeams={NFL_TEAMS}
        />
      </div>

      <div
        style={{
          background: COLORS.surface, border: `0.5px solid ${COLORS.border}`,
          borderRadius: 14, padding: 18,
          display: "flex", flexDirection: "column", gap: 12,
        }}
      >
        <div
          style={{
            fontSize: TYPE.caps, fontWeight: 700, letterSpacing: 1,
            color: COLORS.textSec, textTransform: "uppercase",
          }}
        >
          Game location
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <LocChip
            active={homeTeam === "A"} onClick={() => setHomeTeam("A")}
            disabled={!teamA}
          >
            {teamA ? `${teamA.abbr} home` : "Team A home"}
          </LocChip>
          <LocChip
            active={homeTeam === "neutral"} onClick={() => setHomeTeam("neutral")}
          >
            Neutral site
          </LocChip>
          <LocChip
            active={homeTeam === "B"} onClick={() => setHomeTeam("B")}
            disabled={!teamB}
          >
            {teamB ? `${teamB.abbr} home` : "Team B home"}
          </LocChip>
        </div>
      </div>

      {sameTeam && (
        <div
          role="alert"
          style={{
            color: COLORS.red, fontSize: 14, fontWeight: 600,
            background: `${COLORS.red}1f`, padding: "12px 16px",
            borderRadius: 10, border: `2px solid ${COLORS.red}`,
          }}
        >
          Pick two different teams!
        </div>
      )}

      <button
        onClick={startAnalysis}
        disabled={!canStart}
        className="nfl-focusable"
        style={{
          padding: "22px 28px",
          fontSize: 20, fontWeight: 800, letterSpacing: 0.3,
          background: canStart
            ? `linear-gradient(135deg, ${COLORS.blue}, ${COLORS.gold})`
            : COLORS.raised,
          color: canStart ? "#ffffff" : COLORS.textMute,
          border: "none", borderRadius: 14,
          cursor: canStart ? "pointer" : "not-allowed",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
          minHeight: 64,
          boxShadow: canStart ? `0 6px 20px ${COLORS.blue}33` : "none",
          transition: "transform 120ms ease, box-shadow 200ms ease",
        }}
      >
        <Play size={22} />
        Analyze Matchup
      </button>
    </div>
  );
}

function LocChip({ active, onClick, disabled, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="nfl-focusable"
      style={{
        padding: "14px 22px",
        fontSize: 16, fontWeight: 700,
        background: active ? COLORS.blue : COLORS.raised,
        color: active ? "#ffffff" : (disabled ? COLORS.textMute : COLORS.text),
        border: `2px solid ${active ? COLORS.blue : COLORS.border}`,
        borderRadius: 999,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        minHeight: 48,
      }}
    >
      {children}
    </button>
  );
}

function RevealScreen({ teamA, teamB, matchup, revealedCount, animatedProb, onSkip }) {
  const probA = animatedProb;
  const probB = 100 - animatedProb;
  const visibleFactors = matchup.factors.slice(0, revealedCount);
  const inProgress = revealedCount < matchup.factors.length;
  const colorsClash = contrastRatio(teamA.primary, teamB.primary) < 2.5;
  const teamAFg = fgColor(teamA);
  const teamBFg = fgColor(teamB);
  const activeRef = useRef(null);

  useEffect(() => {
    if (activeRef.current && typeof activeRef.current.scrollIntoView === "function") {
      activeRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [revealedCount]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div
        style={{
          background: COLORS.surface, border: `0.5px solid ${COLORS.border}`,
          borderRadius: 16, padding: 18,
          position: "sticky", top: 8, zIndex: 5,
          display: "flex", flexDirection: "column", gap: 14,
          backdropFilter: "blur(8px)",
          boxShadow: "0 4px 16px rgba(15,23,42,0.08)",
        }}
      >
        <div
          style={{
            display: "grid", gridTemplateColumns: "1fr auto 1fr",
            alignItems: "center", gap: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            <TeamTile team={teamA} size={48} />
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: TYPE.caps, fontWeight: 700, letterSpacing: 1,
                  color: COLORS.textSec, textTransform: "uppercase",
                }}
              >
                Team A
              </div>
              <div
                style={{
                  fontSize: 20, fontWeight: 800, color: teamAFg,
                  lineHeight: 1.1, overflow: "hidden",
                  textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}
              >
                {teamA.name}
              </div>
            </div>
          </div>
          <div
            aria-live="polite"
            aria-atomic="true"
            style={{
              display: "flex", alignItems: "baseline", gap: 8,
              fontFamily: "ui-monospace, monospace",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            <span style={{ fontSize: TYPE.probSticky, fontWeight: 900, color: teamAFg }}>
              {Math.round(probA)}%
            </span>
            <span style={{ color: COLORS.textMute, fontWeight: 700, fontSize: 28 }}>:</span>
            <span style={{ fontSize: TYPE.probSticky, fontWeight: 900, color: teamBFg }}>
              {Math.round(probB)}%
            </span>
          </div>
          <div
            style={{
              display: "flex", alignItems: "center", gap: 12,
              minWidth: 0, justifyContent: "flex-end",
            }}
          >
            <div style={{ minWidth: 0, textAlign: "right" }}>
              <div
                style={{
                  fontSize: TYPE.caps, fontWeight: 700, letterSpacing: 1,
                  color: COLORS.textSec, textTransform: "uppercase",
                }}
              >
                Team B
              </div>
              <div
                style={{
                  fontSize: 20, fontWeight: 800, color: teamBFg,
                  lineHeight: 1.1, overflow: "hidden",
                  textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}
              >
                {teamB.name}
              </div>
            </div>
            <TeamTile team={teamB} size={48} />
          </div>
        </div>
        <ProbabilityBar
          probA={probA} colorA={teamA.primary} colorB={teamB.primary}
          teamAName={teamA.name} teamBName={teamB.name}
        />
        {colorsClash && (
          <div
            style={{
              fontSize: 12, color: COLORS.textSec,
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            <span
              style={{
                display: "inline-block", width: 16, height: 10, borderRadius: 2,
                background: `repeating-linear-gradient(45deg, ${teamB.primary} 0 5px, ${lighten(teamB.primary, 0.18)} 5px 10px)`,
              }}
            />
            Same team colors — {teamB.name} shown with stripes.
          </div>
        )}
        <div
          style={{
            display: "flex", alignItems: "center", gap: 10,
            justifyContent: "space-between", flexWrap: "wrap",
          }}
        >
          <div
            style={{
              display: "flex", alignItems: "center", gap: 8,
              fontSize: TYPE.caps, fontWeight: 700, letterSpacing: 1,
              color: inProgress ? COLORS.blue : COLORS.green,
            }}
          >
            <span
              style={{
                display: "inline-block", width: 10, height: 10, borderRadius: 999,
                background: "currentColor",
                animation: inProgress ? "nflPulse 1s ease-in-out infinite" : "none",
              }}
            />
            {inProgress ? "ANALYZING" : "COMPLETE"}
            <span style={{ color: COLORS.text, fontWeight: 600, letterSpacing: 0 }}>
              · {revealedCount} of {matchup.factors.length}
            </span>
          </div>
          {inProgress && (
            <button
              onClick={onSkip}
              className="nfl-focusable"
              style={{
                background: "transparent", color: COLORS.textSec,
                border: `1px solid ${COLORS.border}`, borderRadius: 999,
                padding: "6px 14px", fontSize: 13, fontWeight: 600,
                cursor: "pointer", minHeight: 36,
              }}
            >
              Skip to result →
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {visibleFactors.map((f, i) => {
          const isActive = i === visibleFactors.length - 1 && inProgress;
          return (
            <div ref={isActive ? activeRef : null} key={f.id}>
              <FactorCard
                factor={f}
                teamA={teamA} teamB={teamB}
                teamAName={teamA.name}
                teamBName={teamB.name}
                colorA={teamA.primary}
                colorB={teamB.primary}
                index={i}
                isActive={isActive}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ResultScreen({ teamA, teamB, matchup, reset, explainPrediction }) {
  const aWins = matchup.finalProbability >= 50;
  const winner = aWins ? teamA : teamB;
  const loser = aWins ? teamB : teamA;
  const winProb = aWins ? matchup.finalProbability : matchup.teamBProbability;

  const sorted = [...matchup.factors].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  const winnerSign = aWins ? 1 : -1;
  const winnerFactors = matchup.factors.filter((f) => f.delta * winnerSign > 0);
  const biggestEdge = sorted[0];
  const smallestForWinner = matchup.factors
    .filter((f) => f.delta * winnerSign > 0)
    .sort((a, b) => Math.abs(a.delta) - Math.abs(b.delta))[0];
  const biggestAgainstWinner = matchup.factors
    .filter((f) => f.delta * winnerSign < 0)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))[0];

  const qbFactor       = matchup.factors.find((f) => f.id === "quarterback");
  const defenseFactor  = matchup.factors.find((f) => f.id === "scoring_defense");
  const coachingFactor = matchup.factors.find((f) => f.id === "coaching");

  const factorWinner = (f) => {
    if (!f) return "—";
    if (f.winner === "A") return teamA.name;
    if (f.winner === "B") return teamB.name;
    return "Even";
  };

  return (
    <div
      style={{
        display: "flex", flexDirection: "column", gap: 16,
        animation: "nflSlideUp 400ms ease-out both",
      }}
    >
      <div
        style={{
          background: COLORS.surface,
          border: `0.5px solid ${COLORS.border}`,
          borderTop: `5px solid ${winner.primary}`,
          borderRadius: 18,
          padding: "32px 24px",
          display: "flex", flexDirection: "column",
          alignItems: "center", gap: 14,
          backgroundImage: `radial-gradient(circle at 50% 0%, ${winner.primary}22 0%, transparent 60%)`,
        }}
      >
        <div
          style={{
            fontSize: TYPE.caps, fontWeight: 700, letterSpacing: 1.5,
            color: COLORS.textSec, textTransform: "uppercase",
          }}
        >
          Predicted winner
        </div>
        <TeamTile team={winner} size={72} />
        <div
          style={{
            fontSize: TYPE.probHero, fontWeight: 900,
            color: fgColor(winner),
            fontFamily: "ui-monospace, monospace",
            fontVariantNumeric: "tabular-nums", lineHeight: 1,
            textShadow: `0 4px 24px ${winner.primary}55`,
          }}
        >
          {Math.round(winProb)}%
        </div>
        <div
          style={{
            fontSize: TYPE.resultName, fontWeight: 800,
            color: COLORS.text, textAlign: "center", lineHeight: 1.1,
          }}
        >
          {winner.name}
        </div>
        <div
          style={{
            fontSize: 14, color: COLORS.textSec, fontWeight: 500,
          }}
        >
          wins this matchup
        </div>
        <div
          style={{
            background: COLORS.gold, color: "#ffffff",
            padding: "8px 18px", borderRadius: 999,
            fontSize: 14, fontWeight: 800, letterSpacing: 0.5,
            border: `2px solid ${COLORS.gold}`,
            boxShadow: `0 4px 12px ${COLORS.gold}55`,
          }}
        >
          {matchup.confidenceLabel}
        </div>
        <div
          style={{
            color: COLORS.textSec, fontSize: TYPE.body,
            textAlign: "center", maxWidth: 580, marginTop: 6, lineHeight: 1.5,
          }}
        >
          Based on 18 factors from the 2025 NFL season, our model gives{" "}
          <strong style={{ color: COLORS.text }}>{winner.name}</strong>{" "}
          {matchup.confidenceLabel.toLowerCase()} status against{" "}
          <strong style={{ color: COLORS.text }}>{loser.name}</strong>.
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 10,
        }}
      >
        <SummaryCard
          label="Biggest factor"
          value={biggestEdge ? biggestEdge.label : "—"}
          sub={biggestEdge ? `${biggestEdge.delta > 0 ? "+" : ""}${biggestEdge.delta.toFixed(1)}%` : ""}
          color={biggestEdge ? (biggestEdge.delta > 0 ? teamA.primary : teamB.primary) : COLORS.textMute}
        />
        <SummaryCard
          label="Toughest spot for winner"
          value={biggestAgainstWinner ? biggestAgainstWinner.label : "Clean sweep"}
          sub={biggestAgainstWinner ? `${biggestAgainstWinner.delta > 0 ? "+" : ""}${biggestAgainstWinner.delta.toFixed(1)}%` : ""}
          color={COLORS.red}
        />
        <SummaryCard
          label="QB edge"
          value={factorWinner(qbFactor)}
          sub={qbFactor ? `${qbFactor.delta > 0 ? "+" : ""}${qbFactor.delta.toFixed(1)}%` : ""}
          color={COLORS.blue}
        />
        <SummaryCard
          label="Defense edge"
          value={factorWinner(defenseFactor)}
          sub={defenseFactor ? `${defenseFactor.delta > 0 ? "+" : ""}${defenseFactor.delta.toFixed(1)}%` : ""}
          color={COLORS.green}
        />
        <SummaryCard
          label="Coaching edge"
          value={factorWinner(coachingFactor)}
          sub={coachingFactor ? `${coachingFactor.delta > 0 ? "+" : ""}${coachingFactor.delta.toFixed(1)}%` : ""}
          color={COLORS.gold}
        />
        <SummaryCard
          label="Factors won by winner"
          value={`${winnerFactors.length} of ${matchup.factors.length}`}
          sub=""
          color={winner.primary}
        />
      </div>

      <div
        style={{
          background: COLORS.surface, border: `0.5px solid ${COLORS.border}`,
          borderRadius: 12, padding: 16,
          display: "flex", flexDirection: "column", gap: 10,
        }}
      >
        <div
          style={{
            fontSize: 11, fontWeight: 600, letterSpacing: 1.5,
            color: COLORS.textMute, textTransform: "uppercase",
          }}
        >
          Factor breakdown
        </div>
        <MiniBarChart
          factors={matchup.factors}
          colorA={teamA.primary}
          colorB={teamB.primary}
        />
        <div
          style={{
            display: "flex", justifyContent: "space-between",
            fontSize: 11, color: COLORS.textMute, marginTop: 4,
          }}
        >
          <span>← {teamB.name}</span>
          <span>{teamA.name} →</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button
          onClick={reset}
          className="nfl-focusable"
          style={{
            flex: "1 1 220px",
            padding: "18px 28px", fontSize: 17, fontWeight: 700,
            background: COLORS.raised, color: COLORS.text,
            border: `2px solid ${COLORS.border}`, borderRadius: 14,
            cursor: "pointer", minHeight: 60,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          }}
        >
          <Repeat size={20} /> Analyze another matchup
        </button>
        <button
          onClick={explainPrediction}
          className="nfl-focusable"
          style={{
            flex: "1 1 220px",
            padding: "18px 28px", fontSize: 17, fontWeight: 800,
            background: `linear-gradient(135deg, ${COLORS.blue}, ${COLORS.gold})`,
            color: "#ffffff",
            border: "none", borderRadius: 14, cursor: "pointer", minHeight: 60,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            boxShadow: `0 4px 16px ${COLORS.blue}33`,
          }}
        >
          <MessageSquare size={20} /> Explain this prediction
        </button>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, sub, color }) {
  return (
    <div
      style={{
        background: COLORS.surface, border: `0.5px solid ${COLORS.border}`,
        borderTop: `3px solid ${color || COLORS.border}`,
        borderRadius: 12, padding: 14,
        display: "flex", flexDirection: "column", gap: 6,
      }}
    >
      <div
        style={{
          fontSize: TYPE.pillLabel, fontWeight: 700, letterSpacing: 0.5,
          color: COLORS.textSec, textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 16, fontWeight: 800, color: color || COLORS.text,
          lineHeight: 1.2,
        }}
      >
        {value}
      </div>
      {sub && (
        <div
          style={{
            fontSize: 13, color: COLORS.textSec, fontWeight: 600,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

function HowItWorks() {
  return (
    <div
      style={{
        marginTop: 28,
        background: COLORS.surface, border: `0.5px solid ${COLORS.border}`,
        borderLeft: `4px solid ${COLORS.gold}`,
        borderRadius: 12, padding: 18,
        color: COLORS.text, fontSize: TYPE.body, lineHeight: 1.55,
      }}
    >
      <div
        style={{
          fontSize: TYPE.caps, fontWeight: 700, letterSpacing: 1,
          color: COLORS.gold, textTransform: "uppercase", marginBottom: 10,
          display: "flex", alignItems: "center", gap: 8,
        }}
      >
        <Sparkles size={16} /> How does this work?
      </div>
      We start at <strong>50–50</strong> (like a coin flip) and then look at{" "}
      <strong>18 different football facts</strong> — from quarterback play to home field
      to recent form. Each fact moves the prediction up or down a little. When we add
      them all up, we get our final prediction!
    </div>
  );
}

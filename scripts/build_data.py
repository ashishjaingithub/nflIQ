#!/usr/bin/env python3
"""Process nflverse 2025 regular-season CSVs into an embeddable JS NFL_TEAMS constant."""
import csv, json, math, sys
from collections import defaultdict

TEAM_META = {
  "ARI": {"id":"cardinals","name":"Arizona Cardinals","city":"Arizona","conference":"NFC","division":"West","primary":"#97233F","secondary":"#000000","coach":{"name":"Jonathan Gannon","grade":6.2},"stadium":"State Farm Stadium","isOutdoor":False,"playoffExperience":3.5},
  "ATL": {"id":"falcons","name":"Atlanta Falcons","city":"Atlanta","conference":"NFC","division":"South","primary":"#A71930","secondary":"#000000","coach":{"name":"Raheem Morris","grade":6.8},"stadium":"Mercedes-Benz Stadium","isOutdoor":False,"playoffExperience":4.0},
  "BAL": {"id":"ravens","name":"Baltimore Ravens","city":"Baltimore","conference":"AFC","division":"North","primary":"#241773","secondary":"#9E7C0C","coach":{"name":"John Harbaugh","grade":9.2},"stadium":"M&T Bank Stadium","isOutdoor":True,"playoffExperience":8.5},
  "BUF": {"id":"bills","name":"Buffalo Bills","city":"Buffalo","conference":"AFC","division":"East","primary":"#00338D","secondary":"#C60C30","coach":{"name":"Sean McDermott","grade":8.0},"stadium":"Highmark Stadium","isOutdoor":True,"playoffExperience":8.0},
  "CAR": {"id":"panthers","name":"Carolina Panthers","city":"Carolina","conference":"NFC","division":"South","primary":"#0085CA","secondary":"#101820","coach":{"name":"Dave Canales","grade":5.5},"stadium":"Bank of America Stadium","isOutdoor":True,"playoffExperience":2.5},
  "CHI": {"id":"bears","name":"Chicago Bears","city":"Chicago","conference":"NFC","division":"North","primary":"#0B162A","secondary":"#C83803","coach":{"name":"Ben Johnson","grade":7.0},"stadium":"Soldier Field","isOutdoor":True,"playoffExperience":3.0},
  "CIN": {"id":"bengals","name":"Cincinnati Bengals","city":"Cincinnati","conference":"AFC","division":"North","primary":"#FB4F14","secondary":"#000000","coach":{"name":"Zac Taylor","grade":7.5},"stadium":"Paycor Stadium","isOutdoor":True,"playoffExperience":6.5},
  "CLE": {"id":"browns","name":"Cleveland Browns","city":"Cleveland","conference":"AFC","division":"North","primary":"#311D00","secondary":"#FF3C00","coach":{"name":"Kevin Stefanski","grade":6.5},"stadium":"Huntington Bank Field","isOutdoor":True,"playoffExperience":3.5},
  "DAL": {"id":"cowboys","name":"Dallas Cowboys","city":"Dallas","conference":"NFC","division":"East","primary":"#003594","secondary":"#869397","coach":{"name":"Brian Schottenheimer","grade":6.0},"stadium":"AT&T Stadium","isOutdoor":False,"playoffExperience":5.5},
  "DEN": {"id":"broncos","name":"Denver Broncos","city":"Denver","conference":"AFC","division":"West","primary":"#FB4F14","secondary":"#002244","coach":{"name":"Sean Payton","grade":8.0},"stadium":"Empower Field at Mile High","isOutdoor":True,"playoffExperience":4.5},
  "DET": {"id":"lions","name":"Detroit Lions","city":"Detroit","conference":"NFC","division":"North","primary":"#0076B6","secondary":"#B0B7BC","coach":{"name":"Dan Campbell","grade":8.5},"stadium":"Ford Field","isOutdoor":False,"playoffExperience":7.5},
  "GB":  {"id":"packers","name":"Green Bay Packers","city":"Green Bay","conference":"NFC","division":"North","primary":"#203731","secondary":"#FFB612","coach":{"name":"Matt LaFleur","grade":8.2},"stadium":"Lambeau Field","isOutdoor":True,"playoffExperience":7.5},
  "HOU": {"id":"texans","name":"Houston Texans","city":"Houston","conference":"AFC","division":"South","primary":"#03202F","secondary":"#A71930","coach":{"name":"DeMeco Ryans","grade":7.8},"stadium":"NRG Stadium","isOutdoor":False,"playoffExperience":5.0},
  "IND": {"id":"colts","name":"Indianapolis Colts","city":"Indianapolis","conference":"AFC","division":"South","primary":"#002C5F","secondary":"#A2AAAD","coach":{"name":"Shane Steichen","grade":6.5},"stadium":"Lucas Oil Stadium","isOutdoor":False,"playoffExperience":4.0},
  "JAX": {"id":"jaguars","name":"Jacksonville Jaguars","city":"Jacksonville","conference":"AFC","division":"South","primary":"#006778","secondary":"#9F792C","coach":{"name":"Liam Coen","grade":6.0},"stadium":"EverBank Stadium","isOutdoor":True,"playoffExperience":4.0},
  "KC":  {"id":"chiefs","name":"Kansas City Chiefs","city":"Kansas City","conference":"AFC","division":"West","primary":"#E31837","secondary":"#FFB81C","coach":{"name":"Andy Reid","grade":9.8},"stadium":"GEHA Field at Arrowhead Stadium","isOutdoor":True,"playoffExperience":9.8},
  "LAC": {"id":"chargers","name":"Los Angeles Chargers","city":"Los Angeles","conference":"AFC","division":"West","primary":"#0080C6","secondary":"#FFC20E","coach":{"name":"Jim Harbaugh","grade":8.5},"stadium":"SoFi Stadium","isOutdoor":False,"playoffExperience":5.5},
  "LAR": {"id":"rams","name":"Los Angeles Rams","city":"Los Angeles","conference":"NFC","division":"West","primary":"#003594","secondary":"#FFA300","coach":{"name":"Sean McVay","grade":9.0},"stadium":"SoFi Stadium","isOutdoor":False,"playoffExperience":8.0},
  "LV":  {"id":"raiders","name":"Las Vegas Raiders","city":"Las Vegas","conference":"AFC","division":"West","primary":"#000000","secondary":"#A5ACAF","coach":{"name":"Pete Carroll","grade":7.0},"stadium":"Allegiant Stadium","isOutdoor":False,"playoffExperience":3.0},
  "MIA": {"id":"dolphins","name":"Miami Dolphins","city":"Miami","conference":"AFC","division":"East","primary":"#008E97","secondary":"#FC4C02","coach":{"name":"Mike McDaniel","grade":7.2},"stadium":"Hard Rock Stadium","isOutdoor":True,"playoffExperience":5.0},
  "MIN": {"id":"vikings","name":"Minnesota Vikings","city":"Minnesota","conference":"NFC","division":"North","primary":"#4F2683","secondary":"#FFC62F","coach":{"name":"Kevin O'Connell","grade":7.8},"stadium":"U.S. Bank Stadium","isOutdoor":False,"playoffExperience":6.0},
  "NE":  {"id":"patriots","name":"New England Patriots","city":"New England","conference":"AFC","division":"East","primary":"#002244","secondary":"#C60C30","coach":{"name":"Mike Vrabel","grade":8.0},"stadium":"Gillette Stadium","isOutdoor":True,"playoffExperience":5.0},
  "NO":  {"id":"saints","name":"New Orleans Saints","city":"New Orleans","conference":"NFC","division":"South","primary":"#D3BC8D","secondary":"#101820","coach":{"name":"Kellen Moore","grade":5.8},"stadium":"Caesars Superdome","isOutdoor":False,"playoffExperience":4.5},
  "NYG": {"id":"giants","name":"New York Giants","city":"New York","conference":"NFC","division":"East","primary":"#0B2265","secondary":"#A71930","coach":{"name":"Brian Daboll","grade":6.0},"stadium":"MetLife Stadium","isOutdoor":True,"playoffExperience":3.5},
  "NYJ": {"id":"jets","name":"New York Jets","city":"New York","conference":"AFC","division":"East","primary":"#125740","secondary":"#000000","coach":{"name":"Aaron Glenn","grade":6.0},"stadium":"MetLife Stadium","isOutdoor":True,"playoffExperience":3.0},
  "PHI": {"id":"eagles","name":"Philadelphia Eagles","city":"Philadelphia","conference":"NFC","division":"East","primary":"#004C54","secondary":"#A5ACAF","coach":{"name":"Nick Sirianni","grade":8.5},"stadium":"Lincoln Financial Field","isOutdoor":True,"playoffExperience":9.0},
  "PIT": {"id":"steelers","name":"Pittsburgh Steelers","city":"Pittsburgh","conference":"AFC","division":"North","primary":"#FFB612","secondary":"#101820","coach":{"name":"Mike Tomlin","grade":9.0},"stadium":"Acrisure Stadium","isOutdoor":True,"playoffExperience":7.0},
  "SEA": {"id":"seahawks","name":"Seattle Seahawks","city":"Seattle","conference":"NFC","division":"West","primary":"#002244","secondary":"#69BE28","coach":{"name":"Mike Macdonald","grade":7.5},"stadium":"Lumen Field","isOutdoor":True,"playoffExperience":6.0},
  "SF":  {"id":"49ers","name":"San Francisco 49ers","city":"San Francisco","conference":"NFC","division":"West","primary":"#AA0000","secondary":"#B3995D","coach":{"name":"Kyle Shanahan","grade":8.8},"stadium":"Levi's Stadium","isOutdoor":True,"playoffExperience":8.5},
  "TB":  {"id":"buccaneers","name":"Tampa Bay Buccaneers","city":"Tampa Bay","conference":"NFC","division":"South","primary":"#D50A0A","secondary":"#FF7900","coach":{"name":"Todd Bowles","grade":7.0},"stadium":"Raymond James Stadium","isOutdoor":True,"playoffExperience":6.5},
  "TEN": {"id":"titans","name":"Tennessee Titans","city":"Tennessee","conference":"AFC","division":"South","primary":"#0C2340","secondary":"#4B92DB","coach":{"name":"Brian Callahan","grade":5.5},"stadium":"Nissan Stadium","isOutdoor":True,"playoffExperience":3.5},
  "WAS": {"id":"commanders","name":"Washington Commanders","city":"Washington","conference":"NFC","division":"East","primary":"#5A1414","secondary":"#FFB612","coach":{"name":"Dan Quinn","grade":7.8},"stadium":"Northwest Stadium","isOutdoor":True,"playoffExperience":5.5},
}

# nflverse uses "LA" for the Rams; our metadata uses the NFL-standard "LAR".
ABBR_ALIAS = {"LAR": "LA"}
def src_abbr(meta_abbr): return ABBR_ALIAS.get(meta_abbr, meta_abbr)

def f(x, d=0.0):
    try:
        if x == "" or x is None: return d
        return float(x)
    except: return d

def i(x, d=0):
    try:
        if x == "" or x is None: return d
        return int(float(x))
    except: return d

# ── Load team stats ──────────────────────────────────────────────────────
team_raw = {}
with open("stats_team.csv") as fh:
    for r in csv.DictReader(fh):
        if r["season"] == "2025" and r["season_type"] == "REG":
            team_raw[r["team"]] = r

# ── Load games (filter 2025 REG completed) ───────────────────────────────
games = []
with open("games.csv") as fh:
    for r in csv.DictReader(fh):
        if r["season"] == "2025" and r["game_type"] == "REG" and r["home_score"] and r["away_score"]:
            games.append(r)
# Sort chronologically
games.sort(key=lambda g: (i(g.get("week")), g.get("gameday","")))

# ── Compute W/L, PF, PA, home wins, last 5 ────────────────────────────────
record = defaultdict(lambda: {"w":0,"l":0,"t":0,"pf":0,"pa":0,"g":0})
home_rec = defaultdict(lambda: {"w":0,"g":0})
results_by_team = defaultdict(list)  # chronological

for g in games:
    h, a = g["home_team"], g["away_team"]
    hs, as_ = i(g["home_score"]), i(g["away_score"])
    record[h]["g"] += 1; record[a]["g"] += 1
    record[h]["pf"] += hs; record[h]["pa"] += as_
    record[a]["pf"] += as_; record[a]["pa"] += hs
    home_rec[h]["g"] += 1
    if hs > as_:
        record[h]["w"] += 1; record[a]["l"] += 1; home_rec[h]["w"] += 1
        results_by_team[h].append("W"); results_by_team[a].append("L")
    elif hs < as_:
        record[h]["l"] += 1; record[a]["w"] += 1
        results_by_team[h].append("L"); results_by_team[a].append("W")
    else:
        record[h]["t"] += 1; record[a]["t"] += 1
        results_by_team[h].append("T"); results_by_team[a].append("T")

# ── Load player stats ────────────────────────────────────────────────────
players = []
with open("stats_player.csv") as fh:
    for r in csv.DictReader(fh):
        if r["season"] == "2025" and r["season_type"] == "REG":
            players.append(r)

# NFL passer rating formula
def passer_rating(comp, att, yds, tds, ints):
    if att <= 0: return 0.0
    a = max(0, min(2.375, (comp/att - 0.3) * 5))
    b = max(0, min(2.375, (yds/att - 3) * 0.25))
    c = max(0, min(2.375, (tds/att) * 20))
    d = max(0, min(2.375, 2.375 - (ints/att) * 25))
    return round((a+b+c+d)/6 * 100, 1)

# Top QB per team (by attempts)
qbs_by_team = {}
for p in players:
    if p["position"] != "QB": continue
    t = p["recent_team"]
    att = i(p.get("attempts"))
    if att < 20: continue
    if t not in qbs_by_team or att > i(qbs_by_team[t].get("attempts")):
        qbs_by_team[t] = p

# Top WR by receiving_yards
def top_by(pos, sort_col, min_games=0, filter_fn=None):
    best = {}
    for p in players:
        if filter_fn:
            if not filter_fn(p): continue
        elif p["position"] != pos:
            continue
        if i(p.get("games")) < min_games: continue
        t = p["recent_team"]
        val = f(p.get(sort_col))
        if t not in best or val > f(best[t].get(sort_col)):
            best[t] = p
    return best

top_wr = top_by("WR", "receiving_yards", min_games=3)
top_rb = top_by("RB", "rushing_yards", min_games=3)
top_cb = top_by("CB", "def_tackles_solo", min_games=3)
top_pr = top_by(None, "def_sacks", min_games=3,
                filter_fn=lambda p: p["position"] in ("DE","DT","OLB","LB","EDGE"))

# ── Grade helper: rank-based 1-10 ─────────────────────────────────────────
def grade_ranks(values_dict, higher_better=True):
    # values_dict: team -> raw value
    items = sorted(values_dict.items(), key=lambda kv: kv[1], reverse=higher_better)
    grades = {}
    n = len(items)
    for idx, (team, _) in enumerate(items):
        # rank 1 -> 10, rank n -> 1
        g = 10 - (idx / (n-1)) * 9 if n > 1 else 5.5
        grades[team] = round(g, 1)
    return grades

# Build raw aggregates per team
agg = {}
for team, row in team_raw.items():
    games_played = i(row.get("games"), 17)
    if games_played == 0: games_played = 17
    agg[team] = {
        "pass_yds_g":       f(row.get("passing_yards"))    / games_played,
        "rush_yds_g":       f(row.get("rushing_yards"))    / games_played,
        "pass_tds":         f(row.get("passing_tds")),
        "rush_tds":         f(row.get("rushing_tds")),
        "sacks_suffered":   f(row.get("sacks_suffered")),
        "def_sacks":        f(row.get("def_sacks")),
        "def_interceptions": f(row.get("def_interceptions")),
        "passing_ints":     f(row.get("passing_interceptions")),
        "rushing_fumbles_lost":   f(row.get("rushing_fumbles_lost")),
        "sack_fumbles_lost":      f(row.get("sack_fumbles_lost")),
        "fumble_recovery_opp":    f(row.get("fumble_recovery_opp")),
        "passing_epa":      f(row.get("passing_epa")),
        "rushing_epa":      f(row.get("rushing_epa")),
        "fg_pct":           f(row.get("fg_pct"), 0.80) * 100,
        "games":            games_played,
    }
    # Turnover diff (forced - lost)
    forced = agg[team]["def_interceptions"] + agg[team]["fumble_recovery_opp"]
    lost = agg[team]["passing_ints"] + agg[team]["rushing_fumbles_lost"] + agg[team]["sack_fumbles_lost"]
    agg[team]["to_diff"] = int(forced - lost)

# Opponent passing/rushing yards allowed — need to sum from opponents each week
opp_pass_yds = defaultdict(float); opp_rush_yds = defaultdict(float); opp_pts = defaultdict(float); opp_games = defaultdict(int)
# Use games.csv — but stats_team.csv is season totals, so for "yards allowed per game" we need per-game opposing yards which we don't have directly. Use points allowed from record (known), and estimate yards allowed by defensive proxy: rank by (def_sacks + def_interceptions + def_tackles_for_loss) which correlates.
# For display, use pts_allowed/g and (rank-derived) estimated pass/rush yards allowed.

# ── Build grades ─────────────────────────────────────────────────────────
# Offense scoring: PPG from record
ppg = {t: record[t]["pf"] / max(record[t]["g"],1) for t in record}
papg = {t: record[t]["pa"] / max(record[t]["g"],1) for t in record}

offense_grade = grade_ranks(ppg, higher_better=True)
defense_grade = grade_ranks(papg, higher_better=False)
rush_off_grade = grade_ranks({t: agg[t]["rush_yds_g"] for t in agg}, higher_better=True)
pass_off_grade = grade_ranks({t: agg[t]["pass_yds_g"] for t in agg}, higher_better=True)
# Defensive "grade" proxies
# Pass def grade: fewer def pass TDs allowed + more INTs/sacks → but we lack yards allowed. Use def_sacks + def_interceptions + def_pass_defended as proxy.
def_pass_quality = {}
def_rush_quality = {}
with open("stats_team.csv") as fh:
    for r in csv.DictReader(fh):
        if r["season"] != "2025" or r["season_type"] != "REG": continue
        t = r["team"]
        def_pass_quality[t] = f(r.get("def_sacks"))*1.2 + f(r.get("def_interceptions"))*2.5 + f(r.get("def_pass_defended"))*0.4
        def_rush_quality[t] = f(r.get("def_tackles_for_loss"))*1.2 + f(r.get("def_fumbles_forced"))*2.0
pass_def_grade = grade_ranks(def_pass_quality, higher_better=True)
rush_def_grade = grade_ranks(def_rush_quality, higher_better=True)

to_grade      = grade_ranks({t: agg[t]["to_diff"] for t in agg}, higher_better=True)
oline_grade   = grade_ranks({t: agg[t]["sacks_suffered"] for t in agg}, higher_better=False)
dline_grade   = grade_ranks({t: agg[t]["def_sacks"] for t in agg}, higher_better=True)
st_grade      = grade_ranks({t: agg[t]["fg_pct"] for t in agg}, higher_better=True)

# Estimate third-down % and red-zone TD % from offensive EPA rank
off_epa = {t: agg[t]["passing_epa"] + agg[t]["rushing_epa"] for t in agg}
off_epa_grade = grade_ranks(off_epa, higher_better=True)

# QB grades by passing_epa
qb_epa = {t: f(qbs_by_team[t].get("passing_epa")) if t in qbs_by_team else 0 for t in agg}
qb_grade_map = grade_ranks(qb_epa, higher_better=True)

# Key player grades (relative)
wr_yds   = {t: f(top_wr[t].get("receiving_yards"))    if t in top_wr else 0 for t in agg}
rb_yds   = {t: f(top_rb[t].get("rushing_yards"))      if t in top_rb else 0 for t in agg}
cb_plays = {t: f(top_cb[t].get("def_pass_defended"))+f(top_cb[t].get("def_interceptions"))*2 if t in top_cb else 0 for t in agg}
pr_sacks = {t: f(top_pr[t].get("def_sacks"))          if t in top_pr else 0 for t in agg}
wr_grade = grade_ranks(wr_yds, higher_better=True)
rb_grade = grade_ranks(rb_yds, higher_better=True)
cb_grade = grade_ranks(cb_plays, higher_better=True)
pr_grade = grade_ranks(pr_sacks, higher_better=True)

# Home-field advantage grade from home_win_pct
home_pct = {t: (home_rec[t]["w"]/home_rec[t]["g"]*100 if home_rec[t]["g"] else 50.0) for t in agg}
hf_grade = grade_ranks(home_pct, higher_better=True)

# ── Assemble final teams ────────────────────────────────────────────────
final_teams = []
for meta_abbr, meta in TEAM_META.items():
    abbr = src_abbr(meta_abbr)
    if abbr not in agg:
        print(f"WARN missing 2025 stats for {meta_abbr}", file=sys.stderr)
        continue
    row = team_raw[abbr]
    qb = qbs_by_team.get(abbr)
    wr = top_wr.get(abbr); rb = top_rb.get(abbr); cb = top_cb.get(abbr); pr = top_pr.get(abbr)
    off_rank_pct = (off_epa_grade[abbr] - 1) / 9  # 0..1 (worst..best)
    third_down = round(28 + off_rank_pct * 20, 1)   # 28%..48%
    red_zone   = round(45 + off_rank_pct * 25, 1)   # 45%..70%

    pr_rating = passer_rating(i(qb.get("completions")) if qb else 0,
                              i(qb.get("attempts")) if qb else 0,
                              i(qb.get("passing_yards")) if qb else 0,
                              i(qb.get("passing_tds")) if qb else 0,
                              i(qb.get("passing_interceptions")) if qb else 0)

    # Estimated yards allowed per game by rank (league avg ~ pass 225, rush 115; spread ±50 / ±35)
    pass_grade_v = pass_def_grade[abbr]
    rush_grade_v = rush_def_grade[abbr]
    pass_yds_allowed = round(255 - ((pass_grade_v - 1) / 9) * 70, 1)
    rush_yds_allowed = round(145 - ((rush_grade_v - 1) / 9) * 60, 1)

    team_obj = {
        "id": meta["id"],
        "name": meta["name"],
        "city": meta["city"],
        "abbr": meta_abbr,
        "conference": meta["conference"],
        "division": meta["division"],
        "primary": meta["primary"],
        "secondary": meta["secondary"],
        "record": {"w": record[abbr]["w"], "l": record[abbr]["l"], "t": record[abbr]["t"]},
        "pointsPerGame": round(ppg[abbr], 1),
        "pointsAllowed": round(papg[abbr], 1),
        "qb": {
            "name": qb.get("player_display_name") if qb else "—",
            "passerRating": pr_rating,
            "touchdowns": i(qb.get("passing_tds")) if qb else 0,
            "interceptions": i(qb.get("passing_interceptions")) if qb else 0,
            "completionPct": round(i(qb.get("completions"))/max(i(qb.get("attempts")),1)*100,1) if qb else 0.0,
            "grade": qb_grade_map[abbr],
        },
        "offenseLine": {"grade": oline_grade[abbr]},
        "defenseLine": {"grade": dline_grade[abbr]},
        "rushOffense": {"yardsPerGame": round(agg[abbr]["rush_yds_g"],1), "grade": rush_off_grade[abbr]},
        "passOffense": {"yardsPerGame": round(agg[abbr]["pass_yds_g"],1), "grade": pass_off_grade[abbr]},
        "rushDefense": {"yardsAllowed": rush_yds_allowed, "grade": rush_def_grade[abbr]},
        "passDefense": {"yardsAllowed": pass_yds_allowed, "grade": pass_def_grade[abbr]},
        "thirdDownPct": third_down,
        "redZonePct": red_zone,
        "turnoverDiff": agg[abbr]["to_diff"],
        "specialTeams": {"fgPct": round(agg[abbr]["fg_pct"],1), "grade": st_grade[abbr]},
        "coach": meta["coach"],
        "homeField": {
            "stadium": meta["stadium"],
            "isOutdoor": meta["isOutdoor"],
            "homeWinPct": round(home_pct[abbr],1),
            "advantageGrade": hf_grade[abbr],
        },
        "recentForm": results_by_team[abbr][-5:][::-1] if results_by_team[abbr] else [],
        "keyPlayers": {
            "wr1": {"name": wr.get("player_display_name") if wr else "—", "grade": wr_grade[abbr]},
            "rb1": {"name": rb.get("player_display_name") if rb else "—", "grade": rb_grade[abbr]},
            "cb1": {"name": cb.get("player_display_name") if cb else "—", "grade": cb_grade[abbr]},
            "pass_rusher": {"name": pr.get("player_display_name") if pr else "—", "grade": pr_grade[abbr]},
        },
        "injuryImpact": 0.0,
        "playoffExperience": meta["playoffExperience"],
    }
    final_teams.append(team_obj)

# Sort by city for determinism
final_teams.sort(key=lambda t: t["abbr"])

with open("/tmp/nfl/nfl_teams_generated.js", "w") as fh:
    fh.write("const NFL_TEAMS = ")
    json.dump(final_teams, fh, indent=2)
    fh.write(";\n")
print(f"Generated {len(final_teams)} teams.")

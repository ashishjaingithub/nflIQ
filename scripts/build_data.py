#!/usr/bin/env python3
"""Build NFL_TEAMS for the app:
- Player identity from the 2026 post-draft / post-free-agency roster
- Veteran performance from real 2025 stats (carried to the new team by player id)
- Rookie QBs (no NFL stats) get a projection scaled by 2026 draft slot
- Team records & team-level grades stay 2025 (no 2026 games exist yet)
"""
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

# nflverse stats/roster use "LA" for the Rams; metadata uses "LAR".
ABBR_ALIAS = {"LAR": "LA"}
def src_abbr(meta_abbr): return ABBR_ALIAS.get(meta_abbr, meta_abbr)

# draft_picks.csv uses some 3-letter codes; normalize to roster/stats codes.
DRAFT_CODE = {
  "GNB":"GB","KAN":"KC","LVR":"LV","NOR":"NO","NWE":"NE","SFO":"SF",
  "TAM":"TB","LAR":"LA",
}
def norm_draft_team(c): return DRAFT_CODE.get(c, c)

def f(x, d=0.0):
    try:
        if x in ("", None): return d
        return float(x)
    except: return d
def i(x, d=0):
    try:
        if x in ("", None): return d
        return int(float(x))
    except: return d
def norm_name(s):
    return " ".join((s or "").lower().replace(".", "").replace("'", "").split())

# ── 2025 team stats / games (records, team-level grades) ────────────────────
team_raw = {}
with open("stats_team.csv") as fh:
    for r in csv.DictReader(fh):
        if r["season"] == "2025" and r["season_type"] == "REG":
            team_raw[r["team"]] = r

games = []
with open("games.csv") as fh:
    for r in csv.DictReader(fh):
        if r["season"] == "2025" and r["game_type"] == "REG" and r["home_score"] and r["away_score"]:
            games.append(r)
games.sort(key=lambda g: (i(g.get("week")), g.get("gameday","")))

record = defaultdict(lambda: {"w":0,"l":0,"t":0,"pf":0,"pa":0,"g":0})
home_rec = defaultdict(lambda: {"w":0,"g":0})
results_by_team = defaultdict(list)
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

# ── 2025 player stats indexed by player id (carry to 2026 team) ─────────────
players_2025 = {}   # player_id -> row
players_2025_byname = {}
with open("stats_player.csv") as fh:
    for r in csv.DictReader(fh):
        if r["season"] == "2025" and r["season_type"] == "REG":
            pid = r.get("player_id")
            if pid: players_2025[pid] = r
            players_2025_byname[norm_name(r.get("player_display_name"))] = r

# ── 2026 draft (round/pick by player) ──────────────────────────────────────
draft_2026 = {}      # gsis_id -> (round, pick, team)
draft_2026_byname = {}
with open("draft_picks.csv") as fh:
    for r in csv.DictReader(fh):
        if r.get("season") != "2026": continue
        rec = (i(r.get("round")), i(r.get("pick")), norm_draft_team(r.get("team")), r.get("position"))
        gid = r.get("gsis_id")
        if gid: draft_2026[gid] = rec
        draft_2026_byname[norm_name(r.get("pfr_player_name"))] = rec

# ── 2026 roster (who is on each team now) ───────────────────────────────────
ON_TEAM = {"ACT", "RFA", "RSN", "UDF", "PUP", "RES"}  # exclude UFA (unsigned)
roster = defaultdict(list)
with open("roster_2026.csv") as fh:
    for r in csv.DictReader(fh):
        if r.get("status") not in ON_TEAM: continue
        roster[r["team"]].append(r)

def passer_rating(comp, att, yds, tds, ints):
    if att <= 0: return 0.0
    a = max(0, min(2.375, (comp/att - 0.3) * 5))
    b = max(0, min(2.375, (yds/att - 3) * 0.25))
    c = max(0, min(2.375, (tds/att) * 20))
    d = max(0, min(2.375, 2.375 - (ints/att) * 25))
    return round((a+b+c+d)/6 * 100, 1)

def stats_for(roster_row):
    """Return the player's 2025 stat row if they played in 2025, else None."""
    gid = roster_row.get("gsis_id")
    if gid and gid in players_2025:
        return players_2025[gid]
    nm = norm_name(roster_row.get("full_name"))
    return players_2025_byname.get(nm)

def draft_for(roster_row):
    gid = roster_row.get("gsis_id")
    if gid and gid in draft_2026:
        return draft_2026[gid]
    return draft_2026_byname.get(norm_name(roster_row.get("full_name")))

def rookie_qb_projection(pick):
    """Project a rookie QB from draft slot (no NFL stats exist)."""
    pick = pick or 200
    grade = max(3.0, min(7.0, 7.0 - (pick - 1) / 28.0))
    rtg = round(70 + grade * 3.2, 1)
    return {
        "rtg": rtg, "grade": round(grade, 1),
        "tds": max(8, int(round(26 - pick / 12))),
        "ints": min(16, 9 + pick // 60),
        "cmp": round(max(58.0, 66.0 - pick / 40.0), 1),
        "rookie": True,
    }

# ── Per-team grade helpers (rank-based 1-10, computed on 2025) ──────────────
def grade_ranks(values_dict, higher_better=True):
    items = sorted(values_dict.items(), key=lambda kv: kv[1], reverse=higher_better)
    n = len(items); out = {}
    for idx, (k, _) in enumerate(items):
        out[k] = round(10 - (idx / (n-1)) * 9, 1) if n > 1 else 5.5
    return out

agg = {}
for team, row in team_raw.items():
    gp = i(row.get("games"), 17) or 17
    forced = f(row.get("def_interceptions")) + f(row.get("fumble_recovery_opp"))
    lost = f(row.get("passing_interceptions")) + f(row.get("rushing_fumbles_lost")) + f(row.get("sack_fumbles_lost"))
    agg[team] = {
        "pass_yds_g": f(row.get("passing_yards"))/gp,
        "rush_yds_g": f(row.get("rushing_yards"))/gp,
        "sacks_suffered": f(row.get("sacks_suffered")),
        "def_sacks": f(row.get("def_sacks")),
        "fg_pct": f(row.get("fg_pct"), 0.80)*100,
        "passing_epa": f(row.get("passing_epa")),
        "rushing_epa": f(row.get("rushing_epa")),
        "to_diff": int(forced - lost),
    }
ppg  = {t: record[t]["pf"]/max(record[t]["g"],1) for t in record}
papg = {t: record[t]["pa"]/max(record[t]["g"],1) for t in record}
offense_grade  = grade_ranks(ppg, True)
defense_grade  = grade_ranks(papg, False)
rush_off_grade = grade_ranks({t: agg[t]["rush_yds_g"] for t in agg}, True)
pass_off_grade = grade_ranks({t: agg[t]["pass_yds_g"] for t in agg}, True)
to_grade       = grade_ranks({t: agg[t]["to_diff"] for t in agg}, True)
oline_grade    = grade_ranks({t: agg[t]["sacks_suffered"] for t in agg}, False)
dline_grade    = grade_ranks({t: agg[t]["def_sacks"] for t in agg}, True)
st_grade       = grade_ranks({t: agg[t]["fg_pct"] for t in agg}, True)
off_epa_grade  = grade_ranks({t: agg[t]["passing_epa"]+agg[t]["rushing_epa"] for t in agg}, True)
home_pct       = {t: (home_rec[t]["w"]/home_rec[t]["g"]*100 if home_rec[t]["g"] else 50.0) for t in agg}
hf_grade       = grade_ranks(home_pct, True)
defq_pass = {}; defq_rush = {}
with open("stats_team.csv") as fh:
    for r in csv.DictReader(fh):
        if r["season"]!="2025" or r["season_type"]!="REG": continue
        t=r["team"]
        defq_pass[t]=f(r.get("def_sacks"))*1.2+f(r.get("def_interceptions"))*2.5+f(r.get("def_pass_defended"))*0.4
        defq_rush[t]=f(r.get("def_tackles_for_loss"))*1.2+f(r.get("def_fumbles_forced"))*2.0
pass_def_grade = grade_ranks(defq_pass, True)
rush_def_grade = grade_ranks(defq_rush, True)

# ── Pick 2026 starters & key players, build team objects ───────────────────
# First pass: collect each team's chosen QB/WR/RB/CB/PR rows for league ranking
def pick_qb(src):
    qbs = [r for r in roster.get(src, []) if r.get("position") == "QB"]
    # 1) a QB this team drafted in 2026 round 1 → projected starter
    r1 = [r for r in qbs if (draft_for(r) and draft_for(r)[0] == 1)]
    if r1:
        r1.sort(key=lambda r: draft_for(r)[1])  # earliest pick
        return r1[0]
    # 2) most 2025 pass attempts among signed QBs (vet starter / FA mover)
    with_stats = []
    for r in qbs:
        s = stats_for(r)
        if s and i(s.get("attempts")) >= 30:
            with_stats.append((i(s.get("attempts")), r))
    if with_stats:
        with_stats.sort(reverse=True, key=lambda x: x[0])
        return with_stats[0][1]
    # 3) highest 2026 draft pick QB on the roster
    drafted = [(draft_for(r)[1], r) for r in qbs if draft_for(r)]
    if drafted:
        drafted.sort(key=lambda x: x[0])
        return drafted[0][1]
    return qbs[0] if qbs else None

def pick_skill(src, positions, stat_col):
    best, best_v = None, -1
    for r in roster.get(src, []):
        if r.get("position") not in positions: continue
        s = stats_for(r)
        if not s: continue
        v = f(s.get(stat_col))
        if v > best_v: best_v, best = v, (r, s)
    return best

chosen = {}
for meta_abbr, meta in TEAM_META.items():
    src = src_abbr(meta_abbr)
    qb_row = pick_qb(src)
    chosen[meta_abbr] = {
        "src": src,
        "qb": qb_row,
        "wr": pick_skill(src, {"WR"}, "receiving_yards"),
        "rb": pick_skill(src, {"RB"}, "rushing_yards"),
        "cb": pick_skill(src, {"CB"}, "def_tackles_solo"),
        "pr": pick_skill(src, {"DE","DT","OLB","LB","EDGE"}, "def_sacks"),
    }

# League-wide grades for the chosen players (veterans on 2025 numbers)
def chosen_qb_epa(c):
    if not c["qb"]: return -50.0
    s = stats_for(c["qb"])
    if s: return f(s.get("passing_epa"))
    d = draft_for(c["qb"])
    pick = d[1] if d else 200
    return -10 + (200 - min(pick,200)) / 20.0  # rookies ranked by draft slot
qb_epa = {ab: chosen_qb_epa(c) for ab, c in chosen.items()}
qb_grade_rank = grade_ranks(qb_epa, True)

def chosen_stat(c, key, col):
    pr = c[key]
    return f(pr[1].get(col)) if pr else 0.0
wr_grade = grade_ranks({ab: chosen_stat(c,"wr","receiving_yards") for ab,c in chosen.items()}, True)
rb_grade = grade_ranks({ab: chosen_stat(c,"rb","rushing_yards") for ab,c in chosen.items()}, True)
cb_grade = grade_ranks({ab: (chosen_stat(c,"cb","def_pass_defended")+chosen_stat(c,"cb","def_interceptions")*2) for ab,c in chosen.items()}, True)
pr_grade = grade_ranks({ab: chosen_stat(c,"pr","def_sacks") for ab,c in chosen.items()}, True)

final_teams = []
rookie_qbs = []
for meta_abbr, meta in TEAM_META.items():
    src = src_abbr(meta_abbr)
    if src not in agg:
        print(f"WARN no 2025 team stats for {meta_abbr}", file=sys.stderr); continue
    c = chosen[meta_abbr]
    qb_row = c["qb"]
    qb_name = qb_row.get("full_name") if qb_row else "—"
    qs = stats_for(qb_row) if qb_row else None
    if qs and i(qs.get("attempts")) >= 1:
        pr_rt = passer_rating(i(qs.get("completions")), i(qs.get("attempts")),
                              i(qs.get("passing_yards")), i(qs.get("passing_tds")),
                              i(qs.get("passing_interceptions")))
        qb_obj = {
            "name": qb_name, "passerRating": pr_rt,
            "touchdowns": i(qs.get("passing_tds")),
            "interceptions": i(qs.get("passing_interceptions")),
            "completionPct": round(i(qs.get("completions"))/max(i(qs.get("attempts")),1)*100,1),
            "grade": qb_grade_rank[meta_abbr], "rookie": False,
        }
    else:
        d = draft_for(qb_row) if qb_row else None
        proj = rookie_qb_projection(d[1] if d else 200)
        qb_obj = {
            "name": qb_name, "passerRating": proj["rtg"],
            "touchdowns": proj["tds"], "interceptions": proj["ints"],
            "completionPct": proj["cmp"], "grade": qb_grade_rank[meta_abbr],
            "rookie": True,
        }
        rookie_qbs.append(f"{meta_abbr}:{qb_name}"
                          + (f" (R{d[0]} #{d[1]})" if d else ""))

    def kp_name(key):
        return c[key][0].get("full_name") if c[key] else "—"

    final_teams.append({
        "id": meta["id"], "name": meta["name"], "city": meta["city"],
        "abbr": meta_abbr, "conference": meta["conference"], "division": meta["division"],
        "primary": meta["primary"], "secondary": meta["secondary"],
        "record": {"w": record[src]["w"], "l": record[src]["l"], "t": record[src]["t"]},
        "pointsPerGame": round(ppg[src],1), "pointsAllowed": round(papg[src],1),
        "qb": qb_obj,
        "offenseLine": {"grade": oline_grade[src]},
        "defenseLine": {"grade": dline_grade[src]},
        "rushOffense": {"yardsPerGame": round(agg[src]["rush_yds_g"],1), "grade": rush_off_grade[src]},
        "passOffense": {"yardsPerGame": round(agg[src]["pass_yds_g"],1), "grade": pass_off_grade[src]},
        "rushDefense": {"yardsAllowed": round(145-((rush_def_grade[src]-1)/9)*60,1), "grade": rush_def_grade[src]},
        "passDefense": {"yardsAllowed": round(255-((pass_def_grade[src]-1)/9)*70,1), "grade": pass_def_grade[src]},
        "thirdDownPct": round(28+((off_epa_grade[src]-1)/9)*20,1),
        "redZonePct": round(45+((off_epa_grade[src]-1)/9)*25,1),
        "turnoverDiff": agg[src]["to_diff"],
        "specialTeams": {"fgPct": round(agg[src]["fg_pct"],1), "grade": st_grade[src]},
        "coach": meta["coach"],
        "homeField": {"stadium": meta["stadium"], "isOutdoor": meta["isOutdoor"],
                      "homeWinPct": round(home_pct[src],1), "advantageGrade": hf_grade[src]},
        "recentForm": results_by_team[src][-5:][::-1] if results_by_team[src] else [],
        "keyPlayers": {
            "wr1": {"name": kp_name("wr"), "grade": wr_grade[meta_abbr]},
            "rb1": {"name": kp_name("rb"), "grade": rb_grade[meta_abbr]},
            "cb1": {"name": kp_name("cb"), "grade": cb_grade[meta_abbr]},
            "pass_rusher": {"name": kp_name("pr"), "grade": pr_grade[meta_abbr]},
        },
        "injuryImpact": 0.0,
        "playoffExperience": meta["playoffExperience"],
    })

final_teams.sort(key=lambda t: t["abbr"])
with open("/tmp/nfl/nfl_teams_generated.js", "w") as fh:
    fh.write("const NFL_TEAMS = ")
    json.dump(final_teams, fh, indent=2)
    fh.write(";\n")
print(f"Generated {len(final_teams)} teams.")
print(f"Rookie/projected QBs ({len(rookie_qbs)}): " + ", ".join(sorted(rookie_qbs)))

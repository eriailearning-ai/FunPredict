-- FIFAFun SQLite schema — generated from prisma/schema.prisma
-- Run: sqlite3 staging.db < prisma/init-schema.sql

CREATE TABLE IF NOT EXISTS "User" (
    "id"           TEXT     NOT NULL PRIMARY KEY,
    "name"         TEXT     NOT NULL,
    "email"        TEXT     NOT NULL,
    "username"     TEXT,
    "nickname"     TEXT     NOT NULL DEFAULT '',
    "league"       TEXT     NOT NULL DEFAULT '',
    "leagueId"     INTEGER,
    "cheeringFrom" TEXT     NOT NULL DEFAULT '',
    "password"     TEXT     NOT NULL,
    "role"         TEXT     NOT NULL DEFAULT 'player',
    "status"       TEXT     NOT NULL DEFAULT 'pending',
    "verifyToken"  TEXT,
    "verifyExpiry" DATETIME,
    "createdAt"    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key"    ON "User"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username");

CREATE TABLE IF NOT EXISTS "Session" (
    "id"        TEXT     NOT NULL PRIMARY KEY,
    "userId"    TEXT     NOT NULL,
    "token"     TEXT     NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "Session_token_key" ON "Session"("token");

CREATE TABLE IF NOT EXISTS "League" (
    "id"        INTEGER  NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name"      TEXT     NOT NULL,
    "slug"      TEXT     NOT NULL,
    "color"     TEXT     NOT NULL DEFAULT '#1e3a5f',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "League_name_key" ON "League"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "League_slug_key" ON "League"("slug");

CREATE TABLE IF NOT EXISTS "Team" (
    "id"       INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name"     TEXT    NOT NULL,
    "code"     TEXT    NOT NULL,
    "flagCode" TEXT    NOT NULL DEFAULT '',
    "group"    TEXT    NOT NULL,
    "flag"     TEXT    NOT NULL DEFAULT ''
);
CREATE UNIQUE INDEX IF NOT EXISTS "Team_code_key" ON "Team"("code");

CREATE TABLE IF NOT EXISTS "Match" (
    "id"         INTEGER  NOT NULL PRIMARY KEY AUTOINCREMENT,
    "homeTeamId" INTEGER  NOT NULL,
    "awayTeamId" INTEGER  NOT NULL,
    "group"      TEXT     NOT NULL,
    "stage"      TEXT     NOT NULL DEFAULT 'group',
    "matchDate"  DATETIME NOT NULL,
    "venue"      TEXT     NOT NULL DEFAULT '',
    "homeScore"  INTEGER,
    "awayScore"  INTEGER,
    "status"     TEXT     NOT NULL DEFAULT 'upcoming',
    "locked"     BOOLEAN  NOT NULL DEFAULT 0,
    "externalId" TEXT,
    FOREIGN KEY ("homeTeamId") REFERENCES "Team"("id"),
    FOREIGN KEY ("awayTeamId") REFERENCES "Team"("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Match_externalId_key" ON "Match"("externalId");

CREATE TABLE IF NOT EXISTS "Prediction" (
    "id"        INTEGER  NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId"    TEXT     NOT NULL,
    "matchId"   INTEGER  NOT NULL,
    "homeScore" INTEGER  NOT NULL,
    "awayScore" INTEGER  NOT NULL,
    "joker"     BOOLEAN  NOT NULL DEFAULT 0,
    "points"    INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId")  REFERENCES "User"("id")  ON DELETE CASCADE,
    FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "Prediction_userId_matchId_key" ON "Prediction"("userId","matchId");

CREATE TABLE IF NOT EXISTS "BonusQuestion" (
    "id"            INTEGER  NOT NULL PRIMARY KEY AUTOINCREMENT,
    "question"      TEXT     NOT NULL,
    "type"          TEXT     NOT NULL DEFAULT 'single',
    "stage"         TEXT     NOT NULL DEFAULT 'group',
    "options"       TEXT     NOT NULL DEFAULT '[]',
    "correctAnswer" TEXT              DEFAULT '',
    "points"        INTEGER  NOT NULL DEFAULT 5,
    "status"        TEXT     NOT NULL DEFAULT 'open',
    "createdAt"     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "BonusAnswer" (
    "id"         INTEGER  NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId"     TEXT     NOT NULL,
    "questionId" INTEGER  NOT NULL,
    "answer"     TEXT     NOT NULL,
    "points"     INTEGER,
    "createdAt"  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId")     REFERENCES "User"("id")          ON DELETE CASCADE,
    FOREIGN KEY ("questionId") REFERENCES "BonusQuestion"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "BonusAnswer_userId_questionId_key" ON "BonusAnswer"("userId","questionId");

CREATE TABLE IF NOT EXISTS "Poll" (
    "id"        INTEGER  NOT NULL PRIMARY KEY AUTOINCREMENT,
    "matchId"   INTEGER,
    "question"  TEXT     NOT NULL,
    "options"   TEXT     NOT NULL DEFAULT '[]',
    "status"    TEXT     NOT NULL DEFAULT 'open',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS "PollVote" (
    "id"        INTEGER  NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pollId"    INTEGER  NOT NULL,
    "userId"    TEXT     NOT NULL,
    "option"    TEXT     NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("pollId") REFERENCES "Poll"("id") ON DELETE CASCADE,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "PollVote_pollId_userId_key" ON "PollVote"("pollId","userId");

CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id"        INTEGER  NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId"    TEXT     NOT NULL,
    "action"    TEXT     NOT NULL,
    "details"   TEXT     NOT NULL DEFAULT '',
    "ip"        TEXT     NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "Setting" (
    "key"   TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL
);

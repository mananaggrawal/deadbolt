-- Our own tables. Better Auth keeps its own: "user", "session", "account", "verification".

-- one row per browser (a random id kept in localStorage), linked to an account once that browser signs in
create table players (
  anon_id     uuid primary key,
  user_id     text,
  first_seen  timestamptz not null default now(),
  last_seen   timestamptz not null default now(),
  device      text,
  country     text
);
create index players_user on players (user_id);

-- what we keep about an account beyond Better Auth's user row
create table profiles (
  user_id           text primary key,
  age_confirmed_at  timestamptz,
  consented_at      timestamptz,
  handle            text,
  show_handle       boolean not null default false,
  created_at        timestamptz not null default now()
);

-- one row per attempt at a room
create table plays (
  id            uuid primary key,
  room          text not null,
  anon_id       uuid,
  user_id       text,
  started_at    timestamptz not null default now(),
  last_seen     timestamptz not null default now(),
  ended_at      timestamptz,
  outcome       text not null default 'in_progress',   -- in_progress | escaped
  resumed       boolean not null default false,
  steps_total   int,
  steps_done    int not null default 0,
  hints         int not null default 0,
  wrong         int not null default 0,
  seconds       int,
  marks         text,                                   -- one digit per square: 0 alone, 1 hints, 2 answer
  first_escape  boolean,
  from_share    text,
  device        text,
  country       text,
  app_version   text
);
create index plays_room_started on plays (room, started_at);
create index plays_user on plays (user_id);
create index plays_anon on plays (anon_id);

-- every tracked event
create table events (
  id          bigserial primary key,
  ts          timestamptz not null default now(),
  play_id     uuid,
  anon_id     uuid,
  user_id     text,
  room        text,
  name        text not null,
  step        int,
  data        jsonb,
  device      text,
  country     text,
  app_version text
);
create index events_room_name_ts on events (room, name, ts);
create index events_ts on events (ts);
create index events_play on events (play_id);

-- daily totals that outlive raw events (raw events are kept 13 months)
create table event_daily (
  day    date not null,
  room   text not null default '',
  name   text not null,
  step   int not null default -1,
  n      int not null,
  primary key (day, room, name, step)
);

-- each signed-in player's first escape from each room: what follows them across devices
create table results (
  user_id     text not null,
  room        text not null,
  day         date not null,
  seconds     int not null,
  hints       int not null default 0,
  wrong       int not null default 0,
  tiers       jsonb not null default '{}',
  marks       jsonb not null default '[]',
  created_at  timestamptz not null default now(),
  primary key (user_id, room)
);

-- share links: /r/<code>
create table shares (
  code           text primary key,
  play_id        uuid,
  user_id        text,
  anon_id        uuid,
  room           text not null,
  seconds        int not null,
  hints          int not null default 0,
  wrong          int not null default 0,
  marks          text not null default '',
  created_at     timestamptz not null default now(),
  clicks         int not null default 0,
  landings       int not null default 0,
  plays_started  int not null default 0
);
create index shares_user_room on shares (user_id, room);
create index shares_anon_room on shares (anon_id, room);

create table feedback (
  id          bigserial primary key,
  created_at  timestamptz not null default now(),
  play_id     uuid,
  anon_id     uuid,
  user_id     text,
  room        text,
  kind        text not null,          -- rating | bug | stuck | idea
  rating      int,
  difficulty  text,
  text        text,
  context     jsonb,
  device      text
);
create index feedback_room on feedback (room, created_at);

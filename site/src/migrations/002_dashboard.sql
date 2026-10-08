-- The dashboard reads events by name and time, by player, and plays by how recently they were seen.
create index if not exists events_name_ts on events (name, ts);
create index if not exists events_user_ts on events (user_id, ts);
create index if not exists events_anon_ts on events (anon_id, ts);
create index if not exists plays_last_seen on plays (last_seen);
create index if not exists players_last_seen on players (last_seen);

-- Sign-in sessions no longer keep an IP address (auth.js); clear the ones already stored.
update "session" set "ipAddress" = '' where coalesce("ipAddress", '') <> '';

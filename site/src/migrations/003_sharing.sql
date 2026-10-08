-- Sharing: links for the whole site and for single rooms (not only results), and where visitors came from.

-- a share link is now one of: a result (/r/<code>), a room or the site (/i/<code>)
alter table shares alter column room drop not null;
alter table shares alter column seconds drop not null;
alter table shares add column kind text not null default 'result';   -- result | room | site
alter table shares add column surface text;                          -- where the first Share tap was: end, door, nav, title, pause, cta, footer
create index shares_kind_user on shares (kind, user_id, room);
create index shares_kind_anon on shares (kind, anon_id, room);

-- the share link a browser first arrived through (first touch), and through which app
alter table players add column from_share text;
alter table players add column from_via text;
alter table players add column from_at timestamptz;
create index players_from_share on players (from_share) where from_share is not null;

alter table plays add column from_via text;
create index plays_from_share on plays (from_share) where from_share is not null;

create index if not exists events_name_ts on events (name, ts);

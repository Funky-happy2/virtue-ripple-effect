-- Virtue Ripple — decision telemetry.
-- Every choice a visitor makes is recorded so the app can answer its own question
-- with real data: does virtue rate rise or fall as simulated power increases?

create table if not exists runs (
  id          uuid primary key default gen_random_uuid(),
  started_at  timestamptz not null default now(),
  user_agent  text
);

create table if not exists decisions (
  id                bigserial primary key,
  run_id            uuid not null references runs (id) on delete cascade,
  scenario_id       text not null,
  choice_id         text not null,
  kind              text not null check (kind in ('virtue', 'vice')),
  tier_index        smallint not null check (tier_index between 0 and 15),
  power_level       bigint not null,
  influence_before  integer not null,
  stability_before  real not null,
  stability_delta   real not null,
  lives_affected    bigint not null,
  created_at        timestamptz not null default now()
);

-- The consensus panel filters by scenario; the power-curve chart groups by tier.
create index if not exists decisions_scenario_idx on decisions (scenario_id);
create index if not exists decisions_tier_idx on decisions (tier_index);
create index if not exists decisions_run_idx on decisions (run_id);

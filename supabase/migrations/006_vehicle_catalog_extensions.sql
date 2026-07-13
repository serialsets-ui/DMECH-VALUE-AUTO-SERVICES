-- User action needed: run this in the Supabase SQL editor, same as 004/005.

-- ── Publish gate, separate from lifecycle_stage ────────────────────────────
-- lifecycle_stage answers "where is this vehicle operationally" (available,
-- reserved, sold, ...); is_published answers "should a customer see this
-- listing at all". Those are different questions — staff may want to stage
-- a listing (photos, description) before it's ready to show, or pull one
-- down temporarily without touching its operational stage. Defaults true so
-- every existing vehicle stays visible with no backfill needed.
alter table vehicles add column is_published boolean not null default true;
create index vehicles_is_published_idx on vehicles(is_published);

-- ── Import-sourcing identification ──────────────────────────────────────────
alter table vehicles add column lot_number text; -- auction lot reference
alter table shipments add column container_number text;
alter table shipments add column bill_of_lading text;

-- ── SEO fields ───────────────────────────────────────────────────────────
-- Reserved for an eventual per-vehicle public page. There is no
-- /vehicles/[id] route today (vehicle detail is a modal on /vehicles), so
-- these are inert until that page exists — the Ops edit form says so
-- explicitly rather than implying they already do something.
alter table vehicles add column seo_title text;
alter table vehicles add column seo_description text;

-- ── Photos: text[] → jsonb, so each photo carries real metadata ───────────
-- Was a flat array of URLs with no way to mark a damage photo internal-only,
-- tag which angle a shot is, or persist a staff-chosen display order. Each
-- element becomes {id, url, tag, is_internal, sort_order}; existing URLs are
-- migrated in their current array order with tag=null, is_internal=false.
alter table vehicles add column photos_jsonb jsonb not null default '[]'::jsonb;
update vehicles
set photos_jsonb = (
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', gen_random_uuid(),
        'url', url,
        'tag', null,
        'is_internal', false,
        'sort_order', ord - 1
      ) order by ord
    ),
    '[]'::jsonb
  )
  from unnest(photos) with ordinality as t(url, ord)
)
where photos is not null and array_length(photos, 1) > 0;
alter table vehicles drop column photos;
alter table vehicles rename column photos_jsonb to photos;

-- ── RLS: public visibility now also requires is_published ─────────────────
drop policy if exists "public read pipeline vehicles" on vehicles;
create policy "public read pipeline vehicles" on vehicles
  for select to anon, authenticated
  using (
    lifecycle_stage in ('shipped', 'in_transit', 'at_port', 'customs', 'cleared', 'available', 'reserved')
    and is_published = true
    and deleted_at is null
  );

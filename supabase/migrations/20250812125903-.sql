do $$
declare
  ext_schema text;
begin
  select n.nspname into ext_schema
  from pg_extension e
  join pg_namespace n on n.oid = e.extnamespace
  where e.extname = 'pgcrypto';

  if ext_schema = 'public' then
    execute 'alter extension pgcrypto set schema extensions';
  end if;
end $$;
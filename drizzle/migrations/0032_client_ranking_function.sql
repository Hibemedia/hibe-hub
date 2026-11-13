create or replace function public.client_ranking(_from date, _to date, _prev_from date, _prev_to date)
returns table (client_id uuid, views bigint, prev_views bigint, posts bigint, followers bigint)
language sql
stable
security invoker
set search_path = public
as $$
  with cur as (
    select client_id,
           coalesce(sum(views), 0)::bigint as views,
           coalesce(sum(posts), 0)::bigint as posts
    from daily_stats
    where date <= _to and (_from is null or date >= _from)
    group by client_id
  ),
  prev as (
    select client_id, coalesce(sum(views), 0)::bigint as views
    from daily_stats
    where _prev_from is not null and date >= _prev_from and date <= _prev_to
    group by client_id
  ),
  last_followers as (
    select client_id, network, followers
    from (
      select client_id, network, followers,
             row_number() over (partition by client_id, network order by date desc) rn
      from daily_stats
      where followers is not null and date <= _to and (_from is null or date >= _from)
    ) t
    where rn = 1
  ),
  fol as (
    select client_id, sum(followers)::bigint as followers from last_followers group by client_id
  )
  select c.client_id, c.views, p.views, c.posts, f.followers
  from cur c
  left join prev p on p.client_id = c.client_id
  left join fol f on f.client_id = c.client_id
$$;

grant execute on function public.client_ranking(date, date, date, date) to authenticated;
grant execute on function public.client_ranking(date, date, date, date) to service_role;
-- FEAT-023: RPC to look up agent upline (T1, T2, T3, referrer) and collect
-- staff_ids of upline agents whose rank is in {DD, SDD, GDD, SGDD, RGDD, EGDD}.
-- Returns one row per input staff_id with comma-separated rank matches.

CREATE OR REPLACE FUNCTION public.get_agent_upline_ranks(p_staff_ids TEXT[])
RETURNS TABLE (
  staff_id TEXT,
  t1_staff_id TEXT,
  t2_staff_id TEXT,
  t3_staff_id TEXT,
  referrer_staff_id TEXT,
  dd_agents TEXT,
  sdd_agents TEXT,
  gdd_agents TEXT,
  sgdd_agents TEXT,
  rgdd_agents TEXT,
  egdd_agents TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH base AS (
    SELECT
      a.staff_id AS input_staff_id,
      t1.staff_id AS s1,
      t1.rank_name AS r1,
      t2.staff_id AS s2,
      t2.rank_name AS r2,
      t3.staff_id AS s3,
      t3.rank_name AS r3,
      ref.staff_id AS sr,
      ref.rank_name AS rr
    FROM public.agents a
    LEFT JOIN public.agents t1 ON t1.id = a.current_t1_id AND t1.deleted_at IS NULL
    LEFT JOIN public.agents t2 ON t2.id = t1.current_t1_id AND t2.deleted_at IS NULL
    LEFT JOIN public.agents t3 ON t3.id = t2.current_t1_id AND t3.deleted_at IS NULL
    LEFT JOIN public.agents ref ON ref.id = a.referrer_id AND ref.deleted_at IS NULL
    WHERE a.staff_id = ANY(p_staff_ids)
      AND a.deleted_at IS NULL
  ),
  unpivoted AS (
    SELECT input_staff_id, s1 AS staff_id, r1 AS rank_name, 1 AS ord FROM base WHERE s1 IS NOT NULL
    UNION ALL
    SELECT input_staff_id, s2, r2, 2 FROM base WHERE s2 IS NOT NULL
    UNION ALL
    SELECT input_staff_id, s3, r3, 3 FROM base WHERE s3 IS NOT NULL
    UNION ALL
    SELECT input_staff_id, sr, rr, 4 FROM base WHERE sr IS NOT NULL
  )
  SELECT
    b.input_staff_id,
    b.s1 AS t1_staff_id,
    b.s2 AS t2_staff_id,
    b.s3 AS t3_staff_id,
    b.sr AS referrer_staff_id,
    STRING_AGG(CASE WHEN u.rank_name ILIKE 'DD' THEN u.staff_id END, ', ' ORDER BY u.ord) AS dd_agents,
    STRING_AGG(CASE WHEN u.rank_name ILIKE 'SDD' THEN u.staff_id END, ', ' ORDER BY u.ord) AS sdd_agents,
    STRING_AGG(CASE WHEN u.rank_name ILIKE 'GDD' THEN u.staff_id END, ', ' ORDER BY u.ord) AS gdd_agents,
    STRING_AGG(CASE WHEN u.rank_name ILIKE 'SGDD' THEN u.staff_id END, ', ' ORDER BY u.ord) AS sgdd_agents,
    STRING_AGG(CASE WHEN u.rank_name ILIKE 'RGDD' THEN u.staff_id END, ', ' ORDER BY u.ord) AS rgdd_agents,
    STRING_AGG(CASE WHEN u.rank_name ILIKE 'EGDD' THEN u.staff_id END, ', ' ORDER BY u.ord) AS egdd_agents
  FROM base b
  LEFT JOIN unpivoted u ON u.input_staff_id = b.input_staff_id
  GROUP BY b.input_staff_id, b.s1, b.s2, b.s3, b.sr
  ORDER BY b.input_staff_id;
END;
$$;

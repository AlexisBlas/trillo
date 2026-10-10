-- Report status color now follows the trail surface (dry/wet/muddy), not the
-- overall rating. Re-derive status for existing reports that recorded a surface.
UPDATE public.trail_reports
SET status = CASE
  WHEN 'surface:muddy' = ANY (conditions) THEN 'red'
  WHEN 'surface:damp' = ANY (conditions) THEN 'yellow'
  ELSE 'green'
END
WHERE conditions && ARRAY['surface:dry', 'surface:damp', 'surface:muddy']::TEXT[];

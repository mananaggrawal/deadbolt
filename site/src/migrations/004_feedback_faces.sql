-- Feedback is three faces now (bad, okay, good), with words optional. Older 1–5 ratings map onto the faces.
alter table feedback add column if not exists face text;
update feedback set face = case when rating >= 4 then 'good' when rating = 3 then 'okay' else 'bad' end
  where face is null and rating is not null;

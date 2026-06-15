-- OmideNo7 Meetings — Seed Testing and Release Readiness

insert into public.testing_checklists (section, item, status) values
('Public Access', 'Public user can only see Landing, Login, Request Access, Install App', 'not_tested'),
('Request Access', 'New request appears in Owner Approval Panel', 'not_tested'),
('Owner Approval', 'Approve as Member moves request out of Pending', 'not_tested'),
('Owner Approval', 'Approve as Servant displays servant role/template', 'not_tested'),
('Waiting Room', 'Admit moves user from Waiting Now to Admitted', 'not_tested'),
('Waiting Room', 'Reject moves user from Waiting Now to Rejected', 'not_tested'),
('Live Meeting', 'Mic/Camera default OFF', 'not_tested'),
('Live Meeting', 'Lecture Mode prevents member unmute', 'not_tested'),
('Recordings', 'Owner-only recording stays private by default', 'not_tested'),
('Reports', 'Attendance reports are Owner-only', 'not_tested'),
('Security', 'Member cannot open Owner pages', 'not_tested'),
('PWA', 'iPhone Home Screen install works', 'passed')
on conflict do nothing;

insert into public.release_readiness_items (category, title, status, required_for_release) values
('Legal', 'Privacy Policy page and URL', 'pending', true),
('Legal', 'Terms of Use page and URL', 'pending', true),
('Legal', 'Account deletion instructions', 'pending', true),
('Security', 'Supabase RLS verified', 'pending', true),
('Security', 'LiveKit token endpoint server-side only', 'pending', true),
('Security', 'Emergency Lockdown Owner-only', 'pending', true),
('Backend', 'Supabase Auth connected', 'pending', true),
('Backend', 'Access requests stored in Supabase', 'pending', true),
('Backend', 'Waiting Room stored in Supabase', 'pending', true),
('Meeting', 'LiveKit real room connected', 'pending', true),
('Media', 'Recording storage private', 'pending', true),
('Store', 'Google Play data safety prepared', 'pending', true),
('Store', 'App Store privacy answers prepared', 'pending', true)
on conflict do nothing;

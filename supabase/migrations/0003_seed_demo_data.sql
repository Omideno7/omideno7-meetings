-- OmideNo7 Meetings — Step 20 Demo Seed Data
insert into public.permission_templates (name, role, can_start_meeting, can_admit_waiting_room, can_reject_waiting_room, can_remove_participant, can_mute_participants, can_activate_lecture_mode, can_start_recording, can_view_limited_reports, can_view_full_reports, can_publish_recordings) values
('Senior Host Full Meeting Control','senior_host',true,true,true,true,true,true,false,true,false,false),
('Door Servant Waiting Room','door_servant',false,true,true,false,false,false,false,false,false,false),
('Media Servant Recording','media_servant',false,false,false,false,false,false,true,false,false,false),
('Chat Moderator','chat_moderator',false,false,false,false,false,false,false,false,false,false);
insert into public.access_requests (full_name,email,country,relationship,reason,status,risk) values
('Mary Smith','mary@example.com','Croatia','Church member','I want to join Sunday services.','pending','normal'),
('David Brown','david@example.com','Germany','Servant / Media','I help with media and meetings.','pending','review');
insert into public.meetings (title,meeting_type,status,scheduled_start,scheduled_end,livekit_room_name) values
('Sunday Service','sermon','scheduled',now()+interval '2 days',now()+interval '2 days 2 hours','omideno7-sunday-service'),
('Morning Prayer','prayer','scheduled',now()+interval '1 day',now()+interval '1 day 1 hour','omideno7-morning-prayer');

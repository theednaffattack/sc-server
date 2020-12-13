-- migrate:up

-- ADD MOCK USERS
insert into public.user ("firstName", "lastName", email, "profileImageUri", password, confirmed, username) values ('Cammy', 'Jeroch', 'cjeroch0@theguardian.com', 'http://dummyimage.com/156x231.png/5fa2dd/ffffff', 'PzTFlz9j', true, 'cjeroch0');
insert into public.user ("firstName", "lastName", email, "profileImageUri", password, confirmed, username) values ('Ivory', 'Southon', 'isouthon1@umn.edu', 'http://dummyimage.com/102x134.bmp/cc0000/ffffff', '4wNFzOpsx', true, 'isouthon1');
insert into public.user ("firstName", "lastName", email, "profileImageUri", password, confirmed, username) values ('Tanner', 'Vasilkov', 'tvasilkov2@shutterfly.com', 'http://dummyimage.com/224x235.png/5fa2dd/ffffff', 'n4W37jHCLU', true, 'tvasilkov2');
insert into public.user ("firstName", "lastName", email, "profileImageUri", password, confirmed, username) values ('Aleen', 'Lewin', 'alewin3@odnoklassniki.ru', 'http://dummyimage.com/226x187.jpg/ff4444/ffffff', 'WD2s0q1', true, 'alewin3');
insert into public.user ("firstName", "lastName", email, "profileImageUri", password, confirmed, username) values ('D''arcy', 'Burg', 'dburg4@deliciousdays.com', 'http://dummyimage.com/142x131.jpg/ff4444/ffffff', 'TwPuiBkzI7PC', true, 'dburg4');
insert into public.user ("firstName", "lastName", email, "profileImageUri", password, confirmed, username) values ('Kendricks', 'Vinten', 'kvinten5@bbc.co.uk', 'http://dummyimage.com/179x179.jpg/ff4444/ffffff', 'HChJOhTST7he', true, 'kvinten5');
insert into public.user ("firstName", "lastName", email, "profileImageUri", password, confirmed, username) values ('Raynard', 'Dolphin', 'rdolphin6@mapy.cz', 'http://dummyimage.com/155x126.jpg/dddddd/000000', 'EPXUkhaml5L', true, 'rdolphin6');
insert into public.user ("firstName", "lastName", email, "profileImageUri", password, confirmed, username) values ('Thorny', 'Hospital', 'thospital7@twitpic.com', 'http://dummyimage.com/187x134.jpg/ff4444/ffffff', '5YeFm5RAD', true, 'thospital7');
insert into public.user ("firstName", "lastName", email, "profileImageUri", password, confirmed, username) values ('Bessie', 'Dafforne', 'bdafforne8@answers.com', 'http://dummyimage.com/212x248.jpg/5fa2dd/ffffff', 'bRAayK', true, 'bdafforne8');
insert into public.user ("firstName", "lastName", email, "profileImageUri", password, confirmed, username) values ('Anthe', 'Dallosso', 'adallosso9@unblog.fr', 'http://dummyimage.com/142x236.bmp/cc0000/ffffff', 'bB0YHN', true, 'adallosso9');

-- migrate:down


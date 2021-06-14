--CREATE EXTENSION uuid-ossp IF IT DOESN'T EXIST
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

--DROP TABLES user_data IF IT EXISTS
DROP TABLE IF EXISTS user_data;

--CREATE TABLE user_data IF IT DOESN'T EXIST
CREATE TABLE IF NOT EXISTS user_data(
	ID uuid default uuid_generate_v1() PRIMARY KEY,
	firstname varchar(255) NOT NULL,
	lastname varchar(255) NOT NULL,
	username VARCHAR(255) NOT NULL UNIQUE,
	password VARCHAR(255) NOT NULL
);

--CREATE A TEST ACCOUNT
INSERT INTO user_data(firstname, lastname, username, password)
VALUES(
	'Maliq',
	'Gashi',
	'MaliqGashi',
	'$2b$12$dboyYFuWdx1PdY07E1MA9OuyhxXPzIZfyw9QuZ4RICs7yrVwJ1mHq'
);
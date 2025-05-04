
-- This makes sure that foreign_key constraints are observed and that errors will be thrown for violations
PRAGMA foreign_keys=ON;

BEGIN TRANSACTION;

-- Create your tables with SQL commands here (watch out for slight syntactical differences with SQLite vs MySQL)

CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    event_description TEXT NOT NULL,
    ticket_type_full INT NOT NULL,
    ticket_type_discount INT NOT NULL,
    ticket_price_full INT NOT NULL,
    ticket_price_discount INT NOT NULL,
    event_date TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    publishedAt DATETIME DEFAULT NULL,
    modifiedAt DATETIME DEFAULT NULL,
    is_published INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    attendee_name TEXT NOT NULL,
    title TEXT NOT NULL,
    ticket_amount_full INT NOT NULL,
    ticket_amount_discount INT NOT NULL,
    purchase_time DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    manager_name TEXT NOT NULL,
    title TEXT NOT NULL,
    settings_description TEXT NOT NULL
);


INSERT INTO settings ('manager_name', 'title', 'settings_description') VALUES ('Event Manager Name','Site Name', 'This is the site description');

COMMIT;


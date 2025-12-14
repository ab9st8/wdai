-- PostgreSQL DDLs for the shared database

-- we should probably write constraints for these but whatever. we do that in pydantic

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS books (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    author TEXT,
    published_year INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_id INT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    quantity INT DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

INSERT INTO books (title, author, published_year) VALUES
('House of Leaves', 'Mark Z. Danielewski', 2000),
('Infinite Jest', 'David Foster Wallace', 1996),
('Gravity''s Rainbow', 'Thomas Pynchon', 1973),
('East of Eden', 'John Steinbeck', 1952);

INSERT INTO users (email, password_hash) VALUES
('ally42@mail.com', 'hashed_password_1'),
('robert.smith@mail.com', 'hashed_password_2'),
('lee@mail.com', 'hashed_password_3'),
('xmalloryx@acme.com', 'hashed_password_4');

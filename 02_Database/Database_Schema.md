# Database Schema

## Table: users

- id (uuid, primary key)
- email (text, unique)
- role (text: 'admin' | 'user')
- created_at (timestamp)

## Table: clients

- id (uuid, primary key)
- buyer_name (text, not null)
- phone (text, not null)
- rate (numeric, not null)
- quantity_value (numeric, not null)
- quantity_type (text, not null)
- site_location (text, not null)
- notes (text)
- created_by (uuid, foreign key → users.id)
- created_at (timestamp)

## Indexes

- buyer_name
- site_location
- created_by

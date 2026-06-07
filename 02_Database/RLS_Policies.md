# Row Level Security Policies

RLS Enabled on all tables.
Roles verified via JWT claims (`auth.jwt()->'app_metadata'->>'role'`).

## Clients Table

### SELECT

Admin: All rows
User: Only rows where created_by = auth.uid()

### INSERT

Authenticated users allowed (created_by must equal auth.uid()).

### UPDATE

Admin: All rows
User: Only rows where created_by = auth.uid()

### DELETE

Admin only.


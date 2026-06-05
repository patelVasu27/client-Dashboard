# Row Level Security Policies

RLS Enabled on all tables.

## Clients Table

### SELECT

Admin: All rows
User: Only rows where created_by = auth.uid()

### INSERT

Authenticated users allowed.

### UPDATE

Admin: All rows
User: Only rows where created_by = auth.uid()

### DELETE

Admin only.

# System Architecture

## Architecture Overview

Frontend → Supabase → PostgreSQL

No custom Node.js backend initially.

## Stack

Frontend:

- HTML
- Tailwind CSS
- Vanilla JavaScript

Backend:

- Supabase (Auth + PostgreSQL + RLS)

Hosting:

- Vercel

## Role-Based Access

Admin:

- Full CRUD
- Delete access

Normal User:

- Restricted view
- No delete permission

## Data Flow

User → UI → Supabase → RLS → Database → Response → UI

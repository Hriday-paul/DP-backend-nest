# DocuVault

DocuVault is a backend file management system built for reliable, large-scale file handling. It supports chunked file uploads (so large files can be uploaded in parts without timing out or overloading memory), data extraction from uploaded documents — all backed by a relational database for metadata and state tracking.

## Overview

Traditional single-request file uploads struggle with large files, unstable networks, and server memory limits. DocuVault solves this by breaking uploads into chunks that are sent, tracked, and reassembled on the server. Once a file is fully uploaded, it's queued for background processing — such as content/data extraction — so the API stays fast and responsive instead of blocking on heavy I/O or parsing work.

## Key Features

- **Chunked File Upload**: Large files are split into smaller chunks on the client and uploaded sequentially or in parallel. The server tracks each chunk, verifies completeness, and merges them into the final file once all parts arrive.
- **Resumable Uploads**: Failed or interrupted uploads can resume from the last successfully received chunk instead of restarting from scratch.
- **Asynchronous Data Extraction**: After upload, files are processing to extract text, metadata, or structured data — keeping this heavy work off the main request/response cycle.
- **Job Queue Management**: Background tasks (extraction, processing, cleanup) are handled through a robust queue system with retry logic, backoff strategies, and job status tracking.
- **File Metadata & State Tracking**: Every file's upload status, chunk progress, and processing state is persisted in the database, giving a clear audit trail of what happened to each file.
- **Scalable Architecture**: Decoupled upload, processing, and storage concerns allow each part of the system to scale independently.

## Technology Stack

| Layer | Technology |
|---|---|
| Backend Framework | [NestJS](https://nestjs.com/) — modular, TypeScript-based Node.js framework |
| ORM | [Prisma](https://www.prisma.io/) — type-safe database access and migrations |
| Database | [PostgreSQL](https://www.postgresql.org/) — relational data storage for files, chunks, and job metadata |
| Job Queue | [BullMQ](https://docs.bullmq.io/) — Redis-backed queue for background job processing (data extraction, retries, scheduling) |
| Language | TypeScript |
| Queue Backend | Redis (required by BullMQ) |

## How It Works

1. **Upload Initiation** — The client requests an upload session; the server creates a record for the incoming file and prepares to receive chunks.
2. **Chunk Transfer** — The file is split into chunks and sent to the server one at a time (or in parallel), each tagged with its sequence index.
3. **Chunk Tracking** — Prisma persists the state of each received chunk in PostgreSQL, allowing the server to know exactly what's been received and what's missing.
4. **File Assembly** — Once all chunks arrive, they're merged in order into the final file on storage.
5. **Job Enqueueing** — A background job is pushed onto a BullMQ queue to handle post-upload work like data/content extraction.
6. **Background Processing** — Worker processes pick up jobs from the queue, extract data from the file, and update the file's status/metadata in the database.
7. **Status Availability** — Consumers can check the file's upload and processing status at any point via its persisted state.

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

## Prerequisites

- Node.js (LTS recommended)
- PostgreSQL instance
- Redis instance (required for BullMQ)
- npm or yarn
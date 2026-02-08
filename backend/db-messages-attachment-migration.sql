-- Run this in your MySQL database after db-messages-migration.sql
-- Adds attachment support for chat messages (doc, pdf, word)

ALTER TABLE messages
  ADD COLUMN attachment_original_name VARCHAR(255) NULL AFTER content,
  ADD COLUMN attachment_storage_name VARCHAR(255) NULL AFTER attachment_original_name;

-- Employer verification onboarding (Jobseeker -> Employer)
--
-- Run this against your MySQL database (DB_NAME) once.

ALTER TABLE users
  ADD COLUMN employer_verified BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS employer_verification_requests (
  id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,

  employer_name VARCHAR(255) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  gstin VARCHAR(50) NOT NULL,
  office_address TEXT NOT NULL,
  contact_email VARCHAR(255) NOT NULL,
  website VARCHAR(255) NULL,

  status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  notes TEXT NULL,

  reviewed_at TIMESTAMP NULL DEFAULT NULL,
  reviewed_by INT NULL,

  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_evr_user (user_id),
  KEY idx_evr_status (status),
  CONSTRAINT fk_evr_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_evr_reviewer
    FOREIGN KEY (reviewed_by) REFERENCES users(id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- Drop existing table if it exists
DROP TABLE IF EXISTS postboxes;

-- Create table with 'adresa' column (not 'mesto')
CREATE TABLE postboxes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    psc VARCHAR(10) NOT NULL,
    adresa VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_psc (psc),
    INDEX idx_adresa (adresa)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_czech_ci;
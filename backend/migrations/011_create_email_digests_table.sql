-- Create table to track sent email digests (prevents duplicates)
CREATE TABLE IF NOT EXISTS email_digests (
    digestId SERIAL PRIMARY KEY,
    userId INT NOT NULL REFERENCES users(userId) ON DELETE CASCADE,
    sentDate DATE NOT NULL,
    followupCount INT NOT NULL DEFAULT 0,
    sentAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'sent',
    errorMessage TEXT,
    CONSTRAINT unique_user_date UNIQUE (userId, sentDate)
);

CREATE INDEX IF NOT EXISTS idx_email_digests_user_date ON email_digests(userId, sentDate);
CREATE INDEX IF NOT EXISTS idx_email_digests_sent_date ON email_digests(sentDate);

COMMENT ON TABLE email_digests IS 'Tracks daily digest emails sent to users';
COMMENT ON COLUMN email_digests.status IS 'sent, failed, or skipped';
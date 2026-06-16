CREATE TABLE IF NOT EXISTS url_clicks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url_id      UUID NOT NULL REFERENCES urls(id) ON DELETE CASCADE,
  ip_address  VARCHAR(45),
  user_agent  TEXT,
  referrer    TEXT,
  country     VARCHAR(100),
  device_type VARCHAR(50),
  browser     VARCHAR(100),
  clicked_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_url_clicks_url_id ON url_clicks(url_id);
CREATE INDEX IF NOT EXISTS idx_url_clicks_clicked_at ON url_clicks(clicked_at);
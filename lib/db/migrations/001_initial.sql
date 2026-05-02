CREATE TABLE items (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(200) NOT NULL,
  description TEXT,
  price_czk   DECIMAL(10, 2) NOT NULL,
  is_active   TINYINT(1) NOT NULL DEFAULT 1,
  sort_order  INT UNSIGNED NOT NULL DEFAULT 0,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE orders (
  id                 INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  stripe_payment_id  VARCHAR(100) NOT NULL UNIQUE,
  stripe_status      VARCHAR(50) NOT NULL,
  total_czk          DECIMAL(10, 2) NOT NULL,
  customer_email     VARCHAR(255),
  customer_name      VARCHAR(255),
  line_items         JSON NOT NULL,
  created_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_items_active ON items(is_active, sort_order);
CREATE INDEX idx_orders_stripe ON orders(stripe_payment_id);

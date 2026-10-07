CREATE TABLE sales_events (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, date TEXT NOT NULL,
  opening_cash INTEGER NOT NULL CHECK(opening_cash >= 0),
  closed INTEGER NOT NULL DEFAULT 0 CHECK(closed IN (0,1))
);
CREATE TABLE sales_items (
  event_id TEXT NOT NULL REFERENCES sales_events(id), id TEXT NOT NULL,
  title TEXT NOT NULL, cover TEXT NOT NULL, price INTEGER NOT NULL CHECK(price >= 0),
  brought INTEGER NOT NULL CHECK(brought >= 0), remaining INTEGER NOT NULL CHECK(remaining >= 0),
  PRIMARY KEY(event_id,id)
);
CREATE TABLE sales_movements (
  id TEXT PRIMARY KEY, event_id TEXT NOT NULL, item_id TEXT NOT NULL,
  method TEXT NOT NULL CHECK(method IN ('cash','transfer','card','gift')),
  amount INTEGER NOT NULL CHECK(amount >= 0), actor TEXT NOT NULL,
  voided INTEGER NOT NULL DEFAULT 0 CHECK(voided IN (0,1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(event_id,item_id) REFERENCES sales_items(event_id,id)
);
CREATE INDEX sales_movements_event ON sales_movements(event_id,created_at);
CREATE TRIGGER sales_stock_take BEFORE INSERT ON sales_movements BEGIN
  SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM sales_items i JOIN sales_events e ON e.id=i.event_id WHERE i.event_id=NEW.event_id AND i.id=NEW.item_id AND i.remaining>0 AND e.closed=0) THEN RAISE(ABORT,'stock_or_closed') END;
  UPDATE sales_items SET remaining=remaining-1 WHERE event_id=NEW.event_id AND id=NEW.item_id;
END;
CREATE TRIGGER sales_stock_restore AFTER UPDATE OF voided ON sales_movements WHEN OLD.voided=0 AND NEW.voided=1 BEGIN
  UPDATE sales_items SET remaining=remaining+1 WHERE event_id=NEW.event_id AND id=NEW.item_id;
END;

-- rotation_slots の duty に 'meeting' を追加
-- SQLite は CHECK 制約の変更不可のためテーブル再作成
CREATE TABLE rotation_slots_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rotation_id INTEGER NOT NULL REFERENCES rotations(id) ON DELETE CASCADE,
  slot_index INTEGER NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id),
  duty TEXT NOT NULL CHECK(duty IN ('service', 'watching', 'break', 'meeting')),
  UNIQUE(rotation_id, slot_index, user_id)
);

INSERT INTO rotation_slots_new SELECT * FROM rotation_slots;

DROP TABLE rotation_slots;

ALTER TABLE rotation_slots_new RENAME TO rotation_slots;

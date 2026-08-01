#!/bin/sh
set -eu

mysql --protocol=socket -uroot -p"${MYSQL_ROOT_PASSWORD}" "${MYSQL_DATABASE}" <<'SQL'
CREATE TABLE IF NOT EXISTS agence (
  id CHAR(36) NOT NULL,
  region VARCHAR(255) NOT NULL,
  gouvernorat VARCHAR(255) NOT NULL,
  delegation VARCHAR(255) NOT NULL,
  agence VARCHAR(255) NOT NULL,
  PRIMARY KEY (id)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
SQL

mysql --protocol=socket --default-character-set=utf8mb4 -uroot \
  -p"${MYSQL_ROOT_PASSWORD}" "${MYSQL_DATABASE}" < /tmp/agences-enda.sql

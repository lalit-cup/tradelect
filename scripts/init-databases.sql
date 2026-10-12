-- Tradelect - create all required databases on first startup
CREATE DATABASE IF NOT EXISTS tradelect_auth     CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS tradelect_products CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS tradelect_orders   CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS tradelect_users    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS tradelect_notifications CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

GRANT ALL PRIVILEGES ON tradelect_auth.*          TO 'root'@'%';
GRANT ALL PRIVILEGES ON tradelect_products.*      TO 'root'@'%';
GRANT ALL PRIVILEGES ON tradelect_orders.*        TO 'root'@'%';
GRANT ALL PRIVILEGES ON tradelect_users.*         TO 'root'@'%';
GRANT ALL PRIVILEGES ON tradelect_notifications.* TO 'root'@'%';
FLUSH PRIVILEGES;

-- Core roles
INSERT IGNORE INTO roles (name, description) VALUES
 ('admin', 'Full administrative access'),
 ('user', 'Regular user with limited access');

-- Core permissions (extend as needed)
INSERT IGNORE INTO permissions (name, description) VALUES
 ('users:read', 'Read user list and profiles'),
 ('users:write', 'Create/update/delete users'),
 ('auth:invalidate_token', 'Invalidate refresh tokens / force logout'),
 ('audit:read', 'Read audit logs'),
 ('rbac:manage', 'Manage roles and permissions');

-- Grant ALL permissions to admin
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p
WHERE r.name = 'admin';

-- Optional: give base minimal permissions to 'user' (none for now)

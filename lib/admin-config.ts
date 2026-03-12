function readEnv(...keys: string[]) {
  for (const key of keys) {
    const value = String(process.env[key] || "").trim();
    if (value) return value;
  }
  return "";
}

export const DEFAULT_OWNER_USER_ID = "acct_tradehax_owner";
export const DEFAULT_ADMIN_ROLE = "admin_owner";
export const DEFAULT_ADMIN_LOGIN_USERNAME = "admin";

export function getOwnerUserId() {
  const raw = readEnv("TRADEHAX_OWNER_USER_ID", "TRADEHAX_ADMIN_OWNER_USER_ID") || DEFAULT_OWNER_USER_ID;
  return raw.toLowerCase();
}

export function getAdminRole() {
  return readEnv("TRADEHAX_ADMIN_ROLE") || DEFAULT_ADMIN_ROLE;
}

export function getAdminLoginUsername() {
  return readEnv("TRADEHAX_LOGIN_USERNAME", "TRADEHAX_ADMIN_USERNAME") || DEFAULT_ADMIN_LOGIN_USERNAME;
}

export function getAdminPasswordHash() {
  return readEnv("TRADEHAX_LOGIN_PASSWORD_HASH", "TRADEHAX_ADMIN_PASSWORD_HASH");
}

export function getAdminPasswordPlaintext() {
  return readEnv("TRADEHAX_LOGIN_PASSWORD", "TRADEHAX_ADMIN_PASSWORD");
}

export function getAdminKey() {
  return readEnv("TRADEHAX_ADMIN_KEY", "TRADEHAX_API_ADMIN_KEY", "TRADEHAX_ADMIN_TOKEN");
}

export function getSuperuserCode() {
  return readEnv("TRADEHAX_SUPERUSER_CODE", "TRADEHAX_ADMIN_SUPERUSER_CODE");
}

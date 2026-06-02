export function applySmartOrdoSso() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("sso");
  if (!token) return;

  const decodePayload = () => {
    try {
      const [, payload] = token.split(".");
      return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    } catch {
      return {};
    }
  };

  const payload = decodePayload();
  const user = {
    id: payload.id,
    name: payload.name,
    email: payload.email,
    role: payload.role,
    organization_id: payload.organization_id || null,
    provider: "smartordo",
  };

  localStorage.setItem("accessToken", token);
  localStorage.setItem("token", token);
  localStorage.setItem("smartordo_sso_token", token);
  localStorage.setItem("smartordo_user", JSON.stringify(user));
  localStorage.setItem("user", JSON.stringify(user));

  const cleanUrl = new URL(window.location.href);
  cleanUrl.searchParams.delete("sso");
  cleanUrl.searchParams.delete("module");
  window.history.replaceState({}, document.title, cleanUrl.toString());
}

const FACULTY_TOKEN_KEY = "facultyAuthToken";

export function getFacultyToken() {
  return localStorage.getItem(FACULTY_TOKEN_KEY);
}

export function setFacultyToken(token: string) {
  localStorage.setItem(FACULTY_TOKEN_KEY, token);
}

export function clearFacultyToken() {
  localStorage.removeItem(FACULTY_TOKEN_KEY);
}

export function isFacultyAuthenticated() {
  return Boolean(getFacultyToken());
}

export async function facultyApiFetch(path: string, options: RequestInit = {}) {
  const token = getFacultyToken();
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(path, {
    ...options,
    headers,
  });

  return response;
}

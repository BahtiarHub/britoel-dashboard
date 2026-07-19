import http from "k6/http";
import { check, sleep } from "k6";

const baseUrl = (__ENV.BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
const target = Number(__ENV.TARGET_VUS || 100);
const rampQuarterDuration = __ENV.RAMP_QUARTER_DURATION || "2m";
const rampTargetDuration = __ENV.RAMP_TARGET_DURATION || "3m";
const holdDuration = __ENV.HOLD_DURATION || "5m";
const rampDownDuration = __ENV.RAMP_DOWN_DURATION || "2m";

export const options = {
  stages: [
    { duration: rampQuarterDuration, target: Math.max(5, Math.round(target * 0.25)) },
    { duration: rampTargetDuration, target },
    { duration: holdDuration, target },
    { duration: rampDownDuration, target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<1500"],
  },
};

export function setup() {
  if (!__ENV.TEST_EMAIL || !__ENV.TEST_PASSWORD) throw new Error("TEST_EMAIL dan TEST_PASSWORD wajib diisi.");
  const response = http.post(`${baseUrl}/api/auth/sign-in/email`, JSON.stringify({
    email: __ENV.TEST_EMAIL,
    password: __ENV.TEST_PASSWORD,
  }), { headers: { "Content-Type": "application/json", Origin: baseUrl } });
  check(response, { "login berhasil": (result) => result.status >= 200 && result.status < 300 });
  const cookies = Object.entries(response.cookies).flatMap(([name, values]) => values.map((value) => `${name}=${value.value}`));
  if (!cookies.length) throw new Error("Cookie sesi tidak diterima.");
  return { cookie: cookies.join("; ") };
}

export default function (data) {
  const params = { headers: { Cookie: data.cookie }, tags: { suite: "dashboard" } };
  const dashboard = http.get(`${baseUrl}/api/dashboard-data`, params);
  check(dashboard, { "dashboard 200": (response) => response.status === 200 });
  const access = http.get(`${baseUrl}/api/access`, params);
  check(access, { "access 200": (response) => response.status === 200 });
  sleep(Math.random() * 2 + 1);
}

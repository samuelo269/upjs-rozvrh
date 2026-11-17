const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function service(fetch) {
  const context = vm.createContext({ Intl, Date, URL, URLSearchParams, AbortController, setTimeout, clearTimeout, fetch });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'weather.js'), 'utf8'), context);
  return context.WeatherForecast;
}

const config = {
  startDate: '2026-09-14', endDate: '2026-12-18',
  weather: { latitude: 48.7164, longitude: 21.2611, timezone: 'Europe/Bratislava' }
};
const lesson = { day: 2, start: '08:55', end: '09:40' };
const hourly = {
  time: ['2026-11-18T08:00', '2026-11-18T09:00'],
  temperature_2m: [5, 6.7], apparent_temperature: [3, 4.2],
  precipitation_probability: [0, 60], weather_code: [0, 61], wind_speed_10m: [8, 12]
};

test('keeps an upcoming or ongoing class, then advances after its end', () => {
  const weather = service();
  assert.equal(weather.nextOccurrence(lesson, new Date('2026-11-18T07:00:00Z'), config), '2026-11-18');
  assert.equal(weather.nextOccurrence(lesson, new Date('2026-11-18T08:20:00Z'), config), '2026-11-18');
  assert.equal(weather.nextOccurrence(lesson, new Date('2026-11-18T08:40:00Z'), config), '2026-11-25');
});

test('uses the campus date even when the visitor is on another calendar day', () => {
  const monday = { day: 0, start: '08:00', end: '09:30' };
  assert.equal(service().nextOccurrence(monday, new Date('2026-11-15T23:30:00Z'), config), '2026-11-16');
  assert.equal(service().nextOccurrence(monday, new Date('2026-09-20T22:30:00Z'), config), '2026-09-21');
});

test('respects semester start and has no occurrence after the last class', () => {
  const weather = service();
  assert.equal(weather.nextOccurrence(lesson, new Date('2026-08-01T10:00:00Z'), config), '2026-09-16');
  assert.equal(weather.nextOccurrence(lesson, new Date('2026-12-16T08:40:00Z'), config), null);
});

test('selects the nearest hourly forecast and preserves rain and wind detail', () => {
  const forecast = service().forLesson(hourly, lesson, '2026-11-18');
  assert.equal(forecast.time, '2026-11-18T09:00');
  assert.equal(forecast.temperature, 7);
  assert.equal(forecast.rain, 60);
  assert.equal(forecast.wind, 12);
  assert.equal(forecast.conditions.label, 'Dážď');
});

test('does not fabricate forecasts beyond the horizon or from missing values', () => {
  const weather = service();
  assert.equal(weather.forLesson(hourly, lesson, '2026-12-18'), null);
  assert.equal(weather.forLesson(hourly, lesson, null), null);
  assert.equal(weather.forLesson({ ...hourly, temperature_2m: [5, null] }, lesson, '2026-11-18'), null);
  assert.equal(weather.forLesson({ ...hourly, weather_code: [0, null] }, lesson, '2026-11-18'), null);
});

test('requests campus hourly weather in Celsius with a 16-day horizon', async () => {
  const weather = service(async (url, options) => {
    const request = new URL(url);
    assert.equal(request.searchParams.get('timezone'), 'Europe/Bratislava');
    assert.equal(request.searchParams.get('forecast_days'), '16');
    assert.equal(request.searchParams.get('latitude'), '48.7164');
    assert.ok(request.searchParams.get('hourly').includes('precipitation_probability'));
    assert.equal(options.referrerPolicy, 'no-referrer');
    return { ok: true, json: async () => ({ hourly }) };
  });
  assert.equal(await weather.load(config.weather), hourly);
});

test('surfaces HTTP failures, malformed responses, and network errors', async () => {
  await assert.rejects(service(async () => ({ ok: false, status: 503 })).load(config.weather), /503/);
  await assert.rejects(service(async () => ({
    ok: true, json: async () => ({ hourly: { ...hourly, weather_code: [] } })
  })).load(config.weather), /Invalid hourly/);
  await assert.rejects(service(async () => { throw new Error('Offline'); }).load(config.weather), /Offline/);
});

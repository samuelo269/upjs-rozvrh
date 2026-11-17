var WeatherForecast = (function () {
  'use strict';

  function localTime(now, timezone) {
    var parts = {};
    new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).formatToParts(now).forEach(function (part) { parts[part.type] = part.value; });
    return {
      date: parts.year + '-' + parts.month + '-' + parts.day,
      minutes: Number(parts.hour) * 60 + Number(parts.minute)
    };
  }

  function nextOccurrence(lesson, now, config) {
    var local = localTime(now, config.weather.timezone);
    var first = local.date < config.startDate ? config.startDate : local.date;
    var date = new Date(first + 'T00:00:00Z');
    var offset = (lesson.day - (date.getUTCDay() + 6) % 7 + 7) % 7;
    date.setUTCDate(date.getUTCDate() + offset);
    var result = date.toISOString().slice(0, 10);
    var end = lesson.end.split(':');
    if (result === local.date && Number(end[0]) * 60 + Number(end[1]) <= local.minutes) {
      date.setUTCDate(date.getUTCDate() + 7);
      result = date.toISOString().slice(0, 10);
    }
    return result <= config.endDate ? result : null;
  }

  function conditions(code) {
    if (code === 0) return { icon: '\u2600\uFE0F', label: 'Jasno' };
    if (code === 1 || code === 2) return { icon: '\u26C5', label: 'Polojasno' };
    if (code === 3) return { icon: '\u2601\uFE0F', label: 'Zamračené' };
    if (code === 45 || code === 48) return { icon: '\uD83C\uDF2B\uFE0F', label: 'Hmla' };
    if ([51, 53, 55, 56, 57].indexOf(code) !== -1) return { icon: '\uD83C\uDF26\uFE0F', label: 'Mrholenie' };
    if ([61, 63, 65, 66, 67, 80, 81, 82].indexOf(code) !== -1) return { icon: '\uD83C\uDF27\uFE0F', label: 'Dážď' };
    if ([71, 73, 75, 77, 85, 86].indexOf(code) !== -1) return { icon: '\u2744\uFE0F', label: 'Sneženie' };
    if ([95, 96, 99].indexOf(code) !== -1) return { icon: '\u26C8\uFE0F', label: 'Búrka' };
    return { icon: '', label: 'Neznámy stav počasia' };
  }

  function forLesson(hourly, lesson, date) {
    if (!hourly || !date) return null;
    var start = lesson.start.split(':');
    var hour = Math.round((Number(start[0]) * 60 + Number(start[1])) / 60);
    var time = date + 'T' + String(hour).padStart(2, '0') + ':00';
    var i = hourly.time.indexOf(time);
    if (i < 0 || !Number.isFinite(hourly.temperature_2m[i]) || !Number.isFinite(hourly.weather_code[i])) return null;
    return {
      time: time, temperature: Math.round(hourly.temperature_2m[i]),
      apparent: hourly.apparent_temperature[i],
      rain: hourly.precipitation_probability[i], wind: hourly.wind_speed_10m[i],
      conditions: conditions(hourly.weather_code[i])
    };
  }

  async function load(config) {
    var url = new URL('https://api.open-meteo.com/v1/forecast');
    url.search = new URLSearchParams({
      latitude: config.latitude, longitude: config.longitude, timezone: config.timezone,
      forecast_days: '16',
      hourly: 'temperature_2m,apparent_temperature,precipitation_probability,weather_code,wind_speed_10m'
    }).toString();
    var controller = new AbortController();
    var timeout = setTimeout(function () { controller.abort(); }, 12000);
    try {
      var response = await fetch(url.toString(), { signal: controller.signal, referrerPolicy: 'no-referrer' });
      if (!response.ok) throw new Error('Weather HTTP ' + response.status);
      var data = await response.json();
      var fields = ['time', 'temperature_2m', 'apparent_temperature', 'precipitation_probability', 'weather_code', 'wind_speed_10m'];
      if (!data.hourly || !fields.every(function (field) {
        return Array.isArray(data.hourly[field]) && data.hourly[field].length === data.hourly.time.length;
      }) || !data.hourly.time.length) throw new Error('Invalid hourly weather response');
      return data.hourly;
    } finally {
      clearTimeout(timeout);
    }
  }

  return { nextOccurrence: nextOccurrence, conditions: conditions, forLesson: forLesson, load: load };
})();

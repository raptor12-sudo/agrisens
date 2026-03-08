const { InfluxDB, Point } = require('@influxdata/influxdb-client');
const logger = require('../../utils/logger');

const client = new InfluxDB({
  url:   process.env.INFLUX_URL,
  token: process.env.INFLUX_TOKEN,
});

const writeApi = client.getWriteApi(
  process.env.INFLUX_ORG,
  process.env.INFLUX_BUCKET,
  's'
);

const queryApi = client.getQueryApi(process.env.INFLUX_ORG);

// ─────────────────────────────
// Écrire une mesure
// ─────────────────────────────
async function writeMesure({ measurement, field, value, tags = {} }) {
  try {
    const point = new Point(measurement)
      .floatField(field, parseFloat(value));

    Object.entries(tags).forEach(([k, v]) => point.tag(k, v));

    writeApi.writePoint(point);
    await writeApi.flush();
    logger.debug(`InfluxDB write: ${measurement}.${field} = ${value}`);
  } catch (err) {
    logger.error('Erreur écriture InfluxDB :', err.message);
    throw err;
  }
}

// ─────────────────────────────
// Lire les mesures (time range)
// ─────────────────────────────
async function queryMesures({ measurement, field, deviceUID, from, to, granularity = '1m' }) {
  const range = to
    ? `range(start: ${from}, stop: ${to})`
    : `range(start: ${from})`;

  const filter = `
    filter(fn: (r) => r._measurement == "${measurement}")
    |> filter(fn: (r) => r._field == "${field}")
    ${deviceUID ? `|> filter(fn: (r) => r.device_uid == "${deviceUID}")` : ''}
  `;

  const query = `
    from(bucket: "${process.env.INFLUX_BUCKET}")
    |> ${range}
    |> ${filter}
    |> aggregateWindow(every: ${granularity}, fn: mean, createEmpty: false)
    |> yield(name: "mean")
  `;

  return new Promise((resolve, reject) => {
    const results = [];
    queryApi.queryRows(query, {
      next(row, tableMeta) {
        const obj = tableMeta.toObject(row);
        results.push({ time: obj._time, value: obj._value });
      },
      error(err) {
        logger.error('Erreur lecture InfluxDB :', err.message);
        reject(err);
      },
      complete() { resolve(results); },
    });
  });
}

// ─────────────────────────────
// Stats journalières depuis InfluxDB
// ─────────────────────────────
async function queryStats({ measurement, field, deviceUID, date }) {
  const start = `${date}T00:00:00Z`;
  const stop  = `${date}T23:59:59Z`;

  const query = `
    from(bucket: "${process.env.INFLUX_BUCKET}")
    |> range(start: ${start}, stop: ${stop})
    |> filter(fn: (r) => r._measurement == "${measurement}")
    |> filter(fn: (r) => r._field == "${field}")
    ${deviceUID ? `|> filter(fn: (r) => r.device_uid == "${deviceUID}")` : ''}
  `;

  return new Promise((resolve, reject) => {
    const values = [];
    queryApi.queryRows(query, {
      next(row, tableMeta) {
        const obj = tableMeta.toObject(row);
        values.push(obj._value);
      },
      error(err) { reject(err); },
      complete() {
        if (!values.length) return resolve(null);
        const sorted = [...values].sort((a, b) => a - b);
        const sum    = values.reduce((a, b) => a + b, 0);
        const mean   = sum / values.length;
        const median = sorted[Math.floor(sorted.length / 2)];
        const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / values.length;

        resolve({
          min:      sorted[0],
          max:      sorted[sorted.length - 1],
          mean:     parseFloat(mean.toFixed(4)),
          median:   parseFloat(median.toFixed(4)),
          ecartType: parseFloat(Math.sqrt(variance).toFixed(4)),
          count:    values.length,
        });
      },
    });
  });
}

module.exports = { writeMesure, queryMesures, queryStats };

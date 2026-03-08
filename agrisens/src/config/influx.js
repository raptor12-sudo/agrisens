const { InfluxDB, Point } = require('@influxdata/influxdb-client');

const client = new InfluxDB({
  url:   process.env.INFLUX_URL,
  token: process.env.INFLUX_TOKEN,
});

const writeApi = client.getWriteApi(
  process.env.INFLUX_ORG,
  process.env.INFLUX_BUCKET,
  's' // précision : secondes
);

const queryApi = client.getQueryApi(process.env.INFLUX_ORG);

module.exports = { client, writeApi, queryApi, Point };

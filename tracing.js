// tracing.js
'use strict'

import process from 'process'
import opentelemetry from '@opentelemetry/sdk-node'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

const exporterOptions = {
   url: 'http://190.106.145.73:3301/v1/traces'
   }
   
const traceExporter = new OTLPTraceExporter(exporterOptions);
const sdk = new opentelemetry.NodeSDK({
   traceExporter,
   instrumentations: [getNodeAutoInstrumentations()],
   resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: 'node_app'
      })
});

// initialize the SDK and register with the OpenTelemetry API
// this enables the API to record telemetry

sdk.start()
console.log('SDK tracing started successfully')

// gracefully shut down the SDK on process exit
process.on('SIGTERM', () => {
   sdk.shutdown()
 .then(() => console.log('Tracing terminated'))
 .catch((error) => console.log('Error terminating tracing', error))
 .finally(() => process.exit(0));
 });


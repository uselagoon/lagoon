import * as R from 'ramda';

export type ProjectTuple = [number, string];

/**
 * Payload structure for OpenSearch client request
 */
export interface OpenSearchPayload {
  body: any;
  headers?: {
    securitytenant: string;
  };
}

const setPayloadBody = (body: any) => R.set(R.lensPath(['body']), body);
const setPayloadTenant = (tenantName: string) =>
  R.set(R.lensPath(['headers', 'securitytenant']), tenantName);

export const generateOpenSearchPayload = <Payload>(
  data: any,
  tenantName?: string
): Payload =>
  R.pipe(
    setPayloadBody(data),
    R.unless(
      () => R.either(R.isNil, R.isEmpty)(tenantName),
      setPayloadTenant(tenantName)
    )
  )({}) as Payload;

/**
 * Payload structure for undocumented settings API
 */
interface OpenSearchSettingsPayload extends OpenSearchPayload {
  body: {
    changes: {
      defaultIndex: 'container-logs-*';
      'telemetry:optIn': false; // also opt out of telemetry from xpack
    };
  };
  headers: {
    securitytenant: string;
  };
}

export const generateOpenSearchSettingsPayload = (tenantName: string) =>
  <OpenSearchSettingsPayload>generateOpenSearchPayload(
    {
      changes: {
        defaultIndex: 'container-logs-*',
        'telemetry:optIn': false // Opt-out of telemetry from xpack plugin
      }
    },
    tenantName
  );

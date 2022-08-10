import { complement } from 'ramda';
import { OpenSearchPayload, generateOpenSearchPayload } from '.';

export const isGlobalTenant = (tenantName: string): boolean =>
  tenantName === 'global_tenant';

export const notGlobalTenant = complement(isGlobalTenant);

/**
 * Payload structure for creating a tenant
 */
interface OpenSearchTenantPayload extends OpenSearchPayload {
  body: {
    description: string;
  };
}

export const generateTenantPayload = (tenantName: string) =>
  <OpenSearchTenantPayload>generateOpenSearchPayload({
    description: tenantName
  });

import { OpenSearchPayload, generateOpenSearchPayload } from '.';

/**
 * Payload structure for creating a roles mapping
 */
interface OpenSearchRoleMappingPayload extends OpenSearchPayload {
  body: {
    backend_roles: string[];
  };
}

export const generateOpenSearchRoleMappingpayload = (roles: string[]) =>
  <OpenSearchRoleMappingPayload>generateOpenSearchPayload({
    backend_roles: roles
  });

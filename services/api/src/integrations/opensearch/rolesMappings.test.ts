import { generateOpenSearchRoleMappingpayload } from './rolesMappings';

test('generateOpenSearchRoleMappingpayload', () => {
  expect(generateOpenSearchRoleMappingpayload(['high-cotton'])).toStrictEqual({
    body: {
      backend_roles: ['high-cotton']
    }
  });
});

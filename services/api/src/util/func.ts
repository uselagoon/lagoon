export * from '@lagoon/commons/dist/util/func';

// Check if the GraphQL request contains any fields that are not in the provided args
export function requestsExtraFields(info, minimalFields: string[]): boolean {
  const allowedFields = Array.isArray(minimalFields) ? minimalFields : [minimalFields];

  const fields = info.fieldNodes[0]?.selectionSet?.selections;

  if (!fields) {
    return false;
  }

  const hasNonMinimalField = fields.some(field => {
    if (field.kind !== 'Field' || field.name.value.startsWith('__')) {
      return false;
    }

    return !allowedFields.includes(field.name.value);
  });

  return hasNonMinimalField;
}
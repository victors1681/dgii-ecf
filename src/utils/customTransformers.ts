import ecfReference from './ecf-references/ecf.json';

export const transformeLowercasePayloadToCamelcase = (
  source: any,
  reference: any = ecfReference
): any => {
  if (Array.isArray(source)) {
    return source.map((item, i) =>
      transformeLowercasePayloadToCamelcase(item, reference?.[i])
    );
  } else if (
    source !== null &&
    typeof source === 'object' &&
    typeof reference === 'object'
  ) {
    return Object.keys(source).reduce((acc, key) => {
      const matchedKey =
        Object.keys(reference).find(
          (refKey) => refKey.toLowerCase() === key.toLowerCase()
        ) || key;

      acc[matchedKey] = transformeLowercasePayloadToCamelcase(
        source[key],
        reference?.[matchedKey]
      );
      return acc;
    }, {} as Record<string, any>);
  }
  return source;
};

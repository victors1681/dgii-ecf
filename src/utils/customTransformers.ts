import ecfReference from './ecf-references/ecf';

export const transformeLowercasePayloadToCamelcase = (
  source: any,
  reference: any = ecfReference
): any => {
  if (Array.isArray(source)) {
    // Use the first item in the reference array as the template for all items
    const itemReference = Array.isArray(reference) ? reference[0] : reference;
    return source.map((item) =>
      transformeLowercasePayloadToCamelcase(item, itemReference)
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

      // Log when no matching key is found in reference
      if (
        !Object.keys(reference).some(
          (refKey) => refKey.toLowerCase() === key.toLowerCase()
        )
      ) {
        console.warn(
          `[transformeLowercasePayloadToCamelcase] No matching key found in reference for: "${key}". Using original key.`
        );
      }

      acc[matchedKey] = transformeLowercasePayloadToCamelcase(
        source[key],
        reference?.[matchedKey]
      );
      return acc;
    }, {} as Record<string, any>);
  }
  return source;
};

/**
 * Util to get the XML content from the body response, when we receive content from DGII commercial approval
 * @param body
 * @param lasTagName can be ACECF: commercial approval or ARECF: eCF received
 * @returns
 */

export const getXmlFromBodyResponse = (
  body: string,
  lasTagName = 'ACECF'
): string | undefined => {
  const regex = new RegExp(`<\\?xml[\\s\\S]*?<\\/${lasTagName}>`);

  // Use the regular expression to extract the XML content
  const match = body.match(regex);

  if (match) {
    const xmlContent = match[0];
    return xmlContent;
  } else {
    console.log('XML content not found in the response body.');
  }
};

import { DOMParser, XMLSerializer } from '@xmldom/xmldom';

/**
 * Edit value inside XML
 * @param xml
 * @param name
 * @param value
 * @returns
 */
export const editXmlValue = (xml: string, name: string, value: string) => {
  const resDom = new DOMParser().parseFromString(xml, 'text/xml');
  const signatureValue = resDom.getElementsByTagName(name)
    ? resDom.getElementsByTagName(name)[0]
    : undefined;

  if (!signatureValue) {
    throw Error(` ${name} Element not found`);
  }
  if (signatureValue.childNodes[0]) {
    signatureValue.childNodes[0].textContent = value;
  } else {
    const n = resDom.createTextNode(value);
    signatureValue.appendChild(n);
  }

  const serializer = new XMLSerializer();
  const newXML = serializer.serializeToString(resDom);

  return newXML;
};

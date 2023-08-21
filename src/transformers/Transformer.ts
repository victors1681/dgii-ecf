import convert from 'xml-js';

export class Transformer {
  json2xml = (dataObject: Object) => {
    const data = {};
    Object.assign(data, {
      _declaration: { _attributes: { version: '1.0', encoding: 'utf-8' } },
    });
    Object.assign(data, dataObject);
    return convert.js2xml(data, {
      compact: true,
      ignoreComment: true,
      spaces: 4,
      fullTagEmptyElement: true,
      textFn: function (val, label) {
        const omits = ['version'];
        if (/^\d+\.\d+$/.test(val) && !omits.includes(label.toLowerCase())) {
          return parseFloat(val).toFixed(2);
        }
        return val;
      },
    });
  };
  xml2Json = <T>(xml: string) => {
    try {
      return convert.xml2js(xml, {
        compact: true,
        ignoreComment: true,
        nativeType: false,
      }) as T;
    } catch (err) {
      throw new Error(`Error converting xml to json: ${err}`);
    }
  };
}

export default Transformer;

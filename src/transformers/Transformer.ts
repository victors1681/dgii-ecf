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
    });
  };
}

export default Transformer;

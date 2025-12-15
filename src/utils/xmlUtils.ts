import { XMLParser, XMLBuilder } from 'fast-xml-parser';

export const jsonToXml = (json: object): string => {
  const builder = new XMLBuilder({
    format: true,
    ignoreAttributes: false,
    suppressEmptyNode: true,
  });
  // Wrap in root to ensure valid XML if the JSON is an array or simple object that might not map 1:1 to a single root
  // However, users usually expect direct mapping. Let's try direct first. 
  // If json is not valid for direct conversion builder might throw or produce invalid XML if it has multiple roots but we'll see.
  // Actually, standard practice for arbitrary JSON to XML often involves ensuring a single root.
  // But let's assume the user inputs an object that can be root, or we wrap it if needed. 
  // For now, simple builder.
  return builder.build(json);
};

export const xmlToJson = (xml: string): object => {
  const parser = new XMLParser({
    ignoreAttributes: false,
    parseAttributeValue: true,
  });
  return parser.parse(xml);
};

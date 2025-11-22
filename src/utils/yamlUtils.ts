export function yamlToJson(yaml: string): any {
    const lines = yaml.split('\n').filter((l) => l.trim() && !l.trim().startsWith('#'));
    const result: any = {};
    const stack: Array<{ obj: any; indent: number }> = [{ obj: result, indent: -1 }];
  
    lines.forEach((line) => {
      const indent = line.search(/\S/);
      const trimmed = line.trim();
      
      while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
        stack.pop();
      }
  
      if (trimmed.includes(':')) {
        const [key, ...valueParts] = trimmed.split(':');
        const value = valueParts.join(':').trim();
        const cleanKey = key.trim();
        
        if (value === '' || value === '{}' || value === '[]') {
          stack[stack.length - 1].obj[cleanKey] = value === '[]' ? [] : {};
          stack.push({ obj: stack[stack.length - 1].obj[cleanKey], indent });
        } else {
          let parsed: any = value;
          if (value === 'true') parsed = true;
          else if (value === 'false') parsed = false;
          else if (value === 'null') parsed = null;
          else if (!isNaN(Number(value)) && value !== '') parsed = Number(value);
          
          stack[stack.length - 1].obj[cleanKey] = parsed;
        }
      }
    });
  
    return result;
  }
  
  export function jsonToYaml(obj: any, indentSpaces: number = 2, useTab: boolean = false): string {
    const getIndent = (level: number) => 
      useTab ? '\t'.repeat(level) : ' '.repeat(indentSpaces * level);
  
    const convert = (o: any, level: number = 0): string => {
      const spaces = getIndent(level);
      let out = '';
      
      if (Array.isArray(o)) {
        o.forEach((it) => {
          if (typeof it === 'object' && it !== null) {
            out += `${spaces}-\n${convert(it, level + 1)}`;
          } else {
            out += `${spaces}- ${it}\n`;
          }
        });
      } else if (typeof o === 'object' && o !== null) {
        Object.entries(o).forEach(([k, v]) => {
          if (typeof v === 'object' && v !== null) {
            out += `${spaces}${k}:\n${convert(v, level + 1)}`;
          } else {
            out += `${spaces}${k}: ${v}\n`;
          }
        });
      } else {
        out += `${spaces}${o}\n`;
      }
      
      return out;
    };
    
    return convert(obj);
  }
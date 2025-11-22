export interface Tool {
    id: string;
    name: string;
    category: string;
    icon: any;
    desc: string;
  }
  
  export interface ToolCategory {
    name: string;
    items: Tool[];
  }
  
  export interface ThemeContextType {
    darkMode: boolean;
    toggleDarkMode: () => void;
  }
  
  export interface CurlFlags {
    verbose: boolean;
    includeHeaders: boolean;
    insecure: boolean;
  }
  
  export interface RegexFlags {
    g: boolean;
    i: boolean;
    m: boolean;
    s: boolean;
  }
  
  export interface DiffRow {
    type: 'equal' | 'add' | 'delete' | 'modify';
    left: string;
    right: string;
    leftTokens?: Array<{ text: string; removed?: boolean }> | null;
    rightTokens?: Array<{ text: string; added?: boolean }> | null;
  }
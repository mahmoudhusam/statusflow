export type ToolParameterType = 'string' | 'number' | 'boolean';

export interface ToolParameter {
  name: string;
  type: ToolParameterType;
  description: string;
  required: boolean;
}

export interface Tool {
  name: string;
  description: string; 
  parameters: ToolParameter[];
  execute(args: Record<string, unknown>): Promise<string>; 
}

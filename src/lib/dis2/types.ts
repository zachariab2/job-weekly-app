export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
export type JsonObject = { [key: string]: JsonValue };

export type Dis2Item = JsonObject;

export interface Dis2ApiResponse {
  items: Dis2Item[];
}

import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AST, PatchSet } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const patchOpSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    op: { type: Type.STRING, enum: ["add", "replace", "remove", "move"] },
    path: { type: Type.STRING, description: "JSON-Patch path, e.g., /nodes/{id}/children/-" },
    value: { 
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING },
        type: { type: Type.STRING },
        // Use ARRAY of KV pairs to satisfy "non-empty object" schema constraint
        props: { 
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
               name: { type: Type.STRING },
               value: { type: Type.STRING }
            },
            required: ["name", "value"]
          }
        },
        children: { type: Type.ARRAY, items: { type: Type.STRING } },
        parentId: { type: Type.STRING },
        isCollapsed: { type: Type.BOOLEAN }
      },
      description: "The value to add or replace. For 'add', this must be a full Node object with a unique ID."
    },
    from: { type: Type.STRING }
  },
  required: ["op", "path"]
};

const patchSetSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    timestamp: { type: Type.NUMBER },
    author: { type: Type.STRING, enum: ["ai"] },
    description: { type: Type.STRING },
    ops: { 
      type: Type.ARRAY, 
      items: patchOpSchema
    },
    requiresConfirmation: { type: Type.BOOLEAN }
  },
  required: ["id", "timestamp", "author", "description", "ops"]
};

const verificationSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    satisfied: { type: Type.BOOLEAN },
    reason: { type: Type.STRING },
    fixCommand: { type: Type.STRING, description: "If satisfied is false, provide a new natural language command to fix the issue." }
  },
  required: ["satisfied", "reason"]
};

export async function generatePatchFromInput(input: string, ast: AST): Promise<PatchSet | null> {
  const model = "gemini-3-flash-preview";
  
  const contextSummary = Object.values(ast.nodes).map(n => ({
    id: n.id,
    type: n.type,
    parentId: n.parentId,
    props: n.props
  }));

  const prompt = `
    Current App State (Nodes):
    ${JSON.stringify(contextSummary, null, 2)}

    User Request: "${input}"

    Instructions:
    1. Generate a PatchSet to fulfill the request.
    2. Use 'op': 'add' to insert new nodes. New nodes MUST have a unique UUID (generate one).
    3. Use 'op': 'replace' to update props.
    4. Use 'op': 'remove' to delete nodes.
    5. TARGETING: Always try to add content to a 'region' or 'container' if possible.
    6. If the user asks for something vague like "add a button", pick a logical parent (like a header or main region).
    7. If the request is destructive (delete, clear), set requiresConfirmation: true.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: patchSetSchema,
        systemInstruction: "You are a UIX XML Builder Engine. You mutate the UI AST via JSON Patches."
      }
    });

    if (response.text) {
      const rawPatch = JSON.parse(response.text) as any;
      
      // Post-process to convert props array back to object structure required by application
      if (rawPatch.ops) {
        rawPatch.ops.forEach((op: any) => {
          if (op.value) {
            // 1. Convert props array [{name, value}] -> Object {name: value}
            if (Array.isArray(op.value.props)) {
              const propsObj: Record<string, any> = {};
              op.value.props.forEach((p: any) => {
                propsObj[p.name] = p.value;
              });
              op.value.props = propsObj;
            }

            // 2. Unwrap for 'replace' props actions
            // The schema wraps props in a 'value' object, but patch engine expects direct object for prop replacement
            if (op.op === 'replace' && op.path.endsWith('/props') && op.value.props) {
              op.value = op.value.props;
            }

            // 3. Ensure children is initialized for add operations
            if (op.op === 'add' && !op.value.children) {
              op.value.children = [];
            }
          }
        });
      }

      return rawPatch as PatchSet;
    }
  } catch (error) {
    console.error("AI Generation Failed:", error);
  }
  return null;
}

export async function verifyIntention(command: string, xmlSnapshot: string): Promise<{ satisfied: boolean; reason: string; fixCommand?: string }> {
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    User Command: "${command}"
    
    Resulting XML:
    ${xmlSnapshot}

    Task:
    Check if the XML reasonably implements the User Command.
    Strictly check for attributes (color, label, etc) mentioned in the command.
    If it fails, provide a 'fixCommand' that I can feed back into the system to correct it.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: verificationSchema
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
  } catch (e) {
    console.error("Verification failed", e);
  }
  return { satisfied: true, reason: "Verification system offline" };
}

import { createLLMProvider } from "./providers";
import 'dotenv/config';
async function main() {
    const llm = createLLMProvider();
    const response = await llm.chat([
        { role: 'user', content: 'Say "StatusFlow MCP online!" and nothing else.' }
    ]);
    console.log(response);
}
main()
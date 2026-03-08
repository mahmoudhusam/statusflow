import { Agent } from './agent';
import * as readline from 'readline';

export class CLI {
  private agent: Agent;

  constructor(agent: Agent) {
    this.agent = agent;
  }

  async start(): Promise<void> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    // wrap rl.question in a Promise so we can await it in a while loop
    const ask = (prompt: string): Promise<string> => {
      return new Promise((resolve) => {
        rl.question(prompt, (answer) => {
          resolve(answer);
        });
      });
    };

    // handle Ctrl+C gracefully
    rl.on('SIGINT', () => {
      console.log('\n\nGoodbye! 👋');
      rl.close();
      process.exit(0);
    });

    console.log(`
╔══════════════════════════════════════╗
║     StatusFlow AI Agent 🚀           ║
║     Type your question or command    ║
║     Type 'exit' to quit              ║
╚══════════════════════════════════════╝
`);

    while (true) {
      const query = (await ask('You: ')).trim();

      if (!query) continue;

      if (query.toLowerCase() === 'exit' || query.toLowerCase() === 'quit') {
        console.log('\nGoodbye! 👋');
        rl.close();
        break;
      }

      console.log('─'.repeat(50));
      try {
        const answer = await this.agent.run(query);
        console.log(`🤖 Agent: ${answer}`);
      } catch (error) {
        // catch errors without crashing the loop — user can keep asking
        console.error(
          `⚠️  Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
      console.log('─'.repeat(50) + '\n');
    }
  }
}

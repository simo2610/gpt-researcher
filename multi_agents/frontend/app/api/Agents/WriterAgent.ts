import { Client } from "@langchain/langgraph-sdk";

export class WriterAgent {
  private client: Client;

  constructor() {
    this.client = new Client();
  }

  async writeSection(sectionTitle: string, researchData: any) {
    const prompt = [{
      role: "system",
      content: "You are a writer. Your goal is to write a section of a research report."
    }, {
      role: "user",
      content: `Section title: ${sectionTitle}\nResearch data: ${JSON.stringify(researchData)}\n\nWrite a detailed section based on the research data.`
    }];

    // Assuming the correct method is createRun
    const assistants = await this.client.assistants.search({
      metadata: null,
      offset: 0,
      limit: 10,
    });

    const agent = assistants[0];
    const thread = await this.client.threads.create();
    const messages = [{ role: "human", content: JSON.stringify(prompt) }];

    const run = this.client.runs.create(thread["thread_id"], agent["assistant_id"], { input: { messages } });

    // Poll the run until it completes
    setInterval(async () => {
      try {
        // Supponendo che `thread["thread_id"]` e `run["run_id"]` siano valori validi e definiti
        const threadId = thread["thread_id"];
        const runId = run["run_id"];

        // Risolvi la promessa e ottieni l'oggetto `Run`
        let finalRunStatus = await this.client.runs.get(threadId, runId);
        console.log('finalRunStatus in WriterAgent.ts:', finalRunStatus);

        if (finalRunStatus.status === "failed") {
          throw new Error(`Run failed with message: ${finalRunStatus.message}`);
        } else if (finalRunStatus.status === "success") {
          console.log('Run completed successfully', finalRunStatus);

          // Ottieni i risultati finali
          const results = await this.client.runs.listEvents(threadId, runId);

          // I risultati sono ordinati per tempo, quindi il passaggio più recente è l'indice 0
          const finalResult = results[0];
          const finalMessages = (finalResult.data as Record<string, any>)["output"]["messages"];
          const finalMessageContent = finalMessages[finalMessages.length - 1].content;

          // Assicurati che la risposta sia una stringa JSON valida
          if (typeof finalMessageContent === 'string') {
            return JSON.parse(finalMessageContent);
          } else {
            console.error("Response is not a valid JSON string:", finalMessageContent);
            throw new Error("Invalid JSON response");
          }
        }
      } catch (error) {
        console.error("Error in WriterAgent.ts:", error);
      }
    }, 5000); // Polling every 5 seconds


  }
}
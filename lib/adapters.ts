/** Server-only integration contracts. Never import credentials into client components. */
import type { Knowledge, Person, Project } from './types';
export interface KnowledgeConnector { id:string; fetchDocuments(cursor?:string):Promise<{documents:Knowledge[];nextCursor?:string}>; }
export interface SearchProvider { search(question:string,person:Person,project:Project):Promise<Knowledge[]>; }
export interface AnswerProvider { answer(question:string,evidence:Knowledge[]):Promise<{text:string;citationIds:string[];gap:boolean}>; }
export interface TicketProvider { create(input:{idempotencyKey:string;projectKey:string;summary:string;description:string}):Promise<{key:string;url?:string}>; }
export class IntegrationNotConfigured extends Error {constructor(name:string){super(`${name} is not configured. Configure and validate its server-side adapter before enabling live mode.`);}}
export const azureRequirements = {
 search:['AZURE_SEARCH_ENDPOINT','AZURE_SEARCH_API_KEY','AZURE_SEARCH_INDEX'],
 ai:['AZURE_OPENAI_ENDPOINT','AZURE_OPENAI_API_KEY','AZURE_OPENAI_DEPLOYMENT'],
 database:['AZURE_POSTGRES_CONNECTION_STRING'],
 jira:['JIRA_BASE_URL','JIRA_EMAIL','JIRA_API_TOKEN','JIRA_PROJECT_KEY','JIRA_ISSUE_TYPE_ID'],
};
/** Explicit placeholders fail closed rather than silently claiming a live connection. */
export class AzureSearchPlaceholder implements SearchProvider {async search():Promise<Knowledge[]>{throw new IntegrationNotConfigured('Azure AI Search');}}
export class AzureOpenAIPlaceholder implements AnswerProvider {async answer():Promise<{text:string;citationIds:string[];gap:boolean}>{throw new IntegrationNotConfigured('Azure OpenAI');}}
export class JiraPlaceholder implements TicketProvider {async create():Promise<{key:string;url?:string}>{throw new IntegrationNotConfigured('Jira');}}

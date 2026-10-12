import { OpenAIQuestionProvider } from './openai-provider';
import { ProviderConfigurationError } from './provider-errors';
export { ProviderConfigurationError } from './provider-errors';
import type { Knowledge, Project } from './types';
import { resolvePermittedQuestion, type Resolution } from './engine';

/** Only server-filtered evidence reaches a retrieval provider. Team selection is
 * not an access grant; the route supplies eligibleKnowledge for the current persona.
 * A live provider must ground each answer in these sources and return their IDs.
 */
export interface QuestionProvider {
 resolve(input:{question:string;project:Project;knowledge:Knowledge[]}):Promise<Resolution>;
}
const demoQuestionProvider:QuestionProvider={
 async resolve({question,project,knowledge}){return resolvePermittedQuestion(project,question,knowledge);},
};

export function getQuestionProvider(mode=process.env.MASTERMIND_RETRIEVAL_PROVIDER??'demo'):QuestionProvider {
 if(mode==='demo')return demoQuestionProvider;
 if(mode==='openai')return new OpenAIQuestionProvider({apiKey:process.env.OPENAI_API_KEY??'',model:process.env.OPENAI_MODEL??'gpt-4.1-mini'});
 if(mode==='azure')throw new ProviderConfigurationError('Azure retrieval is not connected yet. Use the demo provider until the Azure adapter is implemented and configured.');
 throw new ProviderConfigurationError('The configured retrieval provider is unavailable.');
}
// Jira is explicitly simulated by the workflow today. A real adapter must consume
// a persisted outbox after the workspace transaction commits and use request ID as
// its idempotency key. Do not create external issues inside an optimistic-save retry.

export function questionProviderStatus(){
 const mode=process.env.MASTERMIND_RETRIEVAL_PROVIDER??'demo';
 return {mode,label:mode==='openai'?(process.env.OPENAI_API_KEY?.trim()?'OpenAI · sample sources':'OpenAI · key needed'):mode==='azure'?'Azure · not connected':'Curated sources',configured:mode==='demo'||(mode==='openai'&&!!process.env.OPENAI_API_KEY?.trim())};
}

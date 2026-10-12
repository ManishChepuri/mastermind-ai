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
export class ProviderConfigurationError extends Error {}
export function getQuestionProvider(mode=process.env.MASTERMIND_RETRIEVAL_PROVIDER??'demo'):QuestionProvider {
 if(mode==='demo')return demoQuestionProvider;
 if(mode==='azure')throw new ProviderConfigurationError('Azure retrieval is not connected yet. Use the demo provider until the Azure adapter is implemented and configured.');
 throw new ProviderConfigurationError('The configured retrieval provider is unavailable.');
}
// Jira is explicitly simulated by the workflow today. A real adapter must consume
// a persisted outbox after the workspace transaction commits and use request ID as
// its idempotency key. Do not create external issues inside an optimistic-save retry.

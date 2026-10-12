import { demoScenario } from './demo-scenario';
export const externalProjects = [
 {externalId:'FRD-204',name:'Fraud Scoring Service',description:demoScenario.projectContext,ownerTeam:'fraud' as const,stage:'Development',selectedTeams:['platform','security','network','data','observability'] as const},
 {externalId:'PAY-118',name:'Settlement Insights API',description:'A reporting API for settlement operations, integrating platform services and governed analytical datasets.',ownerTeam:'fraud' as const,stage:'Integration',selectedTeams:['platform','data','network'] as const},
 {externalId:'FRD-312',name:'Risk Signals Gateway',description:'An existing initiative to consolidate risk signals into a shared application gateway.',ownerTeam:'fraud' as const,stage:'Discovery',selectedTeams:['platform','security','network'] as const},
];

/** Fictional presentation content. This is a reply draft, never pre-approved knowledge. */
export const demoScenario = {
 question:'What access does our VM need to read restricted transaction data?',
 goal:'Connect an environment safely to restricted transaction data.',
 projectContext:'Fraud Scoring Service needs an environment that can safely read restricted transaction data. Alex Chen has an existing deployment pipeline, but needs Security Architecture to confirm the access controls and approvals before requesting deployment.',
 securityAnswer:'For this fictional Fraud Scoring Service scenario, use a managed identity with least-privilege read access. Obtain Data Governance approval for the dataset and Security Architecture approval for the access policy. Keep the VM on the approved private network and enable access logging. Use synthetic data until these approvals are complete. Next action: include the approved identity, dataset, network zone, and approval references in the infrastructure request to Platform. This guidance does not provision resources or grant access.',
};

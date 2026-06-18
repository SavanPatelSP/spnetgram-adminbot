export const SENSITIVE_ACTIONS = {
  PERMANENT_BAN: {
    actionType: 'PERMANENT_BAN',
    title: 'Permanent User Ban',
    description: 'Permanently bans a user from the platform',
    requiredApprovals: 1,
    approvalRoles: ['MANAGER', 'DEPARTMENT_HEAD', 'ADMINISTRATOR'],
  },
  PREMIUM_REMOVE: {
    actionType: 'PREMIUM_REMOVE',
    title: 'Premium Removal',
    description: 'Removes premium subscription from a user',
    requiredApprovals: 1,
    approvalRoles: ['MANAGER', 'DEPARTMENT_HEAD'],
  },
  PREMIUM_LIFETIME: {
    actionType: 'PREMIUM_LIFETIME',
    title: 'Lifetime Premium Grant',
    description: 'Grants lifetime premium subscription to a user',
    requiredApprovals: 2,
    approvalRoles: ['DEPARTMENT_HEAD', 'ADMINISTRATOR', 'CEO'],
  },
  LARGE_TRANSACTION: {
    actionType: 'LARGE_TRANSACTION',
    title: 'Large Economy Transaction',
    description: 'Processes an economy transaction exceeding the threshold',
    requiredApprovals: 1,
    approvalRoles: ['MANAGER', 'DEPARTMENT_HEAD'],
  },
  GLOBAL_BROADCAST: {
    actionType: 'GLOBAL_BROADCAST',
    title: 'Global Broadcast',
    description: 'Sends a broadcast message to all users',
    requiredApprovals: 1,
    approvalRoles: ['ADMINISTRATOR', 'CEO'],
  },
  SECURITY_LOCKDOWN: {
    actionType: 'SECURITY_LOCKDOWN',
    title: 'Security Lockdown',
    description: 'Activates or deactivates emergency security lockdown',
    requiredApprovals: 1,
    approvalRoles: ['ADMINISTRATOR', 'CEO', 'SECURITY_LEAD'],
  },
} as const

export type SensitiveActionType = keyof typeof SENSITIVE_ACTIONS

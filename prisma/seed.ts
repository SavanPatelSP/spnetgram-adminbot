import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Roles
  const roles = [
    { name: 'SUPPORT_AGENT', label: 'Support Agent', isSystem: true, priority: 10 },
    { name: 'SENIOR_SUPPORT', label: 'Senior Support', isSystem: true, priority: 20 },
    { name: 'SUPPORT_MANAGER', label: 'Support Manager', isSystem: true, priority: 30 },
    { name: 'ADMIN', label: 'Administrator', isSystem: true, priority: 40 },
    { name: 'EXECUTIVE', label: 'Executive', isSystem: true, priority: 50 },
    { name: 'SECURITY_ANALYST', label: 'Security Analyst', isSystem: true, priority: 25 },
    { name: 'SECURITY_LEAD', label: 'Security Lead', isSystem: true, priority: 35 },
    { name: 'MONITORING_OPERATOR', label: 'Monitoring Operator', isSystem: true, priority: 15 },
    { name: 'INCIDENT_RESPONDER', label: 'Incident Responder', isSystem: true, priority: 25 },
    { name: 'INCIDENT_COMMANDER', label: 'Incident Commander', isSystem: true, priority: 35 },
    { name: 'COMPLIANCE_OFFICER', label: 'Compliance Officer', isSystem: true, priority: 30 },
    { name: 'ANALYTICS_VIEWER', label: 'Analytics Viewer', isSystem: true, priority: 10 },
    { name: 'AUDIT_MANAGER', label: 'Audit Manager', isSystem: true, priority: 30 },
  ]

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name as any },
      update: {},
      create: role,
    })
  }
  console.log(`✓ ${roles.length} roles seeded`)

  // Permissions
  const resources = ['USERS', 'STAFF', 'MODERATION', 'CASES', 'TICKETS', 'SLA', 'AUDIT', 'INVESTIGATIONS', 'NOTIFICATIONS', 'SETTINGS', 'DEPARTMENTS', 'PREMIUM', 'ECONOMY', 'KPI', 'APPROVALS', 'SECURITY', 'MONITORING', 'INCIDENTS', 'ANALYTICS', 'SYNC', 'DASHBOARD']
  const actions = ['CREATE', 'READ', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'ASSIGN', 'ESCALATE']
  let permCount = 0

  for (const resource of resources) {
    for (const action of actions) {
      const exists = await prisma.permission.findUnique({
        where: { resource_action: { resource: resource as any, action: action as any } },
      })
      if (!exists) {
        await prisma.permission.create({
          data: {
            resource: resource as any,
            action: action as any,
            label: `${action} ${resource}`,
            isSystem: true,
          },
        })
        permCount++
      }
    }
  }
  console.log(`✓ ${permCount} permissions seeded (${resources.length * actions.length} total)`)

  // Assign all permissions to ADMIN, EXECUTIVE, SECURITY_LEAD, INCIDENT_COMMANDER roles
  const allPermissions = await prisma.permission.findMany()
  const fullAccessRoles = ['ADMIN', 'EXECUTIVE']
  const securityRoles = ['SECURITY_LEAD', 'INCIDENT_COMMANDER']
  const analyticsRoles = ['ANALYTICS_VIEWER']

  for (const roleName of fullAccessRoles) {
    const role = await prisma.role.findUnique({ where: { name: roleName as any } })
    if (role) {
      for (const perm of allPermissions) {
        const existing = await prisma.rolePermission.findUnique({
          where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
        })
        if (!existing) {
          await prisma.rolePermission.create({
            data: { roleId: role.id, permissionId: perm.id },
          })
        }
      }
    }
  }
  console.log(`✓ Permissions assigned to ${fullAccessRoles.join(', ')} roles`)

  for (const roleName of securityRoles) {
    const role = await prisma.role.findUnique({ where: { name: roleName as any } })
    if (role) {
      const relevantResources = ['SECURITY', 'MONITORING', 'INCIDENTS', 'USERS', 'CASES', 'NOTIFICATIONS']
      const perms = allPermissions.filter(p => relevantResources.includes(p.resource))
      for (const perm of perms) {
        const existing = await prisma.rolePermission.findUnique({
          where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
        })
        if (!existing) {
          await prisma.rolePermission.create({
            data: { roleId: role.id, permissionId: perm.id },
          })
        }
      }
    }
  }
  console.log(`✓ Permissions assigned to ${securityRoles.join(', ')} roles`)

  for (const roleName of analyticsRoles) {
    const role = await prisma.role.findUnique({ where: { name: roleName as any } })
    if (role) {
      const perms = allPermissions.filter(p => ['ANALYTICS', 'DASHBOARD'].includes(p.resource) && p.action === 'READ')
      for (const perm of perms) {
        const existing = await prisma.rolePermission.findUnique({
          where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
        })
        if (!existing) {
          await prisma.rolePermission.create({
            data: { roleId: role.id, permissionId: perm.id },
          })
        }
      }
    }
  }
  console.log(`✓ Permissions assigned to ${analyticsRoles.join(', ')} roles`)

  // Premium Plans
  const plans = [
    { name: 'Monthly', tier: 'BASIC', price: 9.99, interval: 'monthly', maxStaff: 5, maxCases: 50, features: ['basic_support', 'case_management', 'ticket_system'] },
    { name: 'Quarterly', tier: 'PRO', price: 24.99, interval: 'quarterly', maxStaff: 15, maxCases: 200, features: ['basic_support', 'case_management', 'ticket_system', 'advanced_analytics', 'priority_support'] },
    { name: 'Annual', tier: 'PRO', price: 79.99, interval: 'yearly', maxStaff: 30, maxCases: 500, features: ['basic_support', 'case_management', 'ticket_system', 'advanced_analytics', 'priority_support', 'api_access'] },
    { name: 'Lifetime', tier: 'ENTERPRISE', price: 299.99, interval: 'lifetime', maxStaff: 100, maxCases: 9999, features: ['basic_support', 'case_management', 'ticket_system', 'advanced_analytics', 'priority_support', 'api_access', 'custom_integrations', 'dedicated_manager'] },
  ]

  for (const plan of plans) {
    await prisma.premiumPlan.upsert({
      where: { name: plan.name },
      update: {},
      create: plan,
    })
  }
  console.log(`✓ ${plans.length} premium plans seeded`)

  // Departments
  const departments = [
    { name: 'Support', type: 'SUPPORT' },
    { name: 'Moderation', type: 'MODERATION' },
    { name: 'Security', type: 'MODERATION' },
    { name: 'Community', type: 'SUPPORT' },
    { name: 'Premium', type: 'SUPPORT' },
    { name: 'Economy', type: 'ADMINISTRATION' },
    { name: 'Bot Operations', type: 'ENGINEERING' },
    { name: 'Product', type: 'ENGINEERING' },
    { name: 'Executive', type: 'ADMINISTRATION' },
  ]

  for (const dept of departments) {
    const existing = await prisma.department.findUnique({ where: { name: dept.name } })
    if (!existing) {
      await prisma.department.create({ data: dept })
    }
  }
  console.log(`✓ ${departments.length} departments seeded`)

  console.log('\nSeed completed successfully!')
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

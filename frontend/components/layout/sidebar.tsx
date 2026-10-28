'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAccount } from 'wagmi'
import { cn } from '@/lib/utils'
import { HARDHAT_ACCOUNTS } from '@/lib/constants'
import {
  LayoutDashboard,
  FileText,
  Building2,
  ShieldCheck,
  BarChart3,
  Activity,
  BookOpen,
  Store,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useState } from 'react'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  roles?: string[]
}

const navItems: NavItem[] = [
  {
    label: 'Supplier',
    href: '/supplier',
    icon: <FileText size={20} />,
    roles: ['supplier'],
  },
  {
    label: 'Marketplace',
    href: '/marketplace',
    icon: <Store size={20} />,
    roles: ['financier'],
  },
  {
    label: 'Financier',
    href: '/financier',
    icon: <Building2 size={20} />,
    roles: ['financier'],
  },
  {
    label: 'Admin',
    href: '/admin',
    icon: <ShieldCheck size={20} />,
    roles: ['admin'],
  },
  {
    label: 'Analytics',
    href: '/analytics',
    icon: <BarChart3 size={20} />,
  },
  {
    label: 'Activity',
    href: '/activity',
    icon: <Activity size={20} />,
  },
  {
    label: 'Documentation',
    href: '/docs',
    icon: <BookOpen size={20} />,
  },
]

function getUserRole(address: string | undefined): string[] {
  if (!address) return []
  const addr = address.toLowerCase()
  const roles: string[] = []

  if (addr === HARDHAT_ACCOUNTS.admin.toLowerCase()) roles.push('admin', 'supplier', 'financier')
  if (addr === HARDHAT_ACCOUNTS.verifier.toLowerCase()) roles.push('admin')
  if (addr === HARDHAT_ACCOUNTS.supplier1.toLowerCase() || addr === HARDHAT_ACCOUNTS.supplier2.toLowerCase()) roles.push('supplier')
  if (addr === HARDHAT_ACCOUNTS.financier1.toLowerCase() || addr === HARDHAT_ACCOUNTS.financier2.toLowerCase()) roles.push('financier')
  if (addr === HARDHAT_ACCOUNTS.demoPayer.toLowerCase()) roles.push('supplier', 'financier')

  // For demo: any unknown wallet can be a supplier
  if (roles.length === 0) roles.push('supplier')

  return roles
}

export function Sidebar() {
  const pathname = usePathname()
  const { address } = useAccount()
  const [collapsed, setCollapsed] = useState(false)
  const userRoles = getUserRole(address)

  // For seamless prototype exploration, show all navigation portals
  const filteredItems = navItems

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen z-40 flex flex-col',
        'bg-bg-surface border-r border-border-default',
        'transition-all duration-300 ease-in-out',
        collapsed ? 'w-[68px]' : 'w-[240px]'
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-border-default">
        <Link href="/" className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center shrink-0">
            <LayoutDashboard size={16} className="text-white" />
          </div>
          {!collapsed && (
            <span className="text-lg font-bold gradient-text whitespace-nowrap">
              CapitalFlow
            </span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {filteredItems.map(item => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg',
                'transition-all duration-200 group',
                'text-sm font-medium',
                isActive
                  ? 'bg-accent-primary-muted text-accent-primary'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
              )}
              title={collapsed ? item.label : undefined}
            >
              <span className={cn(
                'shrink-0 transition-colors',
                isActive ? 'text-accent-primary' : 'text-text-muted group-hover:text-text-secondary'
              )}>
                {item.icon}
              </span>
              {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
              {isActive && !collapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent-primary" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Role indicator */}
      {!collapsed && address && (
        <div className="px-4 py-3 border-t border-border-default">
          <div className="text-xs text-text-muted mb-1">Active Roles</div>
          <div className="flex flex-wrap gap-1">
            {userRoles.map(role => (
              <span
                key={role}
                className="px-2 py-0.5 rounded-full text-xs font-medium bg-bg-hover text-text-secondary capitalize"
              >
                {role}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={cn(
          'flex items-center justify-center h-10',
          'border-t border-border-default',
          'text-text-muted hover:text-text-secondary hover:bg-bg-hover',
          'transition-colors'
        )}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </aside>
  )
}

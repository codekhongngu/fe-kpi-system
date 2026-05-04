import React from 'react'
import { useNavigate } from '@tanstack/react-router'
import { ArrowRight, ChevronRight, Laptop, Moon, Sun } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useSearch } from '@/context/search-provider'
import { useTheme } from '@/context/theme-provider'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { getSidebarNavGroupsForUser } from './layout/data/sidebar-data'
import { ScrollArea } from './ui/scroll-area'
import { useAuthStore } from '@/stores/auth-store'
import { apiClient } from '@/lib/api-client'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function getRoleIds(user: unknown): string[] {
  if (isRecord(user)) {
    const roleIds = user.roleIds
    if (Array.isArray(roleIds)) {
      return roleIds.filter((item): item is string => typeof item === 'string')
    }
  }
  return []
}

function isUuidLike(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  )
}

async function fetchRolesById(): Promise<Record<string, string>> {
  try {
    const response = await apiClient.get<unknown>('/roles', {
      params: { page: 1, limit: 500 },
    })
    const payload = response.data as any
    const list = Array.isArray(payload) ? payload : payload?.data ?? payload?.items ?? []
    return Object.fromEntries(
      (Array.isArray(list) ? list : []).flatMap((item: any) => {
        const id = typeof item?.id === 'string' ? item.id : ''
        const code =
          typeof item?.code === 'string'
            ? item.code
            : typeof item?.name === 'string'
              ? item.name
              : ''
        return id && code ? ([[id, code]] as const) : []
      })
    )
  } catch {
    const response = await apiClient.get<unknown>('/role-groups', {
      params: { page: 1, limit: 500 },
    })
    const payload = response.data as any
    const list = Array.isArray(payload) ? payload : payload?.data ?? payload?.items ?? []
    return Object.fromEntries(
      (Array.isArray(list) ? list : []).flatMap((item: any) => {
        const id = typeof item?.id === 'string' ? item.id : ''
        const code =
          typeof item?.code === 'string'
            ? item.code
            : typeof item?.name === 'string'
              ? item.name
              : ''
        return id && code ? ([[id, code]] as const) : []
      })
    )
  }
}

export function CommandMenu() {
  const navigate = useNavigate()
  const { setTheme } = useTheme()
  const { open, setOpen } = useSearch()
  const authUser = useAuthStore((state) => state.auth.user)
  const roleIds = getRoleIds(authUser)
  const needsRoleLookup = roleIds.length > 0 && roleIds.every(isUuidLike)

  const rolesQuery = useQuery({
    queryKey: ['rolesById'],
    queryFn: fetchRolesById,
    enabled: needsRoleLookup,
    staleTime: 60_000,
  })

  const rolesById = rolesQuery.data ?? {}
  const navGroups = getSidebarNavGroupsForUser(
    authUser,
    needsRoleLookup ? rolesById : undefined
  )

  const runCommand = React.useCallback(
    (command: () => unknown) => {
      setOpen(false)
      command()
    },
    [setOpen]
  )

  return (
    <CommandDialog modal open={open} onOpenChange={setOpen}>
      <CommandInput placeholder='Type a command or search...' />
      <CommandList>
        <ScrollArea type='hover' className='h-72 pe-1'>
          <CommandEmpty>No results found.</CommandEmpty>
          {navGroups.map((group) => (
            <CommandGroup key={group.title} heading={group.title}>
              {group.items.map((navItem, i) => {
                if (navItem.url)
                  return (
                    <CommandItem
                      key={`${navItem.url}-${i}`}
                      value={navItem.title}
                      onSelect={() => {
                        runCommand(() => navigate({ to: navItem.url }))
                      }}
                    >
                      <div className='flex size-4 items-center justify-center'>
                        <ArrowRight className='size-2 text-muted-foreground/80' />
                      </div>
                      {navItem.title}
                    </CommandItem>
                  )

                return navItem.items?.map((subItem, i) => (
                  <CommandItem
                    key={`${navItem.title}-${subItem.url}-${i}`}
                    value={`${navItem.title}-${subItem.url}`}
                    onSelect={() => {
                      runCommand(() => navigate({ to: subItem.url }))
                    }}
                  >
                    <div className='flex size-4 items-center justify-center'>
                      <ArrowRight className='size-2 text-muted-foreground/80' />
                    </div>
                    {navItem.title} <ChevronRight /> {subItem.title}
                  </CommandItem>
                ))
              })}
            </CommandGroup>
          ))}
          <CommandSeparator />
          <CommandGroup heading='Theme'>
            <CommandItem onSelect={() => runCommand(() => setTheme('light'))}>
              <Sun /> <span>Light</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => setTheme('dark'))}>
              <Moon className='scale-90' />
              <span>Dark</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => setTheme('system'))}>
              <Laptop />
              <span>System</span>
            </CommandItem>
          </CommandGroup>
        </ScrollArea>
      </CommandList>
    </CommandDialog>
  )
}

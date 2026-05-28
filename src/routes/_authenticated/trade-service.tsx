import { createFileRoute } from '@tanstack/react-router'
import { TradeServicePage } from '@/features/dashboard/pages/kt-xh/trade-service'
import { ktXhDashboardSearchSchema } from '@/features/dashboard/utils/kt-xh-route-search-schema'

export const Route = createFileRoute('/_authenticated/trade-service')({
  validateSearch: ktXhDashboardSearchSchema,
  component: TradeServicePage,
})

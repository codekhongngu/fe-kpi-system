import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { MyAssignmentsPage } from '@/features/submission'

const assignmentsSearchSchema = z.object({
  assignmentId: z.string().optional(),
  status: z.string().optional(),
  q: z.string().optional(),
  page: z.number().optional().catch(1),
  limit: z.number().optional().catch(20),
})

export const Route = createFileRoute('/_authenticated/my/assignments/')({
  validateSearch: assignmentsSearchSchema,
  component: MyAssignmentsPage,
})

# Report Campaign Summary View Spec

## 1. Goal

Create a new report-management page to replace the current `preview` tab behavior.
The new page must:

- show the report structure
- show configured default values
- show aggregated data after summary
- show the list of submitted data coming from approved assignments
- show the aggregation status for each data row
- show the input units for each indicator, derived from campaign scopes

This view is not a template-only preview. It is a read-only summary workspace for a report campaign.

## 2. Current State

`report-details-page.tsx` currently renders the `preview` tab with `TemplatePreviewMatrix`.
That component only displays the template structure and header tree.

Missing pieces in the current flow:

- no default values are rendered
- no assignment data is rendered
- no aggregation status is shown
- no mapping from scopes to input units is shown
- no summary output is visible

## 3. Recommended Naming

Recommended page/component naming:

- page component: `ReportCampaignSummaryPage`
- matrix component: `ReportCampaignSummaryMatrix`
- route/tab value: `summary` or `aggregation`
- user facing label: `Tong hop du lieu`

If the current `preview` tab is kept temporarily, it should delegate to the new summary page/component instead of `TemplatePreviewMatrix`.

## 4. Data Sources

The new page should combine these sources:

1. Report detail
- endpoint: `GET /report-campaigns/:id`
- provides campaign metadata, templateId/formId, period, status, deadlines

2. Campaign scopes
- endpoint: `GET /report-campaigns/:id/scopes`
- used to map each indicator to the list of assigned input units

3. Default values
- endpoint: `GET /report-campaigns/:id/default-values`
- used to preload configured values per indicator/attribute cell

4. Campaign assignments
- endpoint: `GET /report-campaigns/:id/assignments`
- used to list unit progress and determine which assignments are eligible for aggregation

5. Approved submission data
- source: assignment admin view or submission detail for approved assignments
- used to render actual submitted cell values after approval

6. Campaign summary
- endpoint family: `/summaries`
- used to show aggregate output once summary has been created or recomputed

7. Template structure
- endpoint: `GET /forms/:templateId`
- used to build the matrix header and indicator tree

## 5. Core UX Requirements

The page should be read-only.

It should present:

- a top summary area with campaign meta and aggregation state
- a matrix/table area similar to `TemplateMatrixGrid`
- extra columns for aggregation status and input units
- cell-level value resolution from default value and submitted data

The page should be usable for:

- checking the report structure
- checking which defaults were configured
- verifying which units have submitted data
- checking which data has been aggregated
- understanding which units feed each indicator

## 6. Suggested Layout

### 6.1 Top Summary Bar

Show:

- report name
- template name/code
- period name/code
- campaign status
- summary readiness status
- total assignments
- ready assignments
- blocked assignments count

### 6.2 Matrix Area

Use a layout similar to `TemplateMatrixGrid`:

- left sticky tree column for indicator name
- left sticky unit column for indicator unit
- dynamic columns for template attributes/fields
- one extra trailing column for input units
- optional extra column for aggregation status

The matrix should keep the hierarchy and expand/collapse behavior of the template view.

## 7. Column Model

Base columns:

- indicator name
- unit
- template fields / attribute cells

New columns:

- aggregation status
- input units

### Aggregation status

Possible display values:

- not aggregated
- aggregated
- blocked
- pending approval

This value should come from summary readiness, summary data, or assignment status depending on the row context.

### Input units

For each indicator:

- collect related scopes by `indicatorId`
- group them by `orgId`
- render the unit list in the last column

If the list is long, render a compact badge list or a truncated list with tooltip.

## 8. Data Resolution Rules

### 8.1 Cell value precedence

For each indicator/attribute cell:

1. template structure defines whether the cell exists
2. default value fills the initial value
3. approved submission data overrides the default when a unit has submitted data
4. summary data provides the aggregated result, if summary exists

The UI should make the source of each cell value explicit where possible.

### 8.2 Approved submission selection

Only use assignments that are approved according to the report workflow.

Suggested source order:

- district approved
- department approved, if the workflow stops there

This rule should be centralized in a data selector helper to avoid scattering workflow logic in the UI.

### 8.3 Scope to unit mapping

The unit column should be built from campaign scopes:

- scan all scopes
- group by `indicatorId`
- collect unique org names and org ids
- render a stable ordered list

## 9. Component Breakdown

Recommended component split:

1. `ReportCampaignSummaryPage`
- page shell
- query orchestration
- tab/route entry

2. `ReportCampaignSummaryMatrix`
- matrix/table rendering
- expand/collapse tree
- sticky columns
- unit list column

3. `ReportCampaignSummaryCell`
- renders one cell
- handles default value, submitted value, aggregated value, status badge

4. `useReportCampaignSummaryData`
- normalizes API payloads
- builds memoized maps for scopes, defaults, assignments, summary rows

5. `buildCampaignSummaryMatrix`
- converts template + scopes + default values + assignments into a render-ready tree

## 10. State and Query Plan

The page should reuse query keys from `reportQueryKeys` where possible.

Suggested queries:

- `detail(reportId)`
- `assignments(reportId)`
- `scopes(reportId)`
- `defaultValues(reportId)`
- `summaryReadiness(reportId)`
- `campaignSummary(reportId)` or equivalent `/summaries` lookup
- `template(templateId)`

Memoize all derived maps:

- scope map by indicator
- default value map by cell key
- assignment map by org/indicator
- summary result map by cell key

This avoids repeated nested scans across the matrix.

## 11. Migration Plan

1. Add the new summary page/component.
2. Replace the current `preview` tab content with the new page/component.
3. Keep `TemplatePreviewMatrix` for form-management preview only.
4. Move any shared matrix rendering utilities into a common helper if needed.
5. Remove preview-specific assumptions from report details.

## 12. Acceptance Criteria

- The page renders report structure and template hierarchy.
- The page shows default values before aggregation.
- The page shows approved assignment data for each indicator row.
- The page shows summary status per row or per block.
- The last column shows the input units mapped from scopes.
- The page is read-only.
- The current `preview` tab no longer behaves like a template-only viewer.

## 13. Notes

- Keep Vietnamese UI text unchanged in the implementation phase.
- Prefer shared data helpers over ad hoc joins inside JSX.
- Keep the rendering deterministic and memoized, since the matrix may be large.

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  LabelList,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { GrdpChartPoint } from '../utils/use-grdp-display-values'

type GrdpColumnLineChartProps = {
  data: GrdpChartPoint[]
  barColor: string
  lineColor: string
  height?: number
}

function formatBarLabel(value: number) {
  if (!Number.isFinite(value)) return ''
  return value.toLocaleString('vi-VN')
}

function formatYoyLabel(value: number) {
  if (!Number.isFinite(value) || value <= 0) return ''
  return `${value.toLocaleString('vi-VN', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`
}

export function GrdpColumnLineChart({
  data,
  barColor,
  lineColor,
  height = 112,
}: GrdpColumnLineChartProps) {
  return (
    <div className='min-h-0 flex-1 rounded-lg border border-gray-200/20 bg-gray-50 p-1'>
      <ResponsiveContainer width='100%' height={height}>
        <ComposedChart
          data={data}
          margin={{ top: 28, right: 8, left: 0, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray='3 3'
            vertical={false}
            stroke='rgba(0,0,0,0.06)'
          />
          <XAxis
            dataKey='label'
            tick={{ fontSize: 8, fontWeight: 700, fill: '#4B5563' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis yAxisId='value' hide domain={[0, 'auto']} />
          <YAxis yAxisId='percent' hide orientation='right' domain={[0, 'auto']} />
          <Tooltip
            contentStyle={{
              fontSize: 10,
              borderRadius: 6,
              borderColor: 'rgba(0,0,0,0.08)',
            }}
            formatter={(value, name) => {
              const numeric = typeof value === 'number' ? value : Number(value)
              if (!Number.isFinite(numeric)) return ['—', name]

              if (name === 'yoyPercent') {
                return [
                  `${numeric.toLocaleString('vi-VN', {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                  })}%`,
                  'So với CK',
                ]
              }

              return [formatBarLabel(numeric), 'Thực hiện']
            }}
          />
          <Bar
            yAxisId='value'
            dataKey='value'
            fill={barColor}
            radius={[3, 3, 0, 0]}
            maxBarSize={28}
          >
            <LabelList
              dataKey='value'
              position='top'
              offset={4}
              formatter={(value) => formatBarLabel(Number(value))}
              style={{
                fontSize: 8,
                fontWeight: 700,
                fill: barColor,
              }}
            />
          </Bar>
          <Line
            yAxisId='percent'
            type='monotone'
            dataKey='yoyPercent'
            stroke={lineColor}
            strokeWidth={2}
            dot={{ r: 3, fill: lineColor, strokeWidth: 0 }}
            activeDot={{ r: 4 }}
          >
            <LabelList
              dataKey='yoyPercent'
              position='top'
              offset={10}
              formatter={(value) => formatYoyLabel(Number(value))}
              style={{
                fontSize: 7,
                fontWeight: 700,
                fill: lineColor,
              }}
            />
          </Line>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

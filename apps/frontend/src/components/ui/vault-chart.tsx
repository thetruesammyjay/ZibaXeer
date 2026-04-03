"use client"

import { useEffect, useRef } from 'react'
import { createChart, AreaSeries, type IChartApi, type ISeriesApi } from 'lightweight-charts'

export interface ChartDataPoint {
    time: string  // "YYYY-MM-DD"
    value: number
}

interface VaultChartProps {
    data: ChartDataPoint[]
    positive?: boolean
}

/**
 * Minimal lightweight-charts area chart for vault ROI history.
 * Renders nothing if data is empty — caller should guard.
 */
export function VaultChart({ data, positive = true }: VaultChartProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const chartRef = useRef<IChartApi | null>(null)
    const seriesRef = useRef<ISeriesApi<'Area'> | null>(null)

    useEffect(() => {
        if (!containerRef.current || data.length === 0) return

        const color = positive ? '#10b981' : '#ef4444'
        const colorFaded = positive ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)'

        chartRef.current = createChart(containerRef.current, {
            width: containerRef.current.clientWidth,
            height: 220,
            layout: {
                background: { color: 'transparent' },
                textColor: '#9ca3af',
                fontFamily: 'inherit',
            },
            grid: {
                vertLines: { color: 'rgba(255,255,255,0.04)' },
                horzLines: { color: 'rgba(255,255,255,0.04)' },
            },
            rightPriceScale: {
                borderColor: 'rgba(255,255,255,0.08)',
            },
            timeScale: {
                borderColor: 'rgba(255,255,255,0.08)',
                timeVisible: true,
            },
            crosshair: {
                vertLine: { color: 'rgba(255,255,255,0.2)' },
                horzLine: { color: 'rgba(255,255,255,0.2)' },
            },
        })

        // lightweight-charts v5 API: addSeries(SeriesType, options)
        seriesRef.current = chartRef.current.addSeries(AreaSeries, {
            lineColor: color,
            topColor: colorFaded,
            bottomColor: 'transparent',
            lineWidth: 2,
            priceFormat: {
                type: 'custom',
                formatter: (price: number) => `${price.toFixed(2)}%`,
                minMove: 0.01,
            },
        })

        if (seriesRef.current) seriesRef.current.setData(data)
        chartRef.current.timeScale().fitContent()

        // Resize observer
        const observer = new ResizeObserver(() => {
            if (containerRef.current && chartRef.current) {
                chartRef.current.applyOptions({
                    width: containerRef.current.clientWidth,
                })
            }
        })
        observer.observe(containerRef.current)

        return () => {
            observer.disconnect()
            chartRef.current?.remove()
            chartRef.current = null
            seriesRef.current = null
        }
    }, [data, positive])

    if (data.length === 0) return null

    return <div ref={containerRef} className="w-full rounded-lg overflow-hidden" />
}
